import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCamera, FaArrowLeft } from "react-icons/fa";

function ProfileEdit() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nickname: "",
        bio: "",
        profileImage: null
    });
    const [previewImage, setPreviewImage] = useState(null);
    const userId = localStorage.getItem("user_id");

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/users/profile/${userId}/`);
            setFormData({
                nickname: data.username || "",
                bio: data.bio || "",
                profileImage: null
            });
            setPreviewImage(data.profile_image || null);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching user profile", error);
            toast.error("Failed to load profile data");
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                profileImage: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formPayload = new FormData();
            formPayload.append("username", formData.nickname);
            formPayload.append("bio", formData.bio);

            if (formData.profileImage) {
                formPayload.append("profile_image", formData.profileImage);
            }

            await api.put(`/users/profile/${userId}/update/`, formPayload, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success("Profile updated successfully!");
            setTimeout(() => navigate("/profile"), 1500);
        } catch (error) {
            console.error("Error updating profile", error);
            toast.error("Failed to update profile");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Loading profile data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto p-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => navigate("/profile")}
                            className="mr-4 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
                        >
                            <FaArrowLeft className="text-violet-400" />
                        </button>
                        <h1 className="text-2xl font-bold text-violet-300">Edit Profile</h1>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                {/* Profile Picture */}
                                <div className="mb-8 flex flex-col items-center">
                                    <div className="relative mb-3">
                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700">
                                            {previewImage ? (
                                                <img
                                                    src={previewImage}
                                                    alt="Profile Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={triggerFileInput}
                                            className="absolute bottom-0 right-0 bg-violet-600 p-2 rounded-full hover:bg-violet-700 transition-colors"
                                        >
                                            <FaCamera />
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerFileInput}
                                        className="text-sm text-violet-400 hover:text-violet-300"
                                    >
                                        Change profile picture
                                    </button>
                                </div>

                                {/* Nickname */}
                                <div className="mb-6">
                                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-400 mb-2">
                                        Nickname
                                    </label>
                                    <input
                                        type="text"
                                        id="nickname"
                                        name="nickname"
                                        value={formData.nickname}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="Your nickname"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="mb-6">
                                    <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                        placeholder="Tell us about yourself..."
                                    ></textarea>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/profile")}
                                        className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={`px-6 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Saving...
                                            </>
                                        ) : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default ProfileEdit;