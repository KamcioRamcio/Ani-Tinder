import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// Set up axios defaults
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Check for token in localStorage and set authorization header
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);