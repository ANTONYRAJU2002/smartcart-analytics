import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import OrderDetail from './OrderDetail';
import { 
    Eye, Filter, ShoppingCart, Package, 
    Clock, CheckCircle2, Truck, XCircle, 
    RotateCcw, AlertTriangle, TrendingUp, IndianRupee 
} from 'lucide-react';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/all');
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Statistics Calculation
    const stats = useMemo(() => {
        const total = orders.length;
        const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
        const pending = orders.filter(o => o.status === 'pending').length;
        const growth = 18; // Mock growth percentage
        return { total, revenue, pending, growth };
    }, [orders]);

    // Grouping orders by status
    const groupedOrders = useMemo(() => {
        const groups = {
            'pending': [],
            'packed': [],
            'shipped': [],
            'delivered': [],
            'cancelled': [],
            'returned': [],
            'return_requested': []
        };
        orders.forEach(order => {
            const status = order.status === 'return_requested' ? 'return_requested' : order.status;
            if (groups[status]) {
                groups[status].push(order);
            } else {
                groups['pending'].push(order);
            }
        });
        return groups;
    }, [orders]);

    const getGroupTotal = (group) => {
        return group.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString();
    };

    const columns = [
        { id: 'pending', label: 'Pending', pill: 'PENDING', pillClass: 'pill-pending', bg: 'col-pending', sub: 'Awaiting processing' },
        { id: 'packed', label: 'Confirmed', pill: 'CONFIRMED', pillClass: 'pill-confirmed', bg: 'col-confirmed', sub: 'Payment verified' },
        { id: 'shipped', label: 'Shipped', pill: 'SHIPPED', pillClass: 'pill-shipped', bg: 'col-shipped', sub: 'In transit' },
        { id: 'delivered', label: 'Delivered', pill: 'DELIVERED', pillClass: 'pill-delivered', bg: 'col-delivered', sub: 'Successfully delivered' },
        { id: 'cancelled', label: 'Cancelled', pill: 'CANCELLED', pillClass: 'pill-cancelled', bg: 'col-cancelled', sub: 'Order cancelled' },
        { id: 'returned', label: 'Returned', pill: 'RETURNED', pillClass: 'pill-returned', bg: 'col-returned', sub: 'Return initiated' },
        { id: 'return_requested', label: 'Refunded', pill: 'REFUNDED', pillClass: 'pill-refunded', bg: 'col-refunded', sub: 'Payment refunded' },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#f8faff]">
            {/* Main Header */}
            <header className="order-logistics-header flex justify-between items-center px-6 py-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Logistics</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage and track all customer orders</p>
                </div>
                <div className="order-logistics-actions flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Search orders, ID, customer..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 w-64 transition-all" />
                    </div>
                    <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none">
                        <option>All Statuses</option>
                    </select>
                    <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none">
                        <option>Last 30 Days</option>
                    </select>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all">
                        <TrendingUp size={14} /> More Filters
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all ml-4">
                        Export
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronising Logistics Data...</p>
                </div>
            ) : (
                <div className="kanban-board-container px-6">
                    <div className="kanban-board custom-scrollbar">
                        {columns.map(col => (
                            <div key={col.id} className="kanban-column">
                                <div className={`column-header ${col.bg}`}>
                                    <div className="column-top">
                                        <span className="column-title">{col.label}</span>
                                        <span className={`status-pill ${col.pillClass}`}>{groupedOrders[col.id]?.length || 0}</span>
                                    </div>
                                    <span className="column-revenue">₹{getGroupTotal(groupedOrders[col.id])}</span>
                                    <p className="column-subtext">{col.sub}</p>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-10">
                                    {groupedOrders[col.id]?.map(order => (
                                        <div 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className={`kanban-card ${selectedOrder?.id === order.id ? 'ring-2 ring-indigo-500' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="card-id">#{order.id}</span>
                                                <span className="card-date">{order.date}</span>
                                            </div>
                                            <h4 className="card-customer mb-2">{order.user}</h4>
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="card-price">₹{order.total?.toLocaleString()}</span>
                                                    {order.payment_method === 'COD' && (
                                                        <span className="text-[8px] font-black text-rose-500 uppercase">COD Payment</span>
                                                    )}
                                                </div>
                                                <span className={`card-status-pill card-pill-${order.status || 'pending'}`}>
                                                    {order.status === 'packed' ? 'Confirmed' : order.status}
                                                </span>
                                            </div>
                                            {order.status === 'shipped' && (
                                                <div className="mt-3 pt-2 border-t border-slate-50 flex items-center gap-2">
                                                    <Truck size={10} className="text-indigo-500" />
                                                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">In Transit Hub</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!groupedOrders[col.id] || groupedOrders[col.id].length === 0) && (
                                        <div className="m-4 p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center text-center opacity-40">
                                            <Package size={24} className="text-slate-200 mb-2" />
                                            <p className="text-[9px] font-bold text-slate-300 uppercase">Empty Column</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Docked Stats */}
                    <div className="bottom-stats-bar">
                        <div className="stat-item">
                            <span className="stat-label">Total Orders</span>
                            <span className="stat-value">{stats.total}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Revenue</span>
                            <span className="stat-value">₹{stats.revenue?.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Avg. Order Value</span>
                            <span className="stat-value">₹{(stats.revenue / (stats.total || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="stat-item flex-row items-center gap-2">
                            <div className="flex flex-col">
                                <span className="stat-label">This Month</span>
                                <span className="stat-value text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={14} /> {stats.growth}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <div className="order-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
                    <OrderDetail
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onUpdate={fetchOrders}
                    />
                </div>
            )}
        </div>
    );
};

export default OrderList;
