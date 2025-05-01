import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Swal from 'sweetalert2';
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function AnimeList() {
    const navigate = useNavigate();
    const [animes, setAnimes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredAnimes, setFilteredAnimes] = useState([]);
    const [tmpDeleteAnime, setTmpDeleteAnime] = useState([]);
    const [showTmpDeleteAnime, setShowTmpDeleteAnime] = useState(false);
    const [showAnimeList, setShowAnimeList] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [userAnimeList, setUserAnimeList] = useState([]);
    const [showUserAnimeList, setShowUserAnimeList] = useState(false);
    const [showUserPlanToWatchList, setShowUserPlanToWatchList] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchAllAnime(),
                    fetchUserAnimeList(),
                    fetchUserTmpDeleteAnime()
                ]);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error("Failed to load anime data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleSearchChange = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        const userAnimeIds = userAnimeList.map(anime => anime.mal_id);
        const filtered = animes.filter(anime =>
            anime.title.toLowerCase().includes(searchTerm) && !userAnimeIds.includes(anime.mal_id)
        );
        setFilteredAnimes(filtered);
        setShowSearchResults(searchTerm.length > 0);
    };

    const fetchAllAnime = async () => {
        try {
            const response = await api.get("anime/all/");
            if (Array.isArray(response.data)) {
                setAnimes(response.data);
                setFilteredAnimes(response.data);
            } else {
                console.error("Response data is not an array:", response.data);
                toast.error("Failed to fetch anime data");
            }
        } catch (error) {
            console.error("There was an error fetching the titles!", error);
            toast.error("Failed to fetch anime data");
        }
    };

    const fetchUserAnimeList = async () => {
        try {
            const response = await api.get("users/anime/");
            if (Array.isArray(response.data)) {
                setUserAnimeList(response.data);
            } else {
                console.error("Response data is not an array:", response.data);
                toast.error("Failed to fetch your anime list");
            }
        } catch (error) {
            console.error("There was an error fetching the user anime list!", error);
            toast.error("Failed to fetch your anime list");
        }
    };

    const fetchUserTmpDeleteAnime = async () => {
        try {
            const response = await api.get("users/anime/temp-deleted/");
            if (Array.isArray(response.data)) {
                setTmpDeleteAnime(response.data);
            } else {
                console.error("Response data is not an array:", response.data);
                toast.error("Failed to fetch deleted anime");
            }
        } catch (error) {
            console.error("There was an error fetching the temporary deleted anime!", error);
            toast.error("Failed to fetch deleted anime");
        }
    };

    const handleAddAnime = async (anime, watched) => {
        if (userAnimeList.some(item => item.mal_id === anime.mal_id)) {
            toast.error("Anime already exists in your list");
            return;
        }

        try {
            const response = await api.post("users/anime/", {
                title: anime.title,
                image_url: anime.image_url,
                mal_id: anime.mal_id,
                watched: watched,
                plan_to_watch: !watched
            });

            if (response.status === 201) {
                toast.success("Anime added successfully");
                await fetchUserAnimeList();
            } else {
                toast.error("Failed to add anime");
            }
        } catch (error) {
            console.error("Error adding anime:", error);
            toast.error("Failed to add anime");
        } finally {
            setShowSearchResults(false);
            setSearchTerm("");
        }
    };

    const handleWatchChange = async (anime, watched) => {
        try {
            const response = await api.put(`users/anime/update/${anime.mal_id}/`, {
                watched: watched,
                plan_to_watch: !watched
            });

            if (response.status === 200) {
                toast.success("Anime status updated successfully");
                await fetchUserAnimeList();
            } else {
                toast.error("Failed to change anime status");
            }
        } catch (error) {
            console.error("Error updating anime status:", error);
            toast.error("Failed to change anime status");
        }
    };

    const handleAnimeClick = async (anime) => {
        if (userAnimeList.some(item => item.mal_id === anime.mal_id)) {
            toast.error("Anime already in your list");
            return;
        }

        const result = await showPopupAdd();

        if (result === true) {
            await handleAddAnime(anime, true);
            toast.success("Added to watched!");
        } else if (result === false) {
            await handleAddAnime(anime, false);
            toast.success("Added to plan to watch!");
        }
    };

    const handleDeleteClick = async (anime) => {
        const result = await showPopupChange(anime.watched);

        if (result === true) {
            await handleWatchChange(anime, !anime.watched);
            toast.success("Status updated successfully!");
        } else if (result === false) {
            await handleDeleteAnime(anime.id);
            toast.success("Anime deleted successfully!");
        }
    };

    const handleDeleteAnime = async (animeId) => {
        try {
            const response = await api.delete(`users/anime/delete/${animeId}/`);
            if (response.status === 204) {
                await fetchUserAnimeList();
                toast.success("Anime deleted successfully");
            } else {
                toast.error("Failed to delete anime");
            }
        } catch (error) {
            console.error("Error deleting anime:", error);
            toast.error("Failed to delete anime");
        }
    };

    const handleDeleteTmpAnime = async (anime) => {
        const result = await Swal.fire({
            title: 'Delete from history?',
            text: `Do you want to permanently delete ${anime.title} from your history?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            background: '#1F2937',
            color: '#FFFFFF'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.delete(`users/anime/temp-deleted/${anime.id}/`);
                if (response.status === 204) {
                    await fetchUserTmpDeleteAnime();
                    toast.success("Deleted anime removed from history");
                } else {
                    toast.error("Failed to remove from history");
                }
            } catch (error) {
                console.error("Error deleting anime from history:", error);
                toast.error("Failed to remove from history");
            }
        }
    };

    const handleDeleteAllTmpAnime = async () => {
        const result = await Swal.fire({
            title: 'Clear entire history?',
            text: 'Do you want to permanently delete all skipped anime from your history?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete all!',
            cancelButtonText: 'No, keep them',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            background: '#1F2937',
            color: '#FFFFFF'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.delete(`users/anime/temp-deleted/delete-all/${localStorage.getItem("user_id")}/`);
                if (response.status === 204) {
                    await fetchUserTmpDeleteAnime();
                    toast.success("History cleared successfully");
                } else {
                    toast.error("Failed to clear history");
                }
            } catch (error) {
                console.error("Error clearing history:", error);
                toast.error("Failed to clear history");
            }
        }
    };

    const showPopupAdd = () => {
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
            color: '#FFFFFF'
        }).then((result) => {
            if (result.isConfirmed) {
                return true;
            } else if (result.isDenied) {
                return false;
            } else {
                return null;
            }
        });
    };

    const showPopupChange = (currentStatus) => {
        const newStatus = currentStatus ? 'plan to watch' : 'watched';

        return Swal.fire({
            title: 'Options:',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: `Move to ${newStatus}`,
            denyButtonText: 'Delete',
            confirmButtonColor: '#6366F1',
            denyButtonColor: '#EF4444',
            cancelButtonColor: '#9CA3AF',
            background: '#1F2937',
            color: '#FFFFFF'
        }).then((result) => {
            if (result.isConfirmed) {
                return true;
            } else if (result.isDenied) {
                return false;
            } else {
                return null;
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-20 text-white">
            <button
                onClick={() => navigate('/home')}
                className="bg-violet-700 text-white m-4 p-2 rounded mb-4 absolute top-0 left-0 hover:bg-violet-800 transition-all"
            >
                Back to Home
            </button>

            <div className="container mx-auto p-4">
                <h1 className="text-4xl font-bold text-center mb-8 text-violet-400">My Anime Collection</h1>

                {/* Search box */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search for new anime to add..."
                        className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                {/* Search results */}
                {showSearchResults && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg mt-2 p-2 mb-6 max-h-60 overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-2 text-violet-400">Search Results</h2>
                        {filteredAnimes.length > 0 ? (
                            <ul>
                                {filteredAnimes.slice(0, 20).map((anime) => (
                                    <li
                                        key={anime.mal_id}
                                        className="p-2 hover:bg-gray-700 cursor-pointer rounded flex items-center"
                                        onClick={() => handleAnimeClick(anime)}
                                    >
                                        {anime.image_url && (
                                            <img
                                                src={anime.image_url}
                                                alt={anime.title}
                                                className="w-10 h-10 object-cover rounded mr-2"
                                            />
                                        )}
                                        <span>{anime.title}</span>
                                        <span className="ml-2 text-sm text-gray-400">
                                            ({anime.score ? `★${anime.score}` : 'No score'})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 p-2">No results found</p>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-medium transition-colors"
                        onClick={() => setShowAnimeList(!showAnimeList)}
                    >
                        {showAnimeList ? "Hide All Anime" : "Browse All Anime"}
                    </button>

                    <button
                        className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-lg font-medium transition-colors"
                        onClick={() => setShowTmpDeleteAnime(!showTmpDeleteAnime)}
                    >
                        {showTmpDeleteAnime ? "Hide Skipped Anime" : "View Skipped Anime"}
                    </button>

                    <button
                        className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-medium transition-colors"
                        onClick={() => {
                            setShowUserAnimeList(!showUserAnimeList);
                            if (showUserPlanToWatchList) setShowUserPlanToWatchList(false);
                        }}
                    >
                        {showUserAnimeList ? "Hide Watched Anime" : "View Watched Anime"}
                    </button>

                    <button
                        className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg font-medium transition-colors"
                        onClick={() => {
                            setShowUserPlanToWatchList(!showUserPlanToWatchList);
                            if (showUserAnimeList) setShowUserAnimeList(false);
                        }}
                    >
                        {showUserPlanToWatchList ? "Hide Plan to Watch" : "View Plan to Watch"}
                    </button>
                </div>

                {/* All Anime Browse Grid */}
                {showAnimeList && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-violet-400">Browse All Anime</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredAnimes.slice(0, 50).map((anime) => (
                                <div
                                    key={anime.mal_id}
                                    className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 cursor-pointer transition-colors"
                                    onClick={() => handleAnimeClick(anime)}
                                >
                                    <div className="h-48 bg-gray-700 relative">
                                        {anime.image_url ? (
                                            <img
                                                src={anime.image_url}
                                                alt={anime.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-gray-500">No Image</span>
                                            </div>
                                        )}
                                        {anime.score && (
                                            <div className="absolute top-1 right-1 bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded">
                                                ★ {anime.score}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-medium truncate">{anime.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Temporary Deleted Anime */}
                {showTmpDeleteAnime && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-violet-400">Skipped Anime History</h2>
                            {tmpDeleteAnime.length > 0 && (
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                                    onClick={handleDeleteAllTmpAnime}
                                >
                                    Clear History
                                </button>
                            )}
                        </div>

                        {tmpDeleteAnime.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {tmpDeleteAnime.map((anime) => (
                                    <div
                                        key={anime.id}
                                        className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 cursor-pointer transition-colors"
                                        onClick={() => handleDeleteTmpAnime(anime)}
                                    >
                                        <div className="h-48 bg-gray-700">
                                            {anime.image_url ? (
                                                <img
                                                    src={anime.image_url}
                                                    alt={anime.title}
                                                    className="w-full h-full object-cover opacity-70"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-gray-500">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="text-sm font-medium truncate">{anime.title}</h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Click to remove from history
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8 bg-gray-800 rounded-lg">
                                No skipped anime in your history
                            </p>
                        )}
                    </div>
                )}

                {/* Watched Anime List */}
                {showUserAnimeList && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-violet-400">My Watched Anime</h2>

                        {userAnimeList.filter(anime => anime.watched).length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {userAnimeList
                                    .filter(anime => anime.watched)
                                    .map((anime) => (
                                        <div
                                            key={anime.mal_id}
                                            className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 cursor-pointer transition-colors"
                                            onClick={() => handleDeleteClick(anime)}
                                        >
                                            <div className="h-48 bg-gray-700 relative">
                                                {anime.image_url ? (
                                                    <img
                                                        src={anime.image_url}
                                                        alt={anime.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-gray-500">No Image</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-2 py-1">
                                                    Watched
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-medium truncate">{anime.title}</h3>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Click to change status
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8 bg-gray-800 rounded-lg">
                                You haven't added any watched anime yet
                            </p>
                        )}
                    </div>
                )}

                {/* Plan to Watch List */}
                {showUserPlanToWatchList && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-violet-400">My Plan to Watch</h2>

                        {userAnimeList.filter(anime => anime.plan_to_watch).length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {userAnimeList
                                    .filter(anime => anime.plan_to_watch)
                                    .map((anime) => (
                                        <div
                                            key={anime.mal_id}
                                            className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 cursor-pointer transition-colors"
                                            onClick={() => handleDeleteClick(anime)}
                                        >
                                            <div className="h-48 bg-gray-700 relative">
                                                {anime.image_url ? (
                                                    <img
                                                        src={anime.image_url}
                                                        alt={anime.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-gray-500">No Image</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-1">
                                                    Plan to Watch
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-medium truncate">{anime.title}</h3>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Click to change status
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8 bg-gray-800 rounded-lg">
                                You haven't added any anime to your plan to watch list
                            </p>
                        )}
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        </div>
    );
}

export default AnimeList;