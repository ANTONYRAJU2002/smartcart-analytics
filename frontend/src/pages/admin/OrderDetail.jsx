import { useState, useEffect } from 'react';
import { X, Save, Package, CheckCircle, XCircle, AlertCircle, Activity, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const OrderDetail = ({ order, onClose, onUpdate }) => {
    const [status, setStatus] = useState(order.status);
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status || 'pending');
    const [tracking, setTracking] = useState(order.tracking_number || '');
    const [loading, setLoading] = useState(false);
    const [refundInfo, setRefundInfo] = useState(null);

    useEffect(() => {
        if (order.status === 'return_requested' || order.status === 'returned') {
            const fetchRefund = async () => {
                try {
                    const res = await api.get('/admin/refunds');
                    const info = res.data.find(r => r.order_id === order.id);
                    setRefundInfo(info);
                } catch (err) {
                    console.error("Failed to fetch refund info", err);
                }
            };
            fetchRefund();
        }
    }, [order.id, order.status]);

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

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.patch(`/orders/${order.id}/status`, { status, tracking_number: tracking });
            await api.patch(`/orders/${order.id}/payment`, { payment_status: paymentStatus });
            onUpdate();
            onClose();
        } catch (err) {
            alert("Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Resolution Header */}
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                        <Package size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-black text-slate-900 leading-none">Order Resolution</h2>
                            <span className="font-mono text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">#{order.id}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Deployment Archive
                            <ChevronRight size={10} />
                            Fulfillment Cycle
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Order Contents & Customer (60%) */}
                <div className="flex-[1.5] overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50/30">
                    {/* Customer Info Card */}
                    <section>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Customer Profile</h3>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black uppercase">
                                {order.user?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate">{order.user}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{order.user_email}</p>
                            </div>
                            <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Account Status</p>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified</p>
                            </div>
                        </div>
                    </section>

                    {/* Shipping Address */}
                    <section>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 text-right">Destination</h3>
                        <div className="bg-white border border-slate-200 rounded-21 p-4 border-dashed border-slate-300">
                            <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                                {order.shipping_address || 'No shipping address specified in records.'}
                            </p>
                        </div>
                    </section>

                    {/* Refund Info Section (Conditional) */}
                    {refundInfo && (
                        <section className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2 animate-in slide-in-from-top-4 duration-300 shadow-sm mb-8">
                            <div className="flex items-center gap-2 text-rose-700 font-black text-[9px] uppercase tracking-widest">
                                <AlertCircle size={14} />
                                Refund Argument
                            </div>
                            <p className="text-[10px] text-rose-600 bg-white/60 p-3 rounded-xl border border-rose-100 font-medium italic leading-relaxed">
                                "{refundInfo.reason}"
                            </p>
                        </section>
                    )}

                    {/* Line Items */}
                    <section>
                        <div className="flex justify-between items-end mb-3 px-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Dispatched</h3>
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{order.items?.length || 0} Distinct Units</span>
                        </div>
                        <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-4 hover:border-indigo-100 transition-all shadow-xs group">
                                    <div className="w-12 h-9 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={14} className="text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[8px] font-black text-slate-400 font-mono uppercase tracking-tighter">SKU-{item.product_id}</span>
                                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest px-1 bg-indigo-50 border border-indigo-100 rounded">{item.category}</span>
                                        </div>
                                        <p className="text-[11px] font-black text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[11px] font-black text-slate-900">₹{item.price?.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.qty}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Side: Logistics Controls (40%) */}
                <div className="flex-1 border-l border-slate-100 p-6 flex flex-col gap-6 bg-white overflow-y-auto custom-scrollbar">
                    {/* Status Management */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-indigo-600" />
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Status Engine</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Logistics Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="packed">Packed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="return_requested">Return Requested</option>
                                    <option value="returned">Returned</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fiscal Reconciliation</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Spatial Tracking ID</label>
                                <div className="relative">
                                    <AlertCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={tracking}
                                        onChange={(e) => setTracking(e.target.value)}
                                        placeholder="TRACK-XXXX-XXXX"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Order Summary */}
                    <div className="mt-auto bg-slate-900 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <div className="flex justify-between items-end mb-4 relative z-10">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fiscal Value</p>
                                <p className="text-2xl font-black tracking-tighter">₹{order.total?.toLocaleString()}</p>
                            </div>
                            <div className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                INR Currency
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-white hover:text-indigo-600 transition-all text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 relative z-10 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {loading ? 'Committing...' : 'Commit Manifest'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
