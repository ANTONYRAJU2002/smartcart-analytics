import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut,
    FileText, ClipboardList, GitMerge, Menu, X, Store, BarChart3, Activity, UploadCloud,
    MessageSquare, Star
} from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/admin/users', label: 'Customers', icon: Users },
        { path: '/admin/staff-management', label: 'Staff Approval', icon: ClipboardList },
        { path: '/admin/offline', label: 'Offline Sales', icon: Store },
        { path: '/admin/segments', label: 'Segments', icon: Users },
        { path: '/admin/associations', label: 'Market Basket', icon: GitMerge },
        { path: '/admin/reviews', label: 'Reviews', icon: Star },
        { path: '/admin/support', label: 'Tickets', icon: MessageSquare },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/live-analytics', label: 'Live Analytics', icon: Activity },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
                <span className="text-xl font-bold text-indigo-600">SmartCart</span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
                        <span className="text-xl font-bold text-indigo-600">SmartCart</span>
                        <span className="ml-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                            >
                                <item.icon size={20} className="mr-3" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {user?.username?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'Admin'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                            <LogOut size={16} className="mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`
                flex-1 flex flex-col min-h-screen transition-all duration-300
                lg:ml-64 pt-16 lg:pt-0
            `}>
                <div className="flex-1 p-4 lg:p-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
