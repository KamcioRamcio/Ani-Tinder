import React from 'react';
import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import HomeAll from './pages/HomeAll';
import Find from './pages/Find';
import AnimeList from './pages/AnimeList';
import AnimeListAll from './pages/AnimeListAll.jsx';
import Profile from './pages/Profile';
import ProfileAll from './pages/ProfileAll';
import ProfileEdit from './pages/ProfileEdit';
import Chat from './pages/Chat';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    const currentUserId = localStorage.getItem('user_id');

    return (
        <div className="bg-slate-900 min-h-screen">
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomeAll />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile/:userId" element={<ProfileAll />} />
                        <Route path="/anime-list/:userId" element={<AnimeListAll />} />

                        {/* Protected routes */}
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <Find />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/animelist"
                            element={
                                <ProtectedRoute>
                                    <AnimeList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile-edit"
                            element={
                                <ProtectedRoute>
                                    <ProfileEdit />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/resetpassword"
                            element={
                                <ProtectedRoute>
                                    {/*<PSWReset />*/}
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chat/:roomName"
                            element={
                                <ProtectedRoute>
                                    <Chat currentUserId={currentUserId} />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback route */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </BrowserRouter>
                <ToastContainer position="top-right" autoClose={3000} />
            </AuthProvider>
        </div>
    );
}

export default App;