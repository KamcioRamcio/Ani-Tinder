import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="bg-violet-700 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <span className="text-xl font-bold">AniTinder</span>
                        </Link>
                    </div>

                    <div className="flex items-center">
                        {currentUser ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm">Welcome, {currentUser.username}</span>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-violet-800 hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="space-x-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-violet-800 hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-violet-800 hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;