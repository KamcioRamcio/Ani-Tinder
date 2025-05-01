import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setIsAuthorized(false);
                return;
            }

            try {
                // Attempt to get user info to verify token is still valid
                const response = await api.get('users/me/');
                if (response.status === 200) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Authentication error:", error);
                setIsAuthorized(false);

                // Clean up localStorage on auth failure
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');
            }
        };

        checkAuth();
    }, []);

    if (isAuthorized === null) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;