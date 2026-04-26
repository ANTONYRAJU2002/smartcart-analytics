import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    MessageSquare, Send, Clock, AlertCircle, AlertTriangle, Check, 
    PlusCircle, ChevronLeft, Package, Sparkles, RefreshCw,
    LifeBuoy, HelpCircle, FileText, ArrowRight,
    ShieldCheck, Zap, Info, ChevronRight, UserCircle, Cloud, Radio
} from 'lucide-react';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const [inquiryType, setInquiryType] = useState('General Question');
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tRes, oRes] = await Promise.all([
                api.get('/support'),
                api.get('/orders/my')
            ]);
            setTickets(tRes.data);
            setOrders(oRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load data", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const inquiryTypes = [
        { id: 'General Question', label: 'Inquiry', icon: <HelpCircle size={20} />, color: 'blue' },
        { id: 'Complaint', label: 'Complaint', icon: <AlertCircle size={20} />, color: 'amber' },
        { id: 'Refund Request', label: 'Refund', icon: <Zap size={20} />, color: 'rose' }
    ];

    const handleTicketClick = async (id) => {
        try {
            const res = await api.get(`/support/${id}`);
            setSelectedTicket(res.data);
            setMessages(res.data.messages || []);
            setShowNewForm(false);
        } catch (err) {
            console.error("Failed to load ticket", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await api.post(`/support/${selectedTicket.id}/message`, { message: newMessage });
            setNewMessage('');
            const res = await api.get(`/support/${selectedTicket.id}`);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/support', {
                inquiry_type: inquiryType,
                order_id: selectedOrderId || null,
                message: messageText
            });
            // Immediate UI transitions
            setShowNewForm(false);
            setMessageText('');
            setInquiryType('General Question');
            setSelectedOrderId('');
            
            // Refresh data in background
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || "Submission Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 bg-slate-50/50">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-blue-600 font-bold tracking-widest text-xs uppercase animate-pulse">Establishing Connection...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f4f7ff] relative overflow-hidden font-sans pb-20 text-slate-800">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-100/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>

            <div className="max-w-[1100px] mx-auto px-6 relative z-10 animate-in fade-in duration-700">
                {!selectedTicket && !showNewForm ? (
                    <div className="space-y-8 pt-12">
                        <header className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-500">
                                    <div className="relative">
                                        <Cloud size={32} />
                                        <Radio size={14} className="absolute -bottom-1 -right-1 text-indigo-400" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Support Matrix</h1>
                                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1 opacity-80">Omnichannel Response Hub Active</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowNewForm(true)}
                                className="!bg-[#2563eb] text-white px-9 py-4 rounded-2xl font-bold text-sm shadow-[0_15px_30px_-8px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.02] flex items-center gap-2.5 active:scale-95"
                            >
                                <PlusCircle size={20} />
                                New Ticket
                            </button>
                        </header>

                        <div className="grid grid-cols-1 gap-6">
                            {tickets.length > 0 ? tickets.map(t => {
                                const isComplaint = t.inquiry_type === 'Complaint';
                                const isRefund = t.inquiry_type === 'Refund Request';
                                
                                let accentGradient = 'from-blue-600 to-blue-400';
                                let iconBg = 'bg-blue-50';
                                let iconText = 'text-blue-600';
                                let icon = <HelpCircle size={24} />;

                                if (isComplaint) {
                                    accentGradient = 'from-amber-400 via-orange-400 to-yellow-500';
                                    iconBg = 'bg-amber-50';
                                    iconText = 'text-amber-600';
                                    icon = <AlertTriangle size={24} />;
                                } else if (isRefund) {
                                    accentGradient = 'from-rose-500 via-pink-500 to-pink-400';
                                    iconBg = 'bg-rose-50';
                                    iconText = 'text-rose-500';
                                    icon = <Zap size={24} />;
                                } else {
                                    // General Question / Other
                                    accentGradient = 'from-indigo-500 via-blue-500 to-cyan-400';
                                    iconBg = 'bg-indigo-50';
                                    iconText = 'text-indigo-600';
                                    icon = <HelpCircle size={24} />;
                                }

                                return (
                                <div 
                                        key={t.id} 
                                        onClick={() => handleTicketClick(t.id)}
                                        className="bg-[#fbfcff] rounded-[24px] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer group relative overflow-hidden active:scale-[0.995]"
                                    >
                                        <div className={`absolute top-0 left-0 w-full h-[3.5px] bg-gradient-to-r ${accentGradient}`}></div>
                                        
                                        <div className="p-7 md:px-10 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-full ${iconBg} ${iconText} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
                                                    {icon}
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                                        {t.inquiry_type}: {t.subject}
                                                    </h3>
                                                    <div className="flex items-center gap-x-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                                        <span>NODE-ID: REQ-{t.id}</span>
                                                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-50">
                                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${t.status === 'open' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-slate-100 text-slate-500'}`}>
                                                            {t.status === 'closed' && <Check size={12} />}
                                                            {t.status === 'open' ? 'Open Ticket' : 'Closed Ticket'}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            SYNC: <span className={t.status === 'open' ? 'text-emerald-500' : 'text-slate-400'}>{t.status}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                                                <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-300 mb-6">
                                        <Info size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Requests Found</h3>
                                    <p className="text-slate-400 max-w-xs mx-auto text-sm">Need help? Open a new ticket above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : showNewForm ? (
                    <div className="max-w-4xl mx-auto py-12 animate-in slide-in-from-bottom-8 duration-700">
                        <button 
                            onClick={() => setShowNewForm(false)} 
                            className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-blue-600 transition-all mb-8 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100"
                        >
                            <ChevronLeft size={18} /> Back to Requests
                        </button>
                        
                        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
                            <div className="mb-10">
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create New Request</h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">Our support team will get back to you within 2-4 hours.</p>
                            </div>

                            <form onSubmit={handleCreateTicket} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Inquiry Type</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {inquiryTypes.map(t => (
                                            <div 
                                                key={t.id}
                                                onClick={() => setInquiryType(t.id)}
                                                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 ${inquiryType === t.id ? 'bg-blue-50/50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50/50'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inquiryType === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {t.icon}
                                                </div>
                                                <span className={`font-bold text-sm ${inquiryType === t.id ? 'text-blue-600' : 'text-slate-600'}`}>{t.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {(inquiryType === 'Refund Request' || inquiryType === 'Complaint') && (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 relative">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Linked Order</label>
                                        
                                        {/* Custom Rich Dropdown */}
                                        <div className="relative">
                                            <div 
                                                onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                                                className={`w-full bg-slate-50 border ${isOrderDropdownOpen ? 'border-blue-500 bg-white' : 'border-slate-200'} rounded-2xl py-4 px-6 font-semibold text-sm text-slate-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]`}
                                            >
                                                {selectedOrderId ? (
                                                    <div className="flex items-center gap-3">
                                                        {orders.find(o => String(o.id) === String(selectedOrderId))?.items[0]?.image_url && (
                                                            <img 
                                                                src={formatImageUrl(orders.find(o => String(o.id) === String(selectedOrderId)).items[0].image_url)} 
                                                                alt="" 
                                                                className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-slate-100" 
                                                                onError={handleImageError}
                                                            />
                                                        )}
                                                        <div className="text-left">
                                                            <div className="text-slate-900">Order #{selectedOrderId}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                {orders.find(o => String(o.id) === String(selectedOrderId))?.items[0]?.name.substring(0, 30)}...
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Choose an order...</span>
                                                )}
                                                <ChevronRight className={`transition-transform duration-300 ${isOrderDropdownOpen ? '-rotate-90' : 'rotate-90 text-slate-400'}`} size={18} />
                                            </div>

                                            {isOrderDropdownOpen && (
                                                <div className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-100 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] z-[100] p-3 max-h-[350px] overflow-y-auto animate-in fade-in slide-in-from-top-4">
                                                    {orders.length === 0 ? (
                                                        <div className="py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No orders found</div>
                                                    ) : [...orders].sort((a, b) => b.id - a.id).map(o => (
                                                        <div 
                                                            key={o.id}
                                                            onClick={() => {
                                                                setSelectedOrderId(o.id);
                                                                setIsOrderDropdownOpen(false);
                                                            }}
                                                            className={`flex items-center gap-4 p-4 rounded-[20px] cursor-pointer transition-all hover:bg-slate-50 border-2 ${String(selectedOrderId) === String(o.id) ? 'border-blue-500/20 bg-blue-50/30' : 'border-transparent'}`}
                                                        >
                                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                                                                {o.items[0]?.image_url ? (
                                                                    <img 
                                                                        src={formatImageUrl(o.items[0].image_url)} 
                                                                        alt="" 
                                                                        className="w-full h-full object-contain p-2" 
                                                                        onError={handleImageError}
                                                                    />
                                                                ) : (
                                                                    <Package className="text-slate-300" size={24} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="font-bold text-slate-900">Order #{o.id}</div>
                                                                    <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                                                        {new Date(o.date).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-medium truncate">
                                                                    {o.items[0]?.name || 'Product Details'}
                                                                    {o.items.length > 1 && ` + ${o.items.length - 1} more`}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${o.status === 'delivered' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isOrderDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsOrderDropdownOpen(false)}></div>}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Message Details</label>
                                    <textarea 
                                        rows="5"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Describe your issue in detail..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-6 font-medium text-sm text-slate-700 focus:bg-white focus:border-blue-500 transition-all resize-none shadow-inner"
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Submit Ticket
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto py-8 animate-in zoom-in-95 duration-700">
                        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden flex flex-col h-[82vh]">
                            {/* Chat Header */}
                            <div className="p-6 md:px-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-40">
                                <div className="flex items-center gap-6">
                                    <button 
                                        onClick={() => setSelectedTicket(null)} 
                                        className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`w-2 h-2 rounded-full ${selectedTicket.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ticket #{selectedTicket.id}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleTicketClick(selectedTicket.id)}
                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Refresh conversation"
                                >
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/30">
                                {messages.map((m, i) => {
                                    const isStaff = m.sender_id !== selectedTicket.user_id;
                                    const isSystem = m.message.startsWith('[SYSTEM]');
                                    
                                    if (isSystem) {
                                        return (
                                            <div key={i} className="flex justify-center my-4">
                                                <div className="bg-white text-slate-400 text-[10px] font-bold uppercase tracking-widest py-2 px-6 rounded-full border border-slate-100 shadow-sm">
                                                    {m.message.replace('[SYSTEM]', '').trim()}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={i} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                                            <div className={`flex items-center gap-2 mb-2 ${isStaff ? 'ml-2' : 'mr-2'}`}>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {isStaff ? 'Support Expert' : 'You'}
                                                </span>
                                            </div>
                                            <div className={`max-w-[85%] p-6 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ${isStaff ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                                                {m.message}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-300 mt-2 mx-4 uppercase tracking-widest">
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-6 md:p-8 border-t border-slate-50 bg-white">
                                <form onSubmit={handleSendMessage} className="flex gap-4">
                                    <input 
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-medium text-sm text-slate-700 focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newMessage.trim()} 
                                        className="bg-blue-600 text-white px-8 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        Send <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;
