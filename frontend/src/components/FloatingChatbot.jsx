import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../chatbot.css'; // Adjust path if needed

const FloatingChatbot = () => {
    const { user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    
    // Set initial message based on user role
    const getInitialMessage = () => {
        if (!user) return "Hi there! I'm the SmartCart AI Assistant. How can I help you today?";
        if (user.role === 'admin') return "Hello Admin! I'm your AI assistant. I can help with sales analytics, inventory management, or system operations. How can I assist you today?";
        if (user.role === 'staff') return "Hi there! I'm here to help with offline sales entry, returns, or checking inventory. How can I help you during your shift?";
        return "Hi there! I'm the SmartCart AI Assistant. How can I help you today?";
    };

    const [messages, setMessages] = useState([
        { role: 'model', content: getInitialMessage() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const historyObj = newMessages.slice(1, -1).map(m => ({
                role: m.role,
                parts: [m.content]
            }));

            const res = await api.post('/support/bot', { 
                message: userMsg,
                history: historyObj,
                role: user?.role || 'customer'
            });

            if (res.data && res.data.reply) {
                setMessages(prev => [...prev, { role: 'model', content: res.data.reply }]);
            }
        } catch (err) {
            console.error("Chatbot failed", err);
            const errorMsg = err.response?.data?.reply || "I'm sorry, I'm having trouble thinking right now. Please try again later.";
            setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chatbot-widget-container">
            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-title">
                            <Sparkles size={18} />
                            <span>SmartCart AI</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="chatbot-close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-bubble-row ${msg.role}`}>
                                <div className="chat-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-bubble-row model">
                                <div className="typing-indicator">
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="chatbot-input-area">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="chatbot-input"
                            disabled={isTyping}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isTyping}
                            className="chatbot-send-btn"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`chatbot-toggle-btn ${isOpen ? 'opened' : 'closed'}`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};

export default FloatingChatbot;
