import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { 
    MessageSquare, Search, Send, 
    CheckCircle, User, Mail, MapPin, MoreHorizontal, 
    Clock, AlertCircle, CreditCard, History, ChevronRight,
    Inbox, Package, Sparkles
} from 'lucide-react';
import '../../support_premium.css';

const TicketManager = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const chatEndRef = useRef(null);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support/all');
            setTickets(res.data);
            setLoading(false);
            
            // Auto-select first ticket if none selected
            if (res.data.length > 0 && !selectedTicket) {
                handleTicketClick(res.data[0].id);
            }
        } catch (err) {
            console.error("Failed to load admin support data", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleTicketClick = async (id) => {
        try {
            const res = await api.get(`/support/${id}`);
            setSelectedTicket(res.data);
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to load ticket details", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket) return;

        try {
            await api.post(`/support/${selectedTicket.id}/message`, { message: newMessage });
            setNewMessage('');
            const res = await api.get(`/support/${selectedTicket.id}`);
            setMessages(res.data.messages);
            fetchTickets();
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleAction = async (action, orderId = null) => {
        if (!selectedTicket) return;
        setActionLoading(true);
        try {
            await api.post(`/support/${selectedTicket.id}/action`, { 
                action, 
                order_id: orderId || (selectedTicket.refund ? selectedTicket.refund.order_id : null)
            });
            handleTicketClick(selectedTicket.id);
            fetchTickets();
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredTickets = tickets.filter(t => 
        (t.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.user?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && tickets.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="support-premium-container animate-slide-up">
            {/* 1. Queue Column */}
            <div className="ticket-queue-col">
                <div className="queue-header">
                    <header className="mb-4">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Communications</h1>
                        <p className="text-slate-400 font-bold text-xs tracking-wide uppercase">Support & Logistics Resolution</p>
                    </header>
                    <h3>
                        Queue 
                        <span className="active-badge">{tickets.filter(t => t.status === 'open').length} Active</span>
                    </h3>
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search tickets..." 
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-10 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="queue-list custom-scrollbar">
                    {filteredTickets.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => handleTicketClick(t.id)}
                            className={`ticket-item-card ${selectedTicket?.id === t.id ? 'active' : ''}`}
                        >
                            <div className="ticket-item-header">
                                <span className="subject text-xs mb-1 block">REQ-{t.id}</span>
                                <span className={`status-tag ${t.status}`}>{t.status}</span>
                            </div>
                            <div className="ticket-item-header">
                                <span className="subject line-clamp-1">{t.subject}</span>
                            </div>
                            <div className="ticket-item-meta flex items-center gap-2 mt-2">
                                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                    {t.user?.[0]}
                                </div>
                                <span>{t.user}</span>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {t.is_refund && (
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <CreditCard size={10} />
                                        <span className="text-[9px] font-black uppercase">Refund</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Chat Center Column */}
            <div className="chat-center-col">
                {selectedTicket ? (
                    <>
                        <div className="chat-header-bar">
                            <div className="chat-user-info">
                                <div className="avatar-initials">
                                    {(selectedTicket.user || '??').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="chat-header-details">
                                    <h4 className="line-clamp-1">{selectedTicket.subject}</h4>
                                    <p className="uppercase tracking-widest text-[10px]">Customer: {selectedTicket.user} • ID: #{selectedTicket.id}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time</span>
                                </div>
                                <button 
                                    className="resolve-btn-top"
                                    onClick={() => handleAction(selectedTicket.status === 'open' ? 'close' : 'open')}
                                >
                                    {selectedTicket.status === 'open' ? 'Resolve Ticket' : 'Reopen Ticket'}
                                </button>
                            </div>
                        </div>

                        {/* Special Refund Review Panel */}
                        {selectedTicket.refund && (
                            <div className="m-6 p-5 bg-amber-50/50 border border-amber-100 rounded-[24px] animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.1em] mb-1">Financial Refund Request</h4>
                                        <p className="text-[11px] font-bold text-amber-600/80">Linked to Order #{selectedTicket.refund.order_id}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-amber-900 leading-none mb-1">₹{selectedTicket.refund.amount?.toLocaleString()}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                            selectedTicket.refund.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            selectedTicket.refund.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            'bg-rose-100 text-rose-700 border-rose-200'
                                        }`}>
                                            {selectedTicket.refund.status}
                                        </span>
                                    </div>
                                </div>

                                {selectedTicket.refund.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleAction('approve_refund', selectedTicket.refund.order_id)}
                                            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                                        >
                                            Approve & Close
                                        </button>
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleAction('reject_refund', selectedTicket.refund.order_id)}
                                            className="flex-1 bg-white border border-rose-200 text-rose-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                                        >
                                            Reject Refund
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="chat-messages-area custom-scrollbar">
                            {messages.map((m, idx) => {
                                const isStaff = m.sender_id !== selectedTicket.user_id;
                                const isSystem = m.message.startsWith('[SYSTEM]');
                                const isAI = m.message.startsWith('[AI Support]');

                                if (isSystem) {
                                    return (
                                        <div key={m.id || idx} className="system-msg-center">
                                            {m.message.replace('[SYSTEM]', '').trim()}
                                        </div>
                                    );
                                }

                                if (isAI) {
                                    return (
                                        <div key={m.id || idx} className="message-bubble-wrapper staff">
                                            <div className="avatar-initials flex-shrink-0 shadow-md" style={{ width: '32px', height: '32px', fontSize: '10px', background: 'linear-gradient(to right, #8b5cf6, #d946ef)', color: 'white' }}>
                                                <Sparkles size={16} />
                                            </div>
                                            <div>
                                                <div className="message-bubble shadow-sm" style={{ background: 'linear-gradient(to bottom right, #fbf7ff, #fdf4ff)', border: '1px solid #f3e8ff', color: '#4c1d95' }}>
                                                    {m.message.replace('[AI Support]', '').trim()}
                                                </div>
                                                <span className="message-time">
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SmartCart AI
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={m.id || idx} className={`message-bubble-wrapper ${isStaff ? 'staff' : 'user'}`}>
                                        <div className="avatar-initials flex-shrink-0" style={{ width: '32px', height: '32px', fontSize: '10px', background: isStaff ? '#6366f1' : '#f1f5f9', color: isStaff ? 'white' : '#64748b' }}>
                                            {isStaff ? 'ST' : selectedTicket.user.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="message-bubble shadow-sm">
                                                {m.message}
                                            </div>
                                            <span className="message-time">
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="chat-input-bar">
                            <form onSubmit={handleSendMessage} className="input-container-premium">
                                <input 
                                    type="text" 
                                    placeholder="Formulate resolution message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="send-btn-rounded shadow-lg shadow-indigo-100" disabled={!newMessage.trim()}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat-state">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                            <Inbox size={48} className="text-slate-200" />
                        </div>
                        <h3>Select Record for Analysis</h3>
                        <p className="uppercase tracking-widest text-[10px] font-black text-slate-300 mt-2">Awaiting interaction...</p>
                    </div>
                )}
            </div>

            {/* 3. Details Column */}
            <div className="ticket-details-col">
                <div className="details-header">
                    <h3>Ticket Details</h3>
                    <MoreHorizontal className="text-slate-400 cursor-pointer" size={20} />
                </div>

                {selectedTicket ? (
                    <>
                        <div className="details-content custom-scrollbar">
                            {/* Product Context Card */}
                            {selectedTicket.order_context?.items?.length > 0 ? (
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Products Involved</h5>
                                    {selectedTicket.order_context.items.map((item, i) => (
                                        <div key={i} className="product-context-card !mb-2">
                                            <div className="product-img-box !h-[120px] !mb-4">
                                                <img src={item.image_url} alt={item.name} />
                                            </div>
                                            <h4 className="text-sm line-clamp-2">{item.name}</h4>
                                            <p className="mt-2 flex justify-between items-center font-black">
                                                <span>ID: {item.id}</span>
                                                <span className="text-slate-900">₹{item.price.toLocaleString()}</span>
                                            </p>
                                        </div>
                                    ))}
                                    
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</p>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600">
                                                <History size={12} />
                                                {selectedTicket.order_context.days_since_purchase_at_ticket_creation} days post-purchase
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-600">
                                            Original Order: <span className="text-slate-900">#{selectedTicket.order_context.order_id}</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="product-context-card flex flex-col items-center justify-center text-center py-12 opacity-40">
                                    <AlertCircle size={32} className="mb-3" />
                                    <p className="text-xs font-black uppercase tracking-widest">No Context</p>
                                    <p className="text-[10px] font-medium mt-1">Non-order ticket</p>
                                </div>
                            )}

                            <div className="customer-info-section mt-8">
                                <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Customer Intelligence</h5>
                                <div className="info-row">
                                    <div className="info-icon"><User size={14} /></div>
                                    <div className="info-text">
                                        <p>Name</p>
                                        <span>{selectedTicket.user}</span>
                                    </div>
                                </div>
                                <div className="info-row">
                                    <div className="info-icon"><Mail size={14} /></div>
                                    <div className="info-text">
                                        <p>Email</p>
                                        <span>{selectedTicket.user.toLowerCase()}@email.com</span>
                                    </div>
                                </div>
                                <div className="info-row">
                                    <div className="info-icon"><MapPin size={14} /></div>
                                    <div className="info-text">
                                        <p>Location</p>
                                        <span>New York, NY</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Lifecycle Status</h5>
                                <div className={`status-badge-premium ${selectedTicket.status}`}>
                                    <CheckCircle size={14} className="mr-2" />
                                    {selectedTicket.status.toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="details-actions">
                            <button 
                                className="btn-primary-support"
                                onClick={() => handleAction('close')}
                                disabled={selectedTicket.status === 'closed'}
                            >
                                {selectedTicket.status === 'closed' ? 'Resolved' : 'Mark Resolved'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-slate-200 animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting interaction...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketManager;
