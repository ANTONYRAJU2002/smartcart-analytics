import { useState, useEffect, useRef } from 'react';
import { X, Send, User, Shield } from 'lucide-react';
import api from '../../services/api';

const TicketDetail = ({ ticketId, onClose }) => {
    const [ticket, setTicket] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const fetchTicket = async () => {
        try {
            const res = await api.get(`/support/${ticketId}`);
            setTicket(res.data);
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/support/${ticketId}/message`, { message: newMessage });
            setNewMessage('');
            fetchTicket();
        } catch (err) {
            alert("Failed to send message");
        }
    };

    if (loading) return <div className="panel p-8 text-center text-slate-500">Loading ticket...</div>;
    if (!ticket) return <div className="panel p-8 text-center text-slate-500">Ticket not found</div>;

    return (
        <div className="panel w-full max-w-4xl h-[80vh] flex flex-col p-0 shadow-2xl relative animate-slide-up bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="font-bold text-slate-800">{ticket.subject}</h2>
                    <p className="text-sm text-slate-500 flex gap-2">
                        <span>User: <span className="font-medium text-slate-700">{ticket.user || 'Unknown'}</span></span>
                        <span>•</span>
                        <span>Status: <span className={`badge ${ticket.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>{ticket.status}</span></span>
                    </p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50">
                {ticket.messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.sender_id === ticket.user_id ? 'self-start items-start' : 'self-end items-end'}`}>
                        <div className="flex items-center gap-1 mb-1 text-xs text-slate-500">
                            {msg.sender_id !== ticket.user_id && <Shield size={10} className="text-indigo-500" />}
                            <span className="font-medium">{msg.sender}</span>
                            <span>• {new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.sender_id === ticket.user_id
                                ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                                : 'bg-indigo-600 text-white rounded-tr-sm'
                            }`}>
                            {msg.message}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-3">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="form-input flex-1"
                />
                <button type="submit" className="btn btn-primary px-6">
                    <Send size={18} /> Send
                </button>
            </form>
        </div>
    );
};

export default TicketDetail;
