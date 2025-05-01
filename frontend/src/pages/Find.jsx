import React, {useEffect, useState} from "react";
import {FaCog} from "react-icons/fa";
import api from "../api";
import Swal from 'sweetalert2';
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {useNavigate} from 'react-router-dom';

// List of anime genres
const allGenres = [
    "Action", "Adventure", "Avant Garde", "Award Winning", "Boys Love",
    "Comedy", "Drama", "Fantasy", "Girls Love", "Gourmet", "Horror",
    "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports",
    "Supernatural", "Suspense"
];

function Find() {
    const navigate = useNavigate();
    const [showPreferences, setShowPreferences] = useState(false);
    const username = localStorage.getItem('username');
    const [anime, setAnime] = useState([]);
    const [randomAnime, setRandomAnime] = useState(null);
    const [showSynopsis, setShowSynopsis] = useState(false);
    const [filteredAnime, setFilteredAnime] = useState([]);
    const [userGenres, setUserGenres] = useState([]);
    const [selectedScore, setSelectedScore] = useState(3);
    const [userAnime, setUserAnime] = useState([]);
    const [tempDeletedAnime, setTempDeletedAnime] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const id = localStorage.getItem('user_id');
    const [profileData, setProfileData] = useState({
        pfp: '',
        nickname: '',
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchAnime(),
                    fetchUserAnimeList(),
                    fetchUserProfile(),
                    fetchTempDeletedAnime(),
                    fetchQuotes()
                ]);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error("Failed to load some data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (anime.length > 0) {
            filterAnime(anime, selectedScore, userGenres);
        }
    }, [anime, userGenres, selectedScore, tempDeletedAnime, userAnime]);

    const fetchAnime = async () => {
        try {
            const response = await api.get("anime/all/");
            if (Array.isArray(response.data)) {
                setAnime(response.data);
                getRandomAnime(response.data);
                filterAnime(response.data, selectedScore, userGenres);
                return response.data;
            } else {
                console.error("Response data is not an array:", response.data);
                return [];
            }
        } catch (error) {
            console.error("There was an error fetching the anime!", error);
            return [];
        }
    };

    const fetchUserAnimeList = async () => {
        try {
            const response = await api.get("users/anime/");
            if (Array.isArray(response.data)) {
                setUserAnime(response.data);
                return response.data;
            } else {
                console.error("Response data is not an array:", response.data);
                return [];
            }
        } catch (error) {
            console.error("There was an error fetching user anime list:", error);
            return [];
        }
    };

    const fetchUserProfile = async () => {
        try {
            const {data} = await api.get(`/users/profile/${id}/`);
            setProfileData(prev => ({
                ...prev,
                pfp: data.profile_image,
                nickname: data.username
            }));
            return data;
        } catch (error) {
            console.error("Error fetching user profile", error);
            return null;
        }
    };

    const fetchTempDeletedAnime = async () => {
        try {
            const response = await api.get("users/anime/temp-deleted/");
            if (Array.isArray(response.data)) {
                setTempDeletedAnime(response.data);
                return response.data;
            } else {
                console.error("Response data is not an array:", response.data);
                return [];
            }
        } catch (error) {
            console.error("There was an error fetching temporarily deleted anime:", error);
            return [];
        }
    };

    const fetchQuotes = async () => {
        try {
            const response = await api.get("anime/quotes/");
            if (Array.isArray(response.data)) {
                setQuotes(getRandomQuotes(response.data));
                return response.data;
            } else {
                console.error("Response data is not an array:", response.data);
                return [];
            }
        } catch (error) {
            console.error("There was an error fetching the quotes:", error);
            return [];
        }
    };

    const getRandomQuotes = (quotesList) => {
        return quotesList.sort(() => 0.5 - Math.random()).slice(0, 4);
    };

    const handleTempDeleteAnime = async (anime) => {
        try {
            const response = await api.post("users/anime/temp-deleted/", {
                title: anime.title,
                mal_id: anime.mal_id,
                image_url: anime.image_url,
            });
            if (response.status === 201) {
                toast.success('Anime skipped');
                await fetchTempDeletedAnime();
                getRandomAnime(filteredAnime);
            } else {
                toast.error('Failed to skip anime');
            }
        } catch (error) {
            console.error("Error skipping anime:", error);
            toast.error('Failed to skip anime');
        }
    };

    const getRandomAnime = (animeList) => {
        if (!animeList || animeList.length === 0) {
            setRandomAnime(null);
            return;
        }
        const filteredList = animeList.filter(a => {
            const notTempDeleted = !tempDeletedAnime.some(tda => tda.mal_id === a.mal_id);
            const notUserAnime = !userAnime.some(ua => ua.mal_id === a.mal_id);
            return notTempDeleted && notUserAnime;
        });

        if (filteredList.length === 0) {
            setRandomAnime(null);
            return;
        }

        setRandomAnime(filteredList[Math.floor(Math.random() * filteredList.length)]);
    };

    const filterAnime = (animeList, score, genres) => {
        if (!animeList) return;

        const filtered = animeList.filter((a) => {
            const notTempDeleted = !tempDeletedAnime.some((tda) => tda.mal_id === a.mal_id);
            const notUserAnime = !userAnime.some((ua) => ua.mal_id === a.mal_id);
            const meetsScore = a.score >= score;
            const meetsGenres = genres.length > 0
                ? a.genres.some((g) => genres.includes(g.name))
                : true;
            return meetsScore && meetsGenres && notUserAnime && notTempDeleted;
        });

        setFilteredAnime(filtered);
        getRandomAnime(filtered);
    };

    const togglePreferences = () => setShowPreferences(!showPreferences);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleAddAnimeClick = async (anime) => {
        const status = await showPopup();
        if (status !== null) {
            await handleAddAnime(anime, status);
            Swal.fire(`Added to ${status ? 'watched' : 'plan to watch'}!`, '', 'success');
            getRandomAnime(filteredAnime);
        } else {
            Swal.fire('Cancelled!', '', 'info');
        }
    };

    const showPopup = () => {
        return Swal.fire({
            title: 'Add to:',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Watched',
            denyButtonText: 'Plan to watch',
            confirmButtonColor: '#10B981',
            denyButtonColor: '#6366F1',
            cancelButtonColor: '#EF4444',
            background: '#1F2937',
            color: '#FFFFFF',
        }).then((result) => result.isConfirmed ? true : result.isDenied ? false : null);
    };

    const handleAddAnime = async (anime, watchStatus) => {
        if (userAnime.some(item => item.mal_id === anime.mal_id)) {
            Swal.fire({
                title: 'Anime already exists in your list.',
                icon: 'error',
                background: '#1F2937',
                color: '#FFFFFF'
            });
            return;
        }

        try {
            const response = await api.post("users/anime/", {
                title: anime.title,
                image_url: anime.image_url,
                mal_id: anime.mal_id,
                watched: watchStatus,
                plan_to_watch: !watchStatus
            });

            if (response.status === 201) {
                Swal.fire({
                    title: 'Anime added successfully',
                    icon: 'success',
                    background: '#1F2937',
                    color: '#FFFFFF'
                });
                await fetchUserAnimeList();
            } else {
                Swal.fire({
                    title: 'Failed to add anime',
                    icon: 'error',
                    background: '#1F2937',
                    color: '#FFFFFF'
                });
            }
        } catch (error) {
            console.error("Error adding anime:", error);
            Swal.fire({
                title: 'Error adding anime',
                icon: 'error',
                background: '#1F2937',
                color: '#FFFFFF'
            });
        }
    };

    const handleTrailer = () => {
        if (randomAnime?.trailer_url) {
            window.open(randomAnime.trailer_url);
        } else {
            Swal.fire({
                title: 'No trailer available',
                icon: 'info',
                background: '#1F2937',
                color: '#FFFFFF'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 min-h-screen text-white">
            {/* Header */}
            <header className="bg-violet-800 text-white py-4 shadow-lg">
                <div className="container mx-auto flex items-center px-4">
                    <h1 className="text-4xl font-bold tracking-wide">AniTinder</h1>
                    <div className="ml-auto flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/animelist')}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full transition-all"
                        >
                            Anime List
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-full transition-all"
                        >
                            Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 transition-all py-2 px-5 rounded-full text-sm font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Box */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg relative">
                    <button
                        className="bg-gray-700 p-3 rounded-full shadow-md absolute top-4 right-4 hover:bg-gray-600 transition-all"
                        onClick={togglePreferences}
                    >
                        <FaCog className="text-2xl text-violet-400"/>
                    </button>

                    <div className="flex flex-col items-center">
                        <img
                            src={profileData.pfp}
                            alt="Profile"
                            className="w-32 h-32 rounded-full mb-4 object-cover shadow-lg border-2 border-violet-500"
                        />
                        <p className="text-center font-semibold text-xl mb-2">Welcome, <span className="text-violet-400">{profileData.nickname || username}</span></p>
                    </div>

                    {showPreferences && (
                        <div className="mt-6 bg-gray-700 p-6 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-4 text-violet-300">Filter Preferences</p>

                            {/* Filter by Genres */}
                            <div className="mb-6">
                                <p className="font-semibold text-sm mb-2">Filter by genres:</p>
                                <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto pr-2 scrollbar">
                                    {allGenres.map((g, index) => (
                                        <label key={index} className="flex items-center space-x-2 mb-1">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-violet-500 rounded border-gray-500"
                                                checked={userGenres.includes(g)}
                                                onChange={() => {
                                                    const updatedGenres = userGenres.includes(g)
                                                        ? userGenres.filter((gen) => gen !== g)
                                                        : [...userGenres, g];
                                                    setUserGenres(updatedGenres);
                                                }}
                                            />
                                            <span className="text-sm">{g}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filter by Score */}
                            <div>
                                <label htmlFor="score" className="font-semibold text-sm block mb-2">
                                    Minimum Score:
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={selectedScore}
                                        onChange={(e) => setSelectedScore(parseFloat(e.target.value))}
                                        className="w-full accent-violet-500"
                                    />
                                    <span className="bg-violet-600 px-2 py-1 rounded-md min-w-[40px] text-center">
                                        {selectedScore}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Anime Display */}
                <div className="flex items-center justify-center">
                    {randomAnime ? (
                        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-md w-full">
                            <div className="relative h-64 bg-gray-700">
                                <img
                                    src={randomAnime.image_url}
                                    alt={randomAnime.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 bg-violet-600 text-white text-sm font-bold px-2 py-1 rounded">
                                    ★ {randomAnime.score}
                                </div>
                            </div>

                            <div className="p-6">
                                <h2 className="text-2xl font-semibold mb-2 text-violet-300">{randomAnime.title}</h2>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {randomAnime.genres.map(g => (
                                        <span key={g.id} className="bg-violet-900 text-violet-200 text-xs px-2 py-1 rounded">
                                            {g.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                                    <span>{randomAnime.episodes} episodes</span>
                                    <span>{randomAnime.year || 'Unknown year'}</span>
                                </div>

                                {showSynopsis && (
                                    <div className="mb-4 mt-2 text-gray-300 bg-gray-700 p-3 rounded-lg max-h-40 overflow-y-auto">
                                        <p>{randomAnime.synopsis}</p>
                                    </div>
                                )}

                                <button
                                    className="text-violet-400 hover:text-violet-300 text-sm mb-4"
                                    onClick={() => setShowSynopsis(!showSynopsis)}
                                >
                                    {showSynopsis ? "Hide Synopsis" : "Show Synopsis"}
                                </button>

                                <div className="flex space-x-3 mt-2">
                                    <button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all"
                                        onClick={() => handleTempDeleteAnime(randomAnime)}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-all"
                                        onClick={() => handleAddAnimeClick(randomAnime)}
                                    >
                                        Like
                                    </button>
                                    {randomAnime.trailer_url && (
                                        <button
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all"
                                            onClick={handleTrailer}
                                        >
                                            Trailer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center bg-gray-800 p-8 rounded-xl shadow-lg">
                            <h3 className="text-xl font-semibold mb-4 text-violet-300">No more anime to show</h3>
                            <p className="text-gray-400 mb-6">Try adjusting your filter preferences</p>
                            <img
                                src="https://media.giphy.com/media/fscIxPfKjPyShbwUS5/giphy.gif"
                                alt="No anime found"
                                className="mx-auto rounded-lg shadow-md max-w-xs"
                            />
                        </div>
                    )}
                </div>

                {/* Quotes Section */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-center text-violet-300">Anime Quotes</h3>

                    <div className="space-y-4">
                        {quotes.length > 0 ? (
                            quotes.map((quote, index) => (
                                <div key={index} className="bg-gray-700 p-4 rounded-lg shadow">
                                    <p className="text-gray-300 italic mb-2">"{quote.quote}"</p>
                                    <div className="flex justify-between text-sm">
                                        <p className="text-violet-400 font-semibold">— {quote.character}</p>
                                        <p className="text-gray-400">from <span className="text-violet-400">{quote.anime}</span></p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 p-4">
                                <p>No quotes available right now</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default Find;