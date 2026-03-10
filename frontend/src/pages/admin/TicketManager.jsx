import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
    MessageSquare, Send, X, Inbox, Clock, CheckCircle,
    AlertCircle, CreditCard, User, History, ChevronRight
} from 'lucide-react';

const TicketManager = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const chatEndRef = useRef(null);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support/all');
            setTickets(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch tickets");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        try {
            const res = await api.get(`/support/${ticket.id}`);
            setSelectedTicket(res.data);
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to load details");
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;

        try {
            await api.post(`/support/${selectedTicket.id}/message`, { message: reply });
            setReply('');
            const res = await api.get(`/support/${selectedTicket.id}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to send reply");
        }
    };

    const handleAction = async (action, orderId = null) => {
        setActionLoading(true);
        try {
            await api.post(`/support/${selectedTicket.id}/action`, { action, order_id: orderId });
            // Reload ticket details
            const res = await api.get(`/support/${selectedTicket.id}`);
            setSelectedTicket(res.data);
            setMessages(res.data.messages);
            fetchTickets();
        } catch (err) {
            alert("Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && tickets.length === 0) {
        return <div className="flex items-center justify-center p-20 text-slate-400 text-sm font-black uppercase tracking-widest">Initialising Comms...</div>;
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
            <header className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <MessageSquare className="text-indigo-600" size={24} />
                        Communications Center
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Support & Logistics Resolution</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-time Sync Active</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left: Ticket List (35%) */}
                <div className="w-[350px] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                        <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Queue</h2>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-full border border-indigo-100">{tickets.length} Active</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {tickets.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleSelectTicket(t)}
                                className={`p-3.5 border-b border-slate-100 cursor-pointer transition-all relative ${selectedTicket?.id === t.id
                                    ? 'bg-white border-l-4 border-l-primary shadow-sm z-10 scale-[1.02]'
                                    : 'hover:bg-white/50 border-l-4 border-l-transparent text-slate-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-[9px] font-black text-slate-400 font-mono tracking-tighter">REQ-{t.id}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${t.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {t.status}
                                    </span>
                                </div>
                                <h3 className={`text-[11px] font-black mb-1.5 line-clamp-1 ${selectedTicket?.id === t.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {t.subject}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600 uppercase">
                                            {t.user?.[0]}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400">{t.user}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {t.is_refund && (
                                            <div className="flex items-center gap-1 text-amber-600">
                                                <CreditCard size={10} />
                                                <span className="text-[8px] font-black uppercase">Refund</span>
                                            </div>
                                        )}
                                        <span className="text-[8px] font-bold text-slate-300">
                                            {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Resolution View (65%) */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden relative">
                    {selectedTicket ? (
                        <>
                            {/* Detailed Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-20 shadow-xs">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                        {selectedTicket.refund ? <CreditCard size={20} /> : <MessageSquare size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 leading-none mb-1.5">{selectedTicket.subject}</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="text-indigo-600 font-black">Customer: {selectedTicket.user}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            ID: #{selectedTicket.id}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedTicket.status === 'open' ? (
                                        <button
                                            onClick={() => handleAction('close')}
                                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            Resolve Ticket
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction('open')}
                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            Re-open Ticket
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Refund Action Panel */}
                            {selectedTicket.refund && (
                                <div className="mx-4 mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.1em] mb-1">Financial Refund Request</h4>
                                            <p className="text-[9px] font-bold text-amber-600/80">Linked to Order #{selectedTicket.refund.order_id}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs font-black text-amber-900 leading-none mb-1">₹{selectedTicket.refund.amount?.toLocaleString()}</span>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${selectedTicket.refund.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                selectedTicket.refund.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    'bg-rose-100 text-rose-700 border-rose-200'
                                                }`}>
                                                {selectedTicket.refund.status}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedTicket.refund.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleAction('approve_refund', selectedTicket.refund.order_id)}
                                                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                                            >
                                                Approve & Close
                                            </button>
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleAction('reject_refund', selectedTicket.refund.order_id)}
                                                className="flex-1 bg-white border border-rose-200 text-rose-600 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
                                            >
                                                Reject Refund
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Context Panel */}
                            {selectedTicket.order_context && (
                                <div className="mx-4 mt-4 p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-xl flex gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex-1">
                                        <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Order Context & Timeline</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purchased On</p>
                                                <p className="text-[11px] font-black text-slate-700">
                                                    {new Date(selectedTicket.order_context.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    <span className="text-slate-400 font-medium ml-1">
                                                        ({new Date(selectedTicket.order_context.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolution Timeline</p>
                                                <p className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                                                    <History size={12} className="text-indigo-400" />
                                                    {selectedTicket.order_context.days_since_purchase_at_ticket_creation} days
                                                    <span className="text-slate-400 font-medium">after purchase</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 border-l border-indigo-100/50 pl-6">
                                        <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Products Involved</h4>
                                        <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                                            {selectedTicket.order_context.items.map(item => (
                                                <div key={item.id} className="flex items-center justify-between border-b border-indigo-50/50 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-white flex items-center justify-center border border-indigo-100 overflow-hidden shrink-0">
                                                            {item.image_url ? (
                                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-[6px] text-indigo-300 font-black">IMG</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-700 line-clamp-1" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="text-[9px] font-black text-slate-500">x{item.quantity}</span>
                                                        <span className="text-[9px] font-black text-slate-900">₹{item.price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Conversation */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 custom-scrollbar">
                                {messages.map(m => {
                                    const isSystem = m.message.startsWith('[SYSTEM]');
                                    const isAdmin = m.sender_id !== selectedTicket.user_id && !isSystem;

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
                                        <div key={m.id} className={`flex flex-col max-w-[85%] ${isAdmin ? 'self-end items-end' : 'self-start items-start'}`}>
                                            <div className={`p-3 rounded-2xl text-[11px] font-medium leading-relaxed shadow-xs ${isAdmin
                                                ? 'bg-slate-900 text-white rounded-tr-none'
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                                }`}>
                                                {m.message}
                                            </div>
                                            <div className="mt-1 px-1 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{isAdmin ? 'Admin Portal' : m.sender}</span>
                                                <span className="text-[8px] font-bold text-slate-300">
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Composer */}
                            <div className="p-4 bg-white border-t border-slate-100">
                                <form onSubmit={handleSendReply} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="Formulate resolution message..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 transition-all animate-in zoom-in-50 duration-500">
                                <Inbox size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Record for Analysis</h3>
                            <p className="text-[9px] font-bold text-slate-400/60 mt-2 uppercase tracking-widest">Awaiting interaction...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketManager;
