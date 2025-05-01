import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import {
    FaCheck, FaClock, FaInfoCircle, FaTimes, FaPlay,
    FaSearch, FaEye, FaListUl, FaSpinner
} from 'react-icons/fa';

const HomeAll = () => {
    const { currentUser } = useAuth();
    const [animeList, setAnimeList] = useState([]);
    const [userAnimeList, setUserAnimeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTab, setSelectedTab] = useState('recommendations');
    const [showDetails, setShowDetails] = useState(null);
    const [friendActivity, setFriendActivity] = useState([]);

    // New states for search functionality
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sortOrder, setSortOrder] = useState('popularity');
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    fetchAnimeList(),
                    fetchUserAnimeList(),
                    fetchFriendActivity(),
                    fetchGenres()
                ]);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchAnimeList = async () => {
        try {
            const response = await api.get('/anime/all/');
            setAnimeList(response.data.slice(0, 20));
            return response.data;
        } catch (err) {
            console.error('Error fetching anime:', err);
            setError('Failed to load anime recommendations');
            return [];
        }
    };

    const fetchUserAnimeList = async () => {
        try {
            const response = await api.get('/users/anime/');
            setUserAnimeList(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching user anime list:', err);
            return [];
        }
    };

    const fetchFriendActivity = async () => {
        try {
            const response = await api.get('/users/friend-activity/');
            setFriendActivity(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching friend activity:', err);
            return [];
        }
    };

    // New function to fetch genres
    const fetchGenres = async () => {
        try {
            const response = await api.get('/anime/genres/');
            setGenres(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching genres:', err);
            return [];
        }
    };

    // Search functionality
    const searchAnime = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setIsSearching(true);
            setShowSearchModal(true);

            const params = new URLSearchParams({
                q: searchQuery,
                sort: sortOrder,
                ...(selectedGenre && { genre: selectedGenre })
            });

            const response = await api.get(`/anime/search?${params}`);
            setSearchResults(response.data);
        } catch (err) {
            console.error('Error searching anime:', err);
            toast.error('Failed to search anime');
        } finally {
            setIsSearching(false);
        }
    };

    const handleTempDeleteAnime = async (anime) => {
        try {
            const response = await api.post('/users/anime/temp-deleted/', {
                title: anime.title,
                mal_id: anime.mal_id,
                image_url: anime.image_url,
            });

            if (response.status === 201) {
                toast.info('Anime skipped');
                setAnimeList(prevList => prevList.filter(item => item.mal_id !== anime.mal_id));

                // Also remove from search results if present
                if (searchResults.some(item => item.mal_id === anime.mal_id)) {
                    setSearchResults(prevList => prevList.filter(item => item.mal_id !== anime.mal_id));
                }
            } else {
                toast.error('Failed to skip anime');
            }
        } catch (err) {
            console.error('Error skipping anime:', err);
            toast.error('Failed to skip anime');
        }
    };

    const handleAddAnime = async (anime, watched) => {
        try {
            if (userAnimeList.some(item => item.mal_id === anime.mal_id)) {
                toast.info('This anime is already in your list');
                return;
            }

            const response = await api.post('/users/anime/', {
                title: anime.title,
                image_url: anime.image_url,
                mal_id: anime.mal_id,
                watched: watched,
                plan_to_watch: !watched
            });

            if (response.status === 201) {
                toast.success(`Added to ${watched ? 'watched' : 'plan to watch'} list!`);
                await fetchUserAnimeList();

                // Remove from recommendation list if present
                setAnimeList(prevList => prevList.filter(item => item.mal_id !== anime.mal_id));

                // Also remove from search results if present
                if (searchResults.some(item => item.mal_id === anime.mal_id)) {
                    setSearchResults(prevList => prevList.filter(item => item.mal_id !== anime.mal_id));
                }
            } else {
                toast.error('Failed to add anime');
            }
        } catch (err) {
            console.error('Error adding anime:', err);
            toast.error('Failed to add anime');
        }
    };

    const toggleDetails = (id) => {
        setShowDetails(showDetails === id ? null : id);
    };

    const handleTrailer = (trailerUrl) => {
        if (trailerUrl) {
            window.open(trailerUrl, '_blank');
        } else {
            toast.info('No trailer available for this anime');
        }
    };

    // Toggle anime between watched and plan to watch
    const toggleAnimeStatus = async (anime) => {
        try {
            const newStatus = !anime.watched;
            const response = await api.patch(`/users/anime/${anime.id}/`, {
                watched: newStatus,
                plan_to_watch: !newStatus
            });

            if (response.status === 200) {
                toast.success(`Moved to ${newStatus ? 'watched' : 'plan to watch'} list!`);
                await fetchUserAnimeList();
            } else {
                toast.error('Failed to update anime status');
            }
        } catch (err) {
            console.error('Error updating anime status:', err);
            toast.error('Failed to update anime status');
        }
    };

    // Remove anime from user list
    const removeFromList = async (animeId) => {
        try {
            const response = await api.delete(`/users/anime/${animeId}/`);

            if (response.status === 204) {
                toast.success('Removed from your list');
                await fetchUserAnimeList();
            } else {
                toast.error('Failed to remove anime');
            }
        } catch (err) {
            console.error('Error removing anime:', err);
            toast.error('Failed to remove anime');
        }
    };

    const filteredAnimeList = animeList.filter(anime =>
        !userAnimeList.some(userAnime => userAnime.mal_id === anime.mal_id)
    );

    // Split user's anime list into watched and plan to watch
    const watchedAnime = userAnimeList.filter(anime => anime.watched);
    const planToWatchAnime = userAnimeList.filter(anime => anime.plan_to_watch);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 mb-4"></div>
                    <p className="text-xl font-medium">Loading your anime world...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            <div className="container mx-auto px-4 py-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent"
                >
                    AnimeTracker
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-center mb-12 text-gray-300"
                >
                    Discover new anime, track your progress, and connect with friends.
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-10 max-w-3xl mx-auto"
                >
                    <form onSubmit={searchAnime} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for anime..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="popularity">Popular</option>
                                <option value="rating">Rating</option>
                                <option value="newest">Newest</option>
                            </select>

                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">All Genres</option>
                                {genres.map(genre => (
                                    <option key={genre.id} value={genre.id}>{genre.name}</option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                            >
                                {isSearching ? <FaSpinner className="animate-spin" /> : "Search"}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Main Tabs Navigation */}
                <div className="mb-8">
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-6 py-3 rounded-full font-medium flex items-center ${selectedTab === 'recommendations' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' : 'bg-gray-700 hover:bg-gray-600'} transition-all`}
                            onClick={() => setSelectedTab('recommendations')}
                        >
                            <FaListUl className="mr-2" />
                            Recommendations
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-6 py-3 rounded-full font-medium flex items-center ${selectedTab === 'myList' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' : 'bg-gray-700 hover:bg-gray-600'} transition-all`}
                            onClick={() => setSelectedTab('myList')}
                        >
                            <FaEye className="mr-2" />
                            My Anime Lists
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-6 py-3 rounded-full font-medium flex items-center ${selectedTab === 'friends' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' : 'bg-gray-700 hover:bg-gray-600'} transition-all`}
                            onClick={() => setSelectedTab('friends')}
                        >
                            <FaEye className="mr-2" />
                            Friend Activity
                        </motion.button>
                    </div>

                    {/* Recommendations Tab */}
                    {selectedTab === 'recommendations' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700"
                        >
                            {filteredAnimeList.length > 0 ? (
                                <Swiper
                                    effect={'cards'}
                                    grabCursor={true}
                                    modules={[EffectCards, Navigation, Pagination, Autoplay]}
                                    className="mySwiper"
                                    navigation
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                                    style={{ height: '600px', padding: '50px 0' }}
                                >
                                    {filteredAnimeList.map((anime) => (
                                        <SwiperSlide key={anime.mal_id}>
                                            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden h-full flex flex-col shadow-lg border border-gray-700">
                                                <div className="relative">
                                                    <img
                                                        src={anime.image_url}
                                                        alt={anime.title}
                                                        className="w-full h-64 object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
                                                        <h3 className="text-2xl font-bold">{anime.title}</h3>
                                                        {anime.score && (
                                                            <div className="flex items-center">
                                                                <span className="text-yellow-400">★</span>
                                                                <span className="ml-1">{anime.score}/10</span>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap mt-1">
                                                            {anime.genres?.slice(0, 3).map(genre => (
                                                                <span key={genre.name} className="bg-purple-700 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                                                    {genre.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 flex-grow">
                                                    <div className="flex justify-between mb-3">
                                                        <div>
                                                            <span className="text-gray-400 text-sm">Episodes: </span>
                                                            <span className="text-sm font-medium">{anime.episodes || 'Unknown'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400 text-sm">Year: </span>
                                                            <span className="text-sm font-medium">{anime.aired?.year || 'Unknown'}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleDetails(anime.mal_id)}
                                                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center mb-3 transition-colors"
                                                    >
                                                        <FaInfoCircle className="mr-1" />
                                                        {showDetails === anime.mal_id ? 'Hide details' : 'Show details'}
                                                    </button>

                                                    {showDetails === anime.mal_id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <p className="text-sm text-gray-300 mb-4 overflow-y-auto max-h-28 leading-relaxed">
                                                                {anime.synopsis || 'No synopsis available.'}
                                                            </p>
                                                        </motion.div>
                                                    )}

                                                    {anime.trailer_url && (
                                                        <button
                                                            onClick={() => handleTrailer(anime.trailer_url)}
                                                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors"
                                                        >
                                                            <FaPlay className="mr-1" />
                                                            Watch Trailer
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="p-4 bg-gray-900 flex justify-between">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleTempDeleteAnime(anime)}
                                                        className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                                                    >
                                                        <FaTimes className="mr-2" />
                                                        Skip
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleAddAnime(anime, true)}
                                                        className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                                                    >
                                                        <FaCheck className="mr-2" />
                                                        Watched
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleAddAnime(anime, false)}
                                                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                                                    >
                                                        <FaClock className="mr-2" />
                                                        Plan to Watch
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <div className="bg-gray-800 p-12 rounded-lg text-center">
                                    <p className="text-xl">No recommendations available. Try exploring with the search bar above!</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Friends Tab */}
                    {selectedTab === 'friends' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700"
                        >
                            <h2 className="text-2xl font-semibold mb-6 text-center">Friend Activity</h2>
                            <p className="text-center text-lg text-gray-300">Your friends activity will appear here once you start connecting with other anime fans.</p>
                            <div className="flex justify-center mt-8">
                                <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors">
                                    Find Friends
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* My List Tab */}
                    {selectedTab === 'myList' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                        >
                            {/* Watched Anime Section */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                                    <FaCheck className="mr-2 text-green-500" />
                                    Watched Anime
                                </h2>

                                {watchedAnime.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {watchedAnime.map((anime) => (
                                            <motion.div
                                                key={anime.id}
                                                whileHover={{ y: -5 }}
                                                className="bg-gray-700 rounded-lg overflow-hidden shadow-md border border-gray-600 flex flex-col"
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={anime.image_url}
                                                        alt={anime.title}
                                                        className="w-full h-40 object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute top-0 right-0 m-2">
                                                        <button
                                                            onClick={() => removeFromList(anime.id)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded-full text-xs transition-colors"
                                                            title="Remove from list"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-3 flex-grow">
                                                    <p className="font-medium text-sm line-clamp-2" title={anime.title}>
                                                        {anime.title}
                                                    </p>
                                                </div>
                                                <div className="p-2 bg-gray-800 flex justify-center">
                                                    <button
                                                        onClick={() => toggleAnimeStatus(anime)}
                                                        className="w-full py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center"
                                                    >
                                                        <FaClock className="mr-1" />
                                                        Move to Plan
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-gray-700 rounded-lg">
                                        <p className="text-lg text-gray-300">You haven't marked any anime as watched yet.</p>
                                        <p className="mt-2 text-gray-400">Use the search bar to find anime you've watched!</p>
                                    </div>
                                )}
                            </div>

                            {/* Plan to Watch Anime Section */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                                    <FaClock className="mr-2 text-blue-500" />
                                    Plan to Watch
                                </h2>

                                {planToWatchAnime.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {planToWatchAnime.map((anime) => (
                                            <motion.div
                                                key={anime.id}
                                                whileHover={{ y: -5 }}
                                                className="bg-gray-700 rounded-lg overflow-hidden shadow-md border border-gray-600 flex flex-col"
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={anime.image_url}
                                                        alt={anime.title}
                                                        className="w-full h-40 object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute top-0 right-0 m-2">
                                                        <button
                                                            onClick={() => removeFromList(anime.id)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded-full text-xs transition-colors"
                                                            title="Remove from list"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-3 flex-grow">
                                                    <p className="font-medium text-sm line-clamp-2" title={anime.title}>
                                                        {anime.title}
                                                    </p>
                                                </div>
                                                <div className="p-2 bg-gray-800 flex justify-center">
                                                    <button
                                                        onClick={() => toggleAnimeStatus(anime)}
                                                        className="w-full py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center justify-center"
                                                    >
                                                        <FaCheck className="mr-1" />
                                                        Mark Watched
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-gray-700 rounded-lg">
                                        <p className="text-lg text-gray-300">Your plan to watch list is empty.</p>
                                        <p className="mt-2 text-gray-400">Discover new anime to add to your watchlist!</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Search Results Modal */}
            {showSearchModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSearchModal(false)}
                >
                    <div
                        className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-2xl font-semibold">
                                Search Results: {searchQuery}
                            </h2>
                            <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => setShowSearchModal(false)}
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
                            {isSearching ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {searchResults.map((anime) => (
                                        <motion.div
                                            key={anime.mal_id}
                                            whileHover={{ y: -5 }}
                                            className="bg-gray-700 rounded-lg overflow-hidden shadow-md border border-gray-600 flex flex-col"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={anime.image_url}
                                                    alt={anime.title}
                                                    className="w-full h-40 object-cover"
                                                    loading="lazy"
                                                />
                                                {anime.score && (
                                                    <div className="absolute top-0 left-0 m-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                                                        <span className="text-yellow-400">★</span> {anime.score}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 flex-grow">
                                                <p className="font-medium text-sm line-clamp-2" title={anime.title}>
                                                    {anime.title}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {anime.type || 'TV'} • {anime.episodes || '?'} ep • {anime.aired?.year || '?'}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-gray-800 flex justify-between space-x-1">
                                                <button
                                                    onClick={() => handleAddAnime(anime, true)}
                                                    className="flex-1 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center justify-center"
                                                >
                                                    <FaCheck className="mr-1" />
                                                    Watched
                                                </button>
                                                <button
                                                    onClick={() => handleAddAnime(anime, false)}
                                                    className="flex-1 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center"
                                                >
                                                    <FaClock className="mr-1" />
                                                    Plan
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <p className="text-xl">No results found for "{searchQuery}"</p>
                                    <p className="mt-2 text-gray-400">Try a different search term or adjust your filters</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeAll;
