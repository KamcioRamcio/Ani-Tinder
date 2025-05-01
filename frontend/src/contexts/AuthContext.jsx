import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if the user is already logged in by token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
            const username = localStorage.getItem('username');
            const user_id = localStorage.getItem('user_id');

            if (username && user_id) {
                setCurrentUser({ id: user_id, username });
            } else {
                // Try to fetch user details if we have token but missing user info
                fetchCurrentUser();
            }
        }
        setLoading(false);
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('users/me/');
            const userData = response.data;

            // Store user data
            localStorage.setItem('username', userData.username);
            localStorage.setItem('user_id', userData.id);

            setCurrentUser({
                id: userData.id,
                username: userData.username
            });
        } catch (err) {
            console.error('Error fetching user data:', err);
            logout(); // If we can't fetch user data, force logout
        }
    };

    const register = async (username, email, password) => {
        setError('');
        try {
            const response = await api.post('users/register/', {
                username,
                email,
                password
            });

            return response.data;
        } catch (err) {
            console.error('Registration error:', err.response?.data || err.message);
            setError(err.response?.data?.detail || 'Failed to register. Please try again.');
            throw err;
        }
    };

    const login = async (username, password) => {
        setError('');
        try {
            const response = await api.post('users/login/', {
                username,
                password
            });

            const { token, user_id } = response.data;

            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            localStorage.setItem('user_id', user_id);

            setCurrentUser({ id: user_id, username });
            return response.data;
        } catch (err) {
            console.error('Login error:', err.response?.data || err.message);
            setError(err.response?.data?.detail || 'Invalid credentials');
            throw err;
        }
    };

    const logout = async () => {
        try {
            await api.post('users/logout/');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Remove token and user data from storage
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('user_id');

            // Update state
            setCurrentUser(null);
        }
    };

    const value = {
        currentUser,
        loading,
        error,
        register,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;