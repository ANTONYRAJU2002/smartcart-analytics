import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    // In a real app, we'd fetch these stats from an analytics endpoint
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        products: 0,
        users: 0
    });

    // Simulating fetching or calculation (could come from analytics endpoints)
    useEffect(() => {
        // Just mock/placeholder logic or simple fetch if we had a summary endpoint
        const fetchStats = async () => {
            try {
                // We'll just fetch raw lists for now to get counts, 
                // in prod use a dedicated /analytics/summary endpoint
                const [ordersRes, productsRes, usersRes] = await Promise.all([
                    api.get('/orders/all'),
                    api.get('/products'),
                    api.get('/admin/users')
                ]);

                const orders = ordersRes.data;
                const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

                setStats({
                    revenue: revenue,
                    orders: orders.length,
                    products: productsRes.data.length,
                    users: usersRes.data.length
                });

            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100', path: '/admin/orders' },
        { title: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100', path: '/admin/orders' },
        { title: 'Total Products', value: stats.products, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-100', path: '/admin/products' },
        { title: 'Registered Users', value: stats.users, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100', path: '/admin/users' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="panel flex items-center p-6 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(card.path)}
                    >
                        <div className={`p-4 rounded-full ${card.bg} mr-4`}>
                            <card.icon size={24} className={card.color} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{card.title}</p>
                            <h3 className="text-2xl font-bold text-slate-800 m-0">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section Example - Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="panel h-64 flex flex-col justify-center items-center text-slate-400">
                    <TrendingUp size={48} className="mb-2 opacity-50" />
                    <p>Sales Analytics Chart Placeholder</p>
                </div>
                <div className="panel h-64 flex flex-col justify-center items-center text-slate-400">
                    <Users size={48} className="mb-2 opacity-50" />
                    <p>User Growth Chart Placeholder</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
