import React, {useEffect, useRef, useState} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function Profile() {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        bio: '',
        pfp: '',
        nickname: '',
        recentAnime: [],
        friendRequests: [],
        requestProfiles: [],
        friends: [],
        friendProfiles: [],
        following: [],
        followingProfiles: []
    });
    const [allUsers, setAllUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const searchResultsRef = useRef(null);
    const id = localStorage.getItem('user_id');

    useEffect(() => {
        if (!id) {
            console.error("User ID not found in localStorage");
            navigate('/login');
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchUserProfile(),
                    fetchRecentAnime(),
                    fetchAllUsers(),
                    fetchFriendRequests(),
                    fetchUserFriends(),
                    fetchFollowing()
                ]);
            } catch (error) {
                console.error("Error fetching profile data:", error);
                toast.error("Failed to load profile data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [id, navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
                setSearchResults([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchUserProfile = async () => {
        try {
            const {data} = await api.get(`/users/profile/${id}/`);
            setProfileData(prev => ({
                ...prev,
                bio: data.bio,
                pfp: data.profile_image,
                nickname: data.username
            }));
            return data;
        } catch (error) {
            console.error("Error fetching user profile", error);
            throw error;
        }
    };

    const fetchRecentAnime = async () => {
        try {
            const {data} = await api.get(`users/anime/recent/${id}/`);
            setProfileData(prev => ({...prev, recentAnime: data}));
            return data;
        } catch (error) {
            console.error("Error fetching recent anime", error);
            throw error;
        }
    };

    const fetchAllUsers = async () => {
        try {
            const {data} = await api.get(`/users/all/`);
            setAllUsers(data.filter(user => user.user_id !== parseInt(id)));
            return data;
        } catch (error) {
            console.error("Error fetching all users", error);
            throw error;
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const {data} = await api.get(`/friends/requests/`);
            const uniqueRequests = data.filter((request, index, self) =>
                index === self.findIndex((r) => r.id === request.id));

            const requestProfiles = await Promise.all(
                uniqueRequests
                    .filter(request => request.is_active === true)
                    .map(async (request) => {
                        if (!request.sender) {
                            return null;
                        }
                        try {
                            const {data} = await api.get(`/users/profile/${request.sender}/`);
                            return {...data, request_id: request.id};
                        } catch (error) {
                            console.error("Error fetching profile for request", error);
                            return null;
                        }
                    })
            );

            setProfileData(prev => ({
                ...prev,
                requestProfiles: requestProfiles.filter(profile => profile !== null)
            }));
            return requestProfiles;
        } catch (error) {
            console.error("Error fetching friend requests", error);
            throw error;
        }
    };

    const fetchUserFriends = async () => {
        try {
            const {data} = await api.get(`/friends/list/`);

            const friendProfiles = await Promise.all(
                data.map(async (friendId) => {
                    try {
                        const {data} = await api.get(`/users/profile/${friendId}/`);
                        return data;
                    } catch (error) {
                        console.error("Error fetching friend profile", error);
                        return null;
                    }
                })
            );

            setProfileData(prev => ({
                ...prev,
                friends: data,
                friendProfiles: friendProfiles.filter(profile => profile !== null)
            }));
            return data;
        } catch (error) {
            console.error("Error fetching user friends", error);
            throw error;
        }
    };

    const fetchFollowing = async () => {
        try {
            const {data} = await api.get(`/users/following/`);

            const followingProfiles = await Promise.all(
                data.map(async (followId) => {
                    try {
                        const {data} = await api.get(`/users/profile/${followId}/`);
                        return data;
                    } catch (error) {
                        console.error("Error fetching following profile", error);
                        return null;
                    }
                })
            );

            setProfileData(prev => ({
                ...prev,
                following: data,
                followingProfiles: followingProfiles.filter(profile => profile !== null)
            }));
            return data;
        } catch (error) {
            console.error("Error fetching following", error);
            throw error;
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        if (!value) {
            setSearchResults([]);
            return;
        }

        const filteredResults = allUsers.filter(user =>
            user.username.toLowerCase().includes(value)
        );
        setSearchResults(filteredResults.slice(0, 5));
    };

    const handleSendFriendRequest = async (userId) => {
        try {
            await api.post(`/friends/request/${userId}/`);
            toast.success("Friend request sent!");
            setSearchResults([]);
        } catch (error) {
            console.error("Error sending friend request", error);
            toast.error("Failed to send friend request");
        }
    };

    const handleAcceptFriendRequest = async (requestId) => {
        try {
            await api.post(`/friends/accept/${requestId}/`);
            toast.success("Friend request accepted!");

            // Refresh friend requests and friends lists
            await Promise.all([
                fetchFriendRequests(),
                fetchUserFriends()
            ]);
        } catch (error) {
            console.error("Error accepting friend request", error);
            toast.error("Failed to accept friend request");
        }
    };

    const handleRejectFriendRequest = async (requestId) => {
        try {
            await api.post(`/friends/reject/${requestId}/`);
            toast.info("Friend request rejected");
            await fetchFriendRequests();
        } catch (error) {
            console.error("Error rejecting friend request", error);
            toast.error("Failed to reject friend request");
        }
    };

    const handleFollowUser = async (userId) => {
        try {
            await api.post(`/users/follow/${userId}/`);
            toast.success("You are now following this user!");
            await fetchFollowing();
        } catch (error) {
            console.error("Error following user", error);
            toast.error("Failed to follow user");
        }
    };

    const handleUnfollowUser = async (userId) => {
        try {
            await api.post(`/users/unfollow/${userId}/`);
            toast.info("You have unfollowed this user");
            await fetchFollowing();
        } catch (error) {
            console.error("Error unfollowing user", error);
            toast.error("Failed to unfollow user");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto p-4">
                {/* Profile Header */}
                <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-32"></div>
                    <div className="px-6 py-4 relative">
                        <div className="absolute -top-16 left-6">
                            <img
                                src={profileData.pfp || 'https://via.placeholder.com/150'}
                                alt="Profile"
                                className="w-32 h-32 rounded-full border-4 border-gray-800 object-cover"
                            />
                        </div>
                        <div className="mt-16">
                            <h1 className="text-2xl font-bold text-violet-300">{profileData.nickname}</h1>
                            <p className="text-gray-400 mt-1">{profileData.bio || 'No bio yet'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Friends/Following */}
                    <div className="space-y-6">
                        {/* Search Users */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg relative">
                            <h2 className="text-xl font-semibold mb-4 text-violet-300">Find Friends</h2>
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                onChange={handleSearch}
                            />

                            {searchResults.length > 0 && (
                                <div ref={searchResultsRef} className="absolute left-0 right-0 mt-2 mx-6 bg-gray-700 rounded-lg shadow-lg z-10">
                                    {searchResults.map(user => (
                                        <div key={user.user_id} className="p-3 hover:bg-gray-600 border-b border-gray-600 last:border-b-0 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <img
                                                    src={user.profile_image || 'https://via.placeholder.com/40'}
                                                    alt={user.username}
                                                    className="w-10 h-10 rounded-full mr-3"
                                                />
                                                <span>{user.username}</span>
                                            </div>
                                            <button
                                                onClick={() => handleSendFriendRequest(user.user_id)}
                                                className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-md text-sm"
                                            >
                                                Add Friend
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Friend Requests */}
                        {profileData.requestProfiles.length > 0 && (
                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold mb-4 text-violet-300">Friend Requests</h2>
                                <div className="space-y-3">
                                    {profileData.requestProfiles.map(profile => (
                                        <div key={profile.user_id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center">
                                                <img
                                                    src={profile.profile_image || 'https://via.placeholder.com/40'}
                                                    alt={profile.username}
                                                    className="w-10 h-10 rounded-full mr-3"
                                                />
                                                <span>{profile.username}</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAcceptFriendRequest(profile.request_id)}
                                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectFriendRequest(profile.request_id)}
                                                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friends List */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-violet-300">Friends</h2>
                            {profileData.friendProfiles.length > 0 ? (
                                <div className="space-y-3">
                                    {profileData.friendProfiles.map(friend => (
                                        <div key={friend.user_id} className="bg-gray-700 p-3 rounded-lg flex items-center">
                                            <img
                                                src={friend.profile_image || 'https://via.placeholder.com/40'}
                                                alt={friend.username}
                                                className="w-10 h-10 rounded-full mr-3"
                                            />
                                            <span>{friend.username}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center">No friends added yet</p>
                            )}
                        </div>
                    </div>

                    {/* Middle Column - Recent Anime */}
                    <div className="col-span-2">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-violet-300">Recently Added Anime</h2>

                            {profileData.recentAnime.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {profileData.recentAnime.map(anime => (
                                        <div key={anime.id} className="bg-gray-700 rounded-lg overflow-hidden shadow">
                                            <img
                                                src={anime.image_url || 'https://via.placeholder.com/300x200'}
                                                alt={anime.title}
                                                className="w-full h-40 object-cover"
                                            />
                                            <div className="p-3">
                                                <h3 className="font-semibold text-violet-300 truncate">{anime.title}</h3>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="bg-violet-900 text-xs px-2 py-1 rounded">
                                                        ★ {anime.score}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">
                                                        {anime.episodes} episodes
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 mb-4">No anime added yet</p>
                                    <button
                                        onClick={() => navigate('/find')}
                                        className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg"
                                    >
                                        Discover Anime
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default Profile;

