/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6D28D9', // violet-700
                    light: '#8B5CF6',   // violet-500
                    dark: '#5B21B6',    // violet-800
                },
                secondary: {
                    DEFAULT: '#DB2777', // pink-600
                    light: '#EC4899',   // pink-500
                    dark: '#BE185D',    // pink-700
                },
                dark: {
                    DEFAULT: '#111827', // gray-900
                    light: '#1F2937',   // gray-800
                    lighter: '#374151', // gray-700
                },
            },
            animation: {
                'bounce-slow': 'bounce 2s infinite',
            }
        },
    },
    plugins: [],
}