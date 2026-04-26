import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut,
    FileText, ClipboardList, GitMerge, Store, BarChart3, Activity, UploadCloud, Target,
    MessageSquare, Star, Search, Bell, User, HelpCircle, Sun, Moon, Menu, X
} from 'lucide-react';
import FloatingChatbot from './FloatingChatbot';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../admin_premium.css';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState({ new_orders: [], low_stock: [], staff_alerts: [], total_count: 0 });
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/analytics/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for real-time alerts
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/admin/support', label: 'Tickets', icon: MessageSquare },
        { path: '/admin/staff-management', label: 'Staff Approval', icon: ClipboardList },
        { path: '/admin/targets', label: 'Staff Targets', icon: Target },
        { path: '/admin/offline', label: 'Offline Sales', icon: Store },
        { path: '/admin/segments', label: 'Segments', icon: Users },
        { path: '/admin/associations', label: 'Market Basket', icon: GitMerge },
        { path: '/admin/reviews', label: 'Reviews', icon: Star },
        { path: '/admin/users', label: 'Customers', icon: Users },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/upload', label: 'CSV Upload', icon: UploadCloud },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout-container flex h-screen overflow-hidden bg-[#f8fafc]">
            {/* Sidebar - Modern SaaS Style */}
            <aside className={`
                fixed lg:sticky top-0 bottom-0 left-0 z-50 w-[260px] h-screen bg-white transition-all duration-500 ease-in-out flex-shrink-0 border-r border-slate-200
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                <div className="flex flex-col h-full relative z-10">
                    {/* Logo Section */}
                    <div className="p-6">
                        <Link to="/admin" className="flex items-center gap-3 group" onClick={() => setIsSidebarOpen(false)}>
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">S</div>
                            <div className="flex flex-col">
                                <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">SmartCart</h1>
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest -mt-1">Analytics</span>
                            </div>
                        </Link>
                        {/* Mobile Close Button */}
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Profile Section - Image Style */}
                    <div className="px-6 py-4 mb-4">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                {user?.username?.substring(0, 1) || 'A'}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-black text-slate-900 truncate uppercase">{user?.username || 'Admin'}</span>
                                <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tight">Super Admin</span>
                            </div>
                            <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`
                                            flex items-center py-3 px-4 rounded-xl transition-all duration-200 group
                                            ${isActive(item.path) 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}
                                        `}
                                    >
                                    <item.icon size={18} className={`mr-3 ${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                                    <span className="text-[13px] font-bold">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Logout */}
                    <div className="p-6 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-start p-3 text-[13px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group"
                        >
                            <LogOut size={18} className="mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-[#f8fafc]">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Global Top Search Header - Image Style */}
                <header className="h-[70px] bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center flex-1 max-w-xl gap-4">
                        {/* Mobile Menu Toggle */}
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            <Menu size={24} />
                        </button>
                        
                        <div className="relative w-full group">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search everything..."
                                className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">

                        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
                        
                        <div className="relative" ref={notifRef}>
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                                <Bell size={20} />
                                {notifications.total_count > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Notifications</h3>
                                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                            {notifications.total_count} New
                                        </span>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                        {notifications.total_count === 0 ? (
                                            <div className="p-6 text-center text-slate-400 text-xs font-bold">No new notifications</div>
                                        ) : (
                                            <div className="p-2 space-y-1">
                                                {/* Staff Alerts */}
                                                {notifications.staff_alerts && notifications.staff_alerts.map((a, i) => (
                                                    <div key={`alert-${i}`} className="p-3 hover:bg-amber-50 rounded-xl transition-all flex gap-3 text-left w-full cursor-pointer border-l-2 border-amber-400 mt-1">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight">Staff Notification</p>
                                                            <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                                                Staff <span className="text-indigo-600">{a.staff}</span> notified that stock of <span className="text-indigo-600">{a.product}</span> is only <span className="text-rose-500">{a.stock}</span> units left.
                                                            </p>
                                                            <p className="text-[8px] font-bold text-slate-400 mt-1">{a.time}</p>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* New Orders */}
                                                {notifications.new_orders.map((o, i) => (
                                                    <div key={`order-${i}`} className="p-3 hover:bg-slate-50 rounded-xl transition-all flex gap-3 text-left w-full cursor-pointer">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                                            <ShoppingCart size={14} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[11px] font-bold text-slate-800 truncate">New Order #{o.id}</p>
                                                            <p className="text-[9px] font-semibold text-slate-500 truncate">{o.customer} • ₹{o.amount.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Low Stock */}
                                                {notifications.low_stock.map((p, i) => (
                                                    <div key={`stock-${i}`} className="p-3 hover:bg-rose-50 rounded-xl transition-all flex gap-3 text-left w-full cursor-pointer">
                                                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 animate-pulse">
                                                            <Package size={14} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[11px] font-bold text-slate-800 truncate">Low Stock Alert</p>
                                                            <p className="text-[9px] font-semibold text-rose-500 truncate">{p.name}</p>
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{p.category} • {p.stock} left</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 ml-2 group cursor-pointer">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 uppercase">{user?.username || 'Admin User'}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Super Admin</span>
                            </div>
                            <div className="w-9 h-9 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 flex items-center justify-center font-black">
                                {user?.username?.substring(0, 1) || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content Container */}
                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                    <div className="w-full h-full max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
                <FloatingChatbot />
            </main>
        </div>
    );
};

export default AdminLayout;
