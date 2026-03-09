import { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, Plus, Send, X, Inbox } from 'lucide-react';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support');
            setTickets(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load tickets");
            setLoading(false);
        }
    };

    const handleTicketClick = async (id) => {
        try {
            const res = await api.get(`/support/${id}`);
            setSelectedTicket({ ...res.data, id });
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to load ticket details");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/support/${selectedTicket.id}/message`, { message: newMessage });
            setNewMessage('');
            const res = await api.get(`/support/${selectedTicket.id}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to send message");
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/support', { subject: newSubject, message: newTicketMessage });
            setShowNewTicketForm(false);
            setNewSubject('');
            setNewTicketMessage('');
            fetchTickets();
            handleTicketClick(res.data.ticket_id);
        } catch (err) {
            alert('Failed to create ticket');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronising Support...</div>;

    return (
        <div className="layout-wrapper bg-slate-50/50 min-h-screen">
            <div className="container py-8 h-[calc(100vh-140px)]">
                <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:flex-row">

                    {/* Sidebar: Ticket List */}
                    <div className="lg:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Your Tickets</h2>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Support History</p>
                            </div>
                            <button
                                onClick={() => setShowNewTicketForm(true)}
                                className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-sm"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {tickets.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => handleTicketClick(t.id)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer transition-all ${selectedTicket?.id === t.id
                                            ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm z-10'
                                            : 'hover:bg-white text-slate-500 border-l-4 border-l-transparent'
                                        }`}
                                >
                                    <div className="text-[10px] font-black text-slate-400 font-mono mb-1">REQ-{t.id}</div>
                                    <div className="font-black text-slate-800 text-[11px] truncate mb-1.5">{t.subject}</div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${t.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {t.status}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-300">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {tickets.length === 0 && (
                                <div className="p-8 text-center text-slate-300 flex flex-col items-center">
                                    <Inbox size={32} className="mb-2 opacity-20" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">No active tickets</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col bg-white relative">
                        {showNewTicketForm ? (
                            <div className="absolute inset-0 z-20 bg-white p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Open New Inquiry</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware Support Request</p>
                                    </div>
                                    <button onClick={() => setShowNewTicketForm(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateTicket} className="max-w-xl mx-auto w-full space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                                        <input
                                            type="text"
                                            value={newSubject}
                                            onChange={(e) => setNewSubject(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-medium transition-all focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/30"
                                            placeholder="Nature of inquiry..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Log</label>
                                        <textarea
                                            value={newTicketMessage}
                                            onChange={(e) => setNewTicketMessage(e.target.value)}
                                            rows="5"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-medium transition-all focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/30"
                                            placeholder="Provide technical details, order IDs, or specific issues..."
                                            required
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
                                        Transmit Request
                                    </button>
                                </form>
                            </div>
                        ) : selectedTicket ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-xs z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                            <MessageSquare size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-[12px] font-black text-slate-900 leading-none mb-1">{selectedTicket.subject}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                REQ-{selectedTicket.id} • Status: {selectedTicket.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 custom-scrollbar">
                                    {messages.map(m => {
                                        const isStaff = m.sender === 'staff' || m.sender_id !== selectedTicket.user_id;
                                        const isSystem = m.message.startsWith('[SYSTEM]');

                                        if (isSystem) {
                                            return (
                                                <div key={m.id} className="flex justify-center py-2">
                                                    <div className="px-4 py-1.5 bg-slate-900/5 border border-slate-900/10 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                                        {m.message.replace('[SYSTEM]', '').trim()}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={m.id} className={`flex flex-col max-w-[85%] ${isStaff ? 'self-start items-start' : 'self-end items-end'}`}>
                                                <div className={`p-3 rounded-2xl text-[11px] font-medium leading-relaxed shadow-xs ${isStaff
                                                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                                                        : 'bg-indigo-600 text-white rounded-tr-none'
                                                    }`}>
                                                    {m.message}
                                                </div>
                                                <div className="mt-1 px-1 flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                        {isStaff ? 'Official Support' : 'You'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-300">
                                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Reply Input */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <form onSubmit={handleSendMessage} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Response transmission..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        />
                                        <button type="submit" className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 bg-slate-50/10">
                                <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-4 shadow-sm animate-pulse">
                                    <MessageSquare size={24} className="opacity-30" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select Inquiry for Resolution</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
