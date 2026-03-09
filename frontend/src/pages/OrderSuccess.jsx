import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Smartphone, ArrowRight, ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderDetails } = location.state || {};

    // If no order details (direct access to page), redirect to home
    useEffect(() => {
        if (!orderDetails) {
            navigate('/');
        }
    }, [orderDetails, navigate]);

    if (!orderDetails) return null;

    const { items, total, address, phoneNumber } = orderDetails;

    return (
        <div className="layout-wrapper bg-slate-50 min-h-screen py-8">
            <div className="container max-w-xl px-4">
                {/* Success Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100/50 text-emerald-600 rounded-2xl mb-4 border border-emerald-100">
                        <CheckCircle size={32} className="stroke-[2.5px]" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1.5">Success!</h1>
                    <p className="text-slate-500 text-sm font-medium">Your hardware acquisition is confirmed.</p>
                </div>

                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    {/* Delivery Details Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Logistics Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50">
                                    <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Destination</p>
                                    <p className="font-bold text-slate-800 text-[11px] leading-tight truncate">{address}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50/50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/50">
                                    <Smartphone size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Contact</p>
                                    <p className="font-bold text-slate-800 text-[11px] truncate">{phoneNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Inventory Manifest</h2>

                        <div className="space-y-2 mb-6">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-7 bg-white rounded border border-slate-100 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Package size={12} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-[10px] truncate max-w-[180px]">{item.name}</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-primary text-[10px]">₹{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Total Value</span>
                                <span className="text-xl font-black text-primary tracking-tight">₹{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => navigate('/orders')}
                            className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            <Package size={14} /> My Orders
                        </button>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                        >
                            <ShoppingBag size={14} /> Shop More
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
