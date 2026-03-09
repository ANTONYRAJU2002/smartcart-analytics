import { useEffect, useState } from 'react';
import api from '../services/api';
import { Package, ShoppingBag, CreditCard, ChevronRight, Search, Star, Clock, MapPin } from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/my');
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    if (loading) return (
        <div className="layout-wrapper bg-slate-50/50 min-h-screen">
            <div className="container py-16 text-center text-slate-500 font-medium">
                Loading your orders...
            </div>
        </div>
    );

    return (
        <div className="layout-wrapper bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-100 py-10 shadow-sm">
                <div className="container">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Package size={20} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-primary">Your History</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Order History</h1>
                        <p className="text-base text-slate-500 font-medium leading-relaxed">
                            Manage your hardware acquisitions and track deliveries.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container py-10 space-y-8">
                <section>
                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="panel py-24 flex flex-col items-center justify-center text-center max-w-lg mx-auto border-dashed border-2">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                    <ShoppingBag size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-3">No orders yet</h2>
                                <p className="text-slate-500 text-sm mb-8 px-6">
                                    Start building your collection today.
                                </p>
                                <button
                                    onClick={() => window.location.href = '/products'}
                                    className="btn btn-primary px-8 py-3 text-sm"
                                >
                                    Explore Hardware
                                </button>
                            </div>
                        ) : orders.map(order => {
                            const steps = [
                                { key: 'pending', label: 'Placed', icon: ShoppingBag },
                                { key: 'packed', label: 'Processing', icon: Package },
                                { key: 'shipped', label: 'Shipped', icon: Clock },
                                { key: 'delivered', label: 'Delivered', icon: ShoppingBag }
                            ];

                            const statusMap = {
                                'pending': 0,
                                'packed': 1,
                                'shipped': 2,
                                'delivered': 3,
                                'completed': 3,
                                'cancelled': -1,
                                'return_requested': -1
                            };

                            const currentStep = statusMap[order.status] ?? 0;

                            return (
                                <div key={order.id} className="panel overflow-hidden group border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Order Header */}
                                    <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-lg font-black text-slate-900 tracking-tight">Order #{order.id}</span>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ${order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' :
                                                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                                        'bg-amber-50 text-amber-600 ring-amber-100'
                                                    }`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">
                                                {new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-primary mb-0.5">{formatCurrency(order.total)}</div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</p>
                                        </div>
                                    </div>

                                    {/* Visual Tracker & Delivery Estimate */}
                                    <div className="px-5 py-8 border-b border-slate-100 bg-white">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Est. Delivery</p>
                                                    <p className="text-[11px] font-black text-slate-900">
                                                        {new Date(new Date(order.date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="hidden md:block h-6 w-px bg-slate-100" />
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Method</p>
                                                    <p className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">Standard Express</p>
                                                </div>
                                            </div>
                                        </div>

                                        {currentStep < 0 && (
                                            <div className="max-w-2xl mx-auto px-4">
                                                <div className="flex items-center justify-center gap-3 py-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                                                    <div className="flex -space-x-2.5 overflow-hidden">
                                                        {order.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="w-9 h-6 bg-white rounded-md border border-rose-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white">
                                                                {item.image_url ? (
                                                                    <img src={item.image_url} alt="" className="w-full h-full object-contain p-0.5" />
                                                                ) : (
                                                                    <Package size={8} className="text-rose-200" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">
                                                        Order {order.status.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {currentStep >= 0 && (
                                            <div className="max-w-2xl mx-auto relative px-4">
                                                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-50" />
                                                <div
                                                    className="absolute top-4 left-6 h-0.5 bg-primary transition-all duration-1000"
                                                    style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 12px)` }}
                                                />

                                                <div className="relative flex justify-between">
                                                    {steps.map((step, idx) => {
                                                        const isCompleted = idx <= currentStep;
                                                        const isActive = idx === currentStep;
                                                        const StepIcon = step.icon;

                                                        return (
                                                            <div key={step.key} className="flex flex-col items-center gap-2">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center z-10 transition-all duration-500 ring-4 ${isCompleted ? 'bg-primary text-white ring-primary/10 shadow-md shadow-primary/20' : 'bg-white text-slate-200 ring-slate-50'
                                                                    }`}>
                                                                    <StepIcon size={16} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className={`text-[8px] font-black uppercase tracking-tighter mb-0.5 ${isCompleted ? 'text-slate-900' : 'text-slate-200'}`}>
                                                                        {step.label}
                                                                    </p>
                                                                    {isActive && (
                                                                        <span className="block w-1 h-1 bg-primary rounded-full mx-auto animate-ping" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items List */}
                                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2.5 group/item bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-white transition-all shadow-sm">
                                                    <div className="w-10 h-7 bg-white rounded border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-0.5" />
                                                        ) : (
                                                            <Package size={12} className="text-slate-200" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[9px] font-black text-slate-900 truncate mb-0.5">{item.name || `Product #${item.product_id}`}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 flex items-center gap-1.5">
                                                            <span className="bg-slate-200 text-slate-600 px-1 py-0.5 rounded-[3px] uppercase font-black">x{item.qty}</span>
                                                            <span className="text-primary/80">{formatCurrency(item.price)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center gap-2 mb-0.5 text-slate-400">
                                                <MapPin size={14} />
                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Acquisition Site</span>
                                            </div>
                                            <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                                                <p className="text-[8px] text-slate-400 font-bold mb-1.5 uppercase tracking-widest leading-none">Shipping Address</p>
                                                <p className="text-[10px] text-slate-500 font-medium leading-normal">
                                                    {order.shipping_address || 'Unavailable'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap justify-end gap-2 mt-auto pt-4 border-t border-slate-100">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Confirm cancellation?')) {
                                                                try {
                                                                    await api.post(`/orders/${order.id}/cancel`);
                                                                    fetchOrders();
                                                                } catch (err) {
                                                                    alert('Error');
                                                                }
                                                            }
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all border border-rose-100 shadow-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {(order.status === 'completed' || order.status === 'delivered') && (
                                                    <>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await api.get(`/orders/${order.id}/invoice`, { responseType: 'blob' });
                                                                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
                                                                    window.open(url, '_blank');
                                                                } catch (err) {
                                                                    alert('Error');
                                                                }
                                                            }}
                                                            className="px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-100 shadow-xs"
                                                        >
                                                            Invoice
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const reason = prompt("Return reason:");
                                                                if (reason) {
                                                                    try {
                                                                        await api.post(`/orders/${order.id}/refund`, { reason });
                                                                        fetchOrders();
                                                                    } catch (err) {
                                                                        alert('Error');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all border border-primary/10 shadow-xs"
                                                        >
                                                            Return
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Orders;
