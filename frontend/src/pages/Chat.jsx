import React, {useEffect, useRef, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import api from "../api.js";
import {toast} from "react-toastify";

const Chat = ({currentUserId}) => {
    const {roomName} = useParams();
    const navigate = useNavigate();
    const [otherUserId, setOtherUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const socketRef = useRef(null);
    const messageContainerRef = useRef(null);
    const [profileData, setProfileData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!currentUserId) {
            navigate('/login');
            return;
        }

        // Extract the other user's ID from the room name
        const ids = roomName.split('_');
        const otherId = ids.find(id => id !== currentUserId);
        setOtherUserId(otherId);

        // Initialize data
        fetchMessages();
        fetchProfileData(otherId);
        fetchProfileData(currentUserId);
        initializeWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [currentUserId, roomName]);

    const initializeWebSocket = () => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host.split(':')[0]}:8000/ws/chat/${roomName}/`;

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            console.log("WebSocket connection established");
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);

            const newMsg = {
                id: data.timestamp,
                sender: data.sender,
                receiver: data.receiver,
                content: data.message,
                timestamp: data.timestamp
            };

            setMessages(prevMessages => [...prevMessages, newMsg]);
            scrollToBottom();
        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setError("Connection error. Please try again later.");
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket connection closed");
        };
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await api.get(`chat/messages/${roomName}/`);
            if (Array.isArray(response.data)) {
                setMessages(response.data);
            } else {
                console.error("Response is not an array:", response.data);
                setError("Failed to load messages");
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            setError("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileData = async (userId) => {
        try {
            const response = await api.get(`users/profile/${userId}/`);
            setProfileData(prevData => ({
                ...prevData,
                [userId]: response.data
            }));
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    };

    const sendMessage = () => {
        if (newMessage.trim() === "") return;

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            toast.error("Connection lost. Please refresh the page.");
            return;
        }

        const message = {
            content: newMessage,
            sender: currentUserId,
            receiver: otherUserId
        };

        socketRef.current.send(JSON.stringify(message));
        setNewMessage("");
    };

    const scrollToBottom = () => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    const linkify = (text) => {
        const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlPattern, (url) => {
            const domain = url.replace(/^(https?|ftp|file):\/\/([^\/]+).*/, '$2');
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${domain}</a>`;
        });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";

        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-screen bg-slate-800">
            {/* Header */}
            <header className="bg-violet-800 text-white py-3 px-4 shadow-lg">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="mr-4 bg-violet-700 hover:bg-violet-600 rounded-full p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>

                        {profileData[otherUserId] && (
                            <div className="flex items-center">
                                <img
                                    src={profileData[otherUserId].profile_image}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                />
                                <h1 className="text-xl font-bold">
                                    {profileData[otherUserId].username}
                                </h1>
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-violet-700 hover:bg-violet-600 text-white px-4 py-2 rounded-lg"
                        >
                            Profile
                        </button>
                    </div>
                </div>
            </header>

            {/* Messages Container */}
            <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
                        {error}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 bg-gray-800 p-4 rounded-lg">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id}
                             className={`flex ${message.sender == currentUserId ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex items-start max-w-xl ${message.sender == currentUserId ? "flex-row-reverse" : ""}`}>
                                {profileData[message.sender] && (
                                    <img
                                        src={profileData[message.sender].profile_image}
                                        alt="Profile"
                                        className="w-8 h-8 rounded-full object-cover mt-1 mx-2"
                                    />
                                )}

                                <div className={`${message.sender == currentUserId ? "mr-2" : "ml-2"}`}>
                                    <div
                                        className={`rounded-lg px-4 py-2 shadow-md ${
                                            message.sender == currentUserId
                                                ? "bg-violet-600 text-white"
                                                : "bg-gray-700 text-white"
                                        }`}
                                    >
                                        <p dangerouslySetInnerHTML={{ __html: linkify(message.content) }}></p>
                                    </div>
                                    <div className={`text-xs text-gray-400 mt-1 ${message.sender == currentUserId ? "text-right" : "text-left"}`}>
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-700 p-4 bg-gray-900">
                <div className="flex">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                        rows="2"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={newMessage.trim() === ""}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</p>
            </div>
        </div>
    );
}

export default Chat;