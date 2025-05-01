import React, {useEffect, useState} from "react";
import {useParams, useNavigate} from 'react-router-dom';
import api from "../api";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function AnimeListAll() {
    const {userId} = useParams();
    const navigate = useNavigate();
    const [userAnimeList, setUserAnimeList] = useState([]);
    const [profileData, setProfileData] = useState({
        bio: "",
        pfp: "",
        nickname: "",
        is_public: false,
        user_id: userId,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!userId) {
            setError("User not found");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchUserAnimeList(),
                    fetchUserProfile()
                ]);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load anime list data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const fetchUserAnimeList = async () => {
        try {
            const response = await api.get(`users/anime/username/${userId}/`);
            if (Array.isArray(response.data)) {
                setUserAnimeList(response.data);
            } else {
                console.error("Response data is not an array:", response.data);
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("There was an error fetching the user anime list!", error);
            throw error;
        }
    };

    const fetchUserProfile = async () => {
        try {
            const {data} = await api.get(`/users/profile/${userId}/`);
            setProfileData(prev => ({
                ...prev,
                bio: data.bio,
                pfp: data.profile_image,
                nickname: data.username,
                is_public: data.anime_list_public,
            }));
        } catch (error) {
            console.error("Error fetching user profile", error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="bg-violet-600 hover:bg-violet-700 text-white py-2 px-6 rounded-lg transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (!profileData.is_public) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <button
                    onClick={() => navigate('/home')}
                    className="bg-violet-700 text-white m-4 p-2 rounded absolute top-0 left-0 hover:bg-violet-800 transition-all"
                >
                    Back to Home
                </button>
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md text-center">
                    <div className="flex justify-center mb-6">
                        <img src={profileData.pfp} alt="Profile" className="w-32 h-32 rounded-full object-cover border-2 border-violet-500"/>
                    </div>
                    <h2 className="text-2xl font-bold text-violet-400 mb-2">
                        {profileData.nickname}
                    </h2>
                    <p className="text-gray-300 mb-6">
                        {profileData.bio}
                    </p>
                    <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg mb-6">
                        <p className="text-lg font-bold">This user's anime list is private</p>
                    </div>
                    <button
                        onClick={() => navigate(`/profile/${profileData.user_id}`)}
                        className="bg-violet-600 hover:bg-violet-700 text-white py-2 px-6 rounded-lg transition-colors"
                    >
                        Back to Profile
                    </button>

                    <div className="mt-8">
                        <iframe
                            src="https://giphy.com/embed/AOitRwIgx2wcOxZaIH"
                            width="280"
                            height="280"
                            frameBorder="0"
                            allowFullScreen
                            className="mx-auto rounded-lg"
                        ></iframe>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-20 text-white">
            <button
                onClick={() => navigate('/home')}
                className="bg-violet-700 text-white m-4 p-2 rounded absolute top-0 left-0 hover:bg-violet-800 transition-all"
            >
                Back to Home
            </button>

            <div className="container mx-auto p-4">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src={profileData.pfp}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-violet-500"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-violet-400 mb-2">
                        {profileData.nickname}'s Anime Collection
                    </h1>
                    <p className="text-gray-300 mb-4">
                        {profileData.bio}
                    </p>
                    <button
                        onClick={() => navigate(`/profile/${profileData.user_id}`)}
                        className="bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        View Profile
                    </button>
                </div>

                {/* Watched Anime Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-violet-400 border-b border-gray-700 pb-2">
                        Watched Anime
                    </h2>

                    {userAnimeList.filter(anime => anime.watched).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {userAnimeList
                                .filter(anime => anime.watched)
                                .map((anime) => (
                                    <div
                                        key={anime.mal_id}
                                        className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 transition-colors"
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
                                            <h3 className="text-sm font-medium">{anime.title}</h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Added: {new Date(anime.add_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8 bg-gray-800 rounded-lg">
                            No watched anime found.
                        </p>
                    )}
                </div>

                {/* Plan to Watch Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-violet-400 border-b border-gray-700 pb-2">
                        Plan to Watch
                    </h2>

                    {userAnimeList.filter(anime => anime.plan_to_watch).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {userAnimeList
                                .filter(anime => anime.plan_to_watch)
                                .map((anime) => (
                                    <div
                                        key={anime.mal_id}
                                        className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 transition-colors"
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
                                            <h3 className="text-sm font-medium">{anime.title}</h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Added: {new Date(anime.add_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8 bg-gray-800 rounded-lg">
                            No plan to watch anime found.
                        </p>
                    )}
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        </div>
    );
}

export default AnimeListAll;