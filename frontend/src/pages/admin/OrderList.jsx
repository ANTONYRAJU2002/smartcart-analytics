import { useEffect, useState } from 'react';
import api from '../../services/api';
import OrderDetail from './OrderDetail';
import { Eye, Filter, ShoppingCart } from 'lucide-react';

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'packed': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'returned': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'return_requested': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="space-y-4">
            <header className="flex justify-between items-end px-2">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <ShoppingCart className="text-indigo-600" size={24} />
                        Order Logistics
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction & Fulfillment Control</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
                        <Filter size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Filter Archive</span>
                    </button>
                </div>
            </header>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronising Ledger...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Identifier</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Context</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporal</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantum</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Logistics</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Fiscal Status</th>
                                    <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">#{order.id}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 leading-tight">{order.user}</span>
                                                <span className="text-[9px] font-bold text-slate-400 leading-none">{order.user_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold text-slate-500">{order.date}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 leading-tight">₹{order.total?.toLocaleString()}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{order.items?.length || 0} Line Items</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${order.payment_status === 'paid'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : order.payment_status === 'failed'
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {order.payment_status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
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
