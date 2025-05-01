import React from "react";
import { Link } from "react-router-dom";
import bg_img from "../assets/bg-home.jpg";

function HomeAll() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center text-white"
            style={{backgroundImage: `url(${bg_img})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
        >
            <div className="bg-black bg-opacity-60 p-8 rounded-xl max-w-2xl text-center">
                <h1 className="text-5xl font-bold mb-6 animate-bounce">
                    Welcome to AniTinder
                </h1>
                <h2 className="text-3xl font-bold mb-4 animate-pulse">
                    Do you want something new in your life?
                </h2>
                <p className="text-xl mb-8 font-semibold">
                    Discover new anime titles, connect with other fans, and share your favorites!
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center mt-8">
                    <Link
                        to="/register"
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-110 text-lg"
                    >
                        Register Now
                    </Link>

                    <Link
                        to="/login"
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-110 text-lg"
                    >
                        I already have an account
                    </Link>
                </div>

                <div className="mt-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
                            <h3 className="text-xl font-bold mb-2">Discover Anime</h3>
                            <p>Find new anime recommendations based on your preferences</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
                            <h3 className="text-xl font-bold mb-2">Connect with Fans</h3>
                            <p>Make friends with other anime enthusiasts</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
                            <h3 className="text-xl font-bold mb-2">Track Your Anime</h3>
                            <p>Keep a list of anime you've watched and want to watch</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomeAll;