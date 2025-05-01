import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import api from "../api.js";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function ProfileAll() {
    const {userId} = useParams();
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem("user_id");
    const roomName = currentUserId && userId ?
        `${[currentUserId, userId].sort().join('_')}` : '';

    const [profileData, setProfileData] = useState({
        bio: "",
        pfp: "",
        nickname: "",
        recentAnime: [],
        friends: [],
        friendProfiles: [],
        following: [],
        followingProfiles: [],
        followers: [],
        followerProfiles: []
    });
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!userId) {
            setError("User not found");
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchUserProfile(),
                    fetchRecentAnime(),
                    fetchUserFriends(),
                    fetchFollowing(),
                    fetchFollowers()
                ]);
            } catch (error) {
                console.error("Error fetching profile data:", error);
                setError("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            const {data} = await api.get(`/users/profile/${userId}/`);
            setProfileData(prev => ({
                ...prev,
                bio: data.bio,
                pfp: data.profile_image,
                nickname: data.username
            }));
            return data;
        } catch (error) {
            console.error("Error fetching user profile", error);
            toast.error("Failed to load user profile");
            throw error;
        }
    };

    const fetchRecentAnime = async () => {
        try {
            const {data} = await api.get(`users/anime/recent/${userId}/`);
            setProfileData(prev => ({...prev, recentAnime: data}));
            return data;
        } catch (error) {
            console.error("Error fetching recent anime", error);
            toast.error("Failed to load recent anime");
            throw error;
        }
    };

    const fetchUserFriends = async () => {
        try {
            const {data} = await api.get(`/friends/${userId}/`);

            if (data.length === 0 || !data[0].friends) {
                setProfileData(prev => ({
                    ...prev,
                    friends: [],
                    friendProfiles: []
                }));
                return [];
            }

            const friendIds = data[0].friends.map(f => f.id);
            const friendProfiles = await Promise.all(
                friendIds.map(async (friendId) => {
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
                friends: friendIds,
                friendProfiles: friendProfiles.filter(profile => profile !== null)
            }));

            // Check if current user is friends with this user
            if (currentUserId) {
                const isFriend = friendIds.includes(parseInt(currentUserId));
                setIsFriend(isFriend);
            }

            return friendProfiles;
        } catch (error) {
            console.error("Error fetching friends", error);
            throw error;
        }
    };

    const fetchFollowing = async () => {
        try {
            const {data} = await api.get(`/follow/${userId}/`);

            if (data.length === 0 || !data[0].following) {
                setProfileData(prev => ({
                    ...prev,
                    following: [],
                    followingProfiles: []
                }));
                return [];
            }

            const following = data[0].following.map(f => f.id);

            const followingProfiles = await Promise.all(
                following.map(async (followId) => {
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
                following: following,
                followingProfiles: followingProfiles.filter(profile => profile !== null)
            }));

            return followingProfiles;
        } catch (error) {
            console.error("Error fetching following", error);
            throw error;
        }
    };

    const fetchFollowers = async () => {
        try {
            const {data} = await api.get(`/follow/followers/${userId}/`);
            const followers = data[0]?.followers?.map(f => f.id) || [];

            const followerProfiles = await Promise.all(
                followers.map(async (followerId) => {
                    try {
                        const {data} = await api.get(`/users/profile/${followerId}/`);
                        return data;
                    } catch (error) {
                        console.error("Error fetching follower profile", error);
                        return null;
                    }
                })
            );

            setProfileData(prev => ({
                ...prev,
                followers: followers,
                followerProfiles: followerProfiles.filter(profile => profile !== null)
            }));

            // Check if current user is following this user
            if (currentUserId) {
                const isFollowing = followers.includes(parseInt(currentUserId));
                setIsFollowing(isFollowing);
            }

            return followerProfiles;
        } catch (error) {
            console.error("Error fetching followers", error);
            throw error;
        }
    };

    const handleAddFriend = async () => {
        if (!currentUserId) {
            toast.error("You must be logged in to add friends");
            navigate('/login');
            return;
        }

        try {
            const response = await api.post(`/friends/requests/add/${userId}/`);
            if (response.status === 200 || response.status === 201) {
                toast.success("Friend request sent!");
            } else {
                toast.error("Failed to send friend request");
            }
        } catch (error) {
            console.error("Error adding friend:", error);
            toast.error(error.response?.data?.error || "Failed to send friend request");
        }
    };

    const handleFollow = async () => {
        if (!currentUserId) {
            toast.error("You must be logged in to follow users");
            navigate('/login');
            return;
        }

        try {
            const response = await api.post(`/follow/user/${userId}/`);
            if (response.status === 200) {
                toast.success("User followed successfully");
                setIsFollowing(true);
                await fetchFollowers();
            } else {
                toast.error("Failed to follow user");
            }
        } catch (error) {
            console.error("Error following user:", error);
            toast.error("Failed to follow user");
        }
    };

    const handleUnfollow = async () => {
        if (!currentUserId) {
            navigate('/login');
            return;
        }

        try {
            const response = await api.post(`/follow/unfollow/${userId}/`);
            if (response.status === 200) {
                toast.success("Unfollowed successfully");
                setIsFollowing(false);
                await fetchFollowers();
            } else {
                toast.error("Failed to unfollow user");
            }
        } catch (error) {
            console.error("Error unfollowing user:", error);
            toast.error("Failed to unfollow user");
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

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-violet-800 py-4 shadow-lg text-center">
                <h2 className="font-bold text-3xl">{profileData.nickname}'s Profile</h2>
            </header>

            <div className="flex flex-col md:flex-row flex-wrap w-full mx-auto gap-6 p-6">
                <div className="absolute top-4 left-4">
                    <button
                        onClick={() => navigate('/home')}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full transition-all"
                    >
                        Back to Home
                    </button>
                </div>

                {/* Main profile card */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:w-1/3 lg:w-1/4">
                    <div className="flex flex-col items-center">
                        <img
                            src={profileData.pfp}
                            alt="Profile"
                            className="rounded-full w-32 h-32 object-cover mb-4 shadow-lg border-2 border-violet-500"
                        />
                        <h2 className="font-bold text-2xl text-violet-400 mb-2">
                            {profileData.nickname}
                        </h2>
                        <p className="text-gray-300 text-center mb-6">
                            {profileData.bio || "No bio provided."}
                        </p>

                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={() => navigate(`/anime-list/${userId}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-lg transition-all"
                            >
                                View Anime List
                            </button>

                            {currentUserId && currentUserId !== userId && (
                                <>
                                    {!isFriend ? (
                                        <button
                                            onClick={handleAddFriend}
                                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-lg transition-all"
                                        >
                                            Add Friend
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/chat/${roomName}`)}
                                            className="bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg shadow-lg transition-all"
                                        >
                                            Chat
                                        </button>
                                    )}

                                    {!isFollowing ? (
                                        <button
                                            onClick={handleFollow}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-lg transition-all"
                                        >
                                            Follow
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleUnfollow}
                                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg shadow-lg transition-all"
                                        >
                                            Unfollow
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Anime Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:w-1/3 lg:w-1/4">
                    <h3 className="text-xl font-semibold mb-4 text-center text-violet-400">Recently Added Anime</h3>

                    {profileData.recentAnime && profileData.recentAnime.length > 0 ? (
                        <ul className="space-y-4">
                            {profileData.recentAnime.map(anime => (
                                <li key={anime.mal_id} className="flex items-center gap-3 border-b border-gray-700 pb-3">
                                    <img
                                        src={anime.image_url}
                                        alt={anime.title}
                                        className="w-16 h-20 object-cover rounded"
                                    />
                                    <div>
                                        <a
                                            href={`https://myanimelist.net/anime/${anime.mal_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-violet-400 hover:text-violet-300 font-medium hover:underline"
                                        >
                                            {anime.title}
                                        </a>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {anime.watched ? "Watched" : "Plan to Watch"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-center py-4">
                            No anime added yet.
                        </p>
                    )}
                </div>

                {/* Friends Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:w-1/3 lg:w-1/4">
                    <h3 className="text-xl font-semibold mb-4 text-center text-violet-400">Friends</h3>

                    {profileData.friendProfiles && profileData.friendProfiles.length > 0 ? (
                        <ul className="space-y-4">
                            {profileData.friendProfiles.map(friend => (
                                <li key={friend.user_id} className="flex items-center gap-3 border-b border-gray-700 pb-3">
                                    <img
                                        src={friend.profile_image}
                                        alt={friend.username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <button
                                            onClick={() => navigate(`/profile/${friend.user_id}`)}
                                            className="text-violet-400 hover:text-violet-300 font-medium truncate block"
                                        >
                                            {friend.username}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-center py-4">
                            No friends added yet.
                        </p>
                    )}
                </div>

                {/* Following Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:w-1/3 lg:w-1/4">
                    <h3 className="text-xl font-semibold mb-4 text-center text-violet-400">Following</h3>

                    {profileData.followingProfiles && profileData.followingProfiles.length > 0 ? (
                        <ul className="space-y-4">
                            {profileData.followingProfiles.map(follow => (
                                <li key={follow.user_id} className="flex items-center gap-3 border-b border-gray-700 pb-3">
                                    <img
                                        src={follow.profile_image}
                                        alt={follow.username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <button
                                            onClick={() => navigate(`/profile/${follow.user_id}`)}
                                            className="text-violet-400 hover:text-violet-300 font-medium truncate block"
                                        >
                                            {follow.username}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-center py-4">
                            Not following anyone yet.
                        </p>
                    )}
                </div>

                {/* Followers Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:w-1/3 lg:w-1/4">
                    <h3 className="text-xl font-semibold mb-4 text-center text-violet-400">Followers</h3>

                    {profileData.followerProfiles && profileData.followerProfiles.length > 0 ? (
                        <ul className="space-y-4">
                            {profileData.followerProfiles.map(follower => (
                                <li key={follower.user_id} className="flex items-center gap-3 border-b border-gray-700 pb-3">
                                    <img
                                        src={follower.profile_image}
                                        alt={follower.username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <button
                                            onClick={() => navigate(`/profile/${follower.user_id}`)}
                                            className="text-violet-400 hover:text-violet-300 font-medium truncate block"
                                        >
                                            {follower.username}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-center py-4">
                            No followers yet.
                        </p>
                    )}
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        </div>
    );
}

export default ProfileAll;