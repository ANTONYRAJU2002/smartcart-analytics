import { useState, useEffect } from 'react';
import { 
    X, Save, Package, CheckCircle, XCircle, 
    AlertCircle, Activity, ChevronRight, User, 
    MapPin, Truck, Calendar, Clock, CreditCard, ChevronDown, Sparkles, IndianRupee
} from 'lucide-react';
import { formatImageUrl, handleImageError } from '../../utils/imageUtils';
import api from '../../services/api';

const OrderDetail = ({ order, onClose, onUpdate }) => {
    const [status, setStatus] = useState(order.status);
    const [tracking, setTracking] = useState(order.tracking_number || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.patch(`/orders/${order.id}/status`, { status, tracking_number: tracking });
            onUpdate();
            onClose();
        } catch (err) {
            alert("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (s) => {
        const labels = {
            'pending': 'Order Placed',
            'packed': 'Order Packed',
            'shipped': 'Order Shipped',
            'delivered': 'Order Delivered',
            'cancelled': 'Order Cancelled',
            'returned': 'Returned Item',
            'return_requested': 'Refund Requested',
            'failure': 'Delivery Failed',
            'returned_to_warehouse': 'Returned to Whouse'
        };
        return labels[s] || s;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date Unknown';
        try {
            const date = new Date(dateStr.replace(' ', 'T'));
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', ' •');
        } catch (e) {
            return dateStr;
        }
    };

    const getStatusVariant = (s) => {
        switch (s) {
            case 'delivered': return 'bg-emerald-500 text-white';
            case 'shipped': return 'bg-blue-600 text-white';
            case 'pending': return 'bg-amber-500 text-white';
            case 'cancelled': return 'bg-rose-500 text-white';
            case 'failure': return 'bg-rose-100 text-rose-600';
            case 'returned_to_warehouse': return 'bg-slate-900 text-white';
            default: return 'bg-indigo-600 text-white';
        }
    };

    return (
        <div className="order-modal-container">
            {/* Modal Header Bar */}
            <header className="modal-header">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Order Details</h2>
                    <div className="modal-meta">
                        <span className="text-indigo-600 font-black">#{order.id}</span>
                        <span className="flex items-center gap-2 italic">Placed on {formatDate(order.date)}</span>
                        <span className="mx-2">•</span>
                        <span className="text-slate-400">Customer: {order.user_name || "Guest"} • {order.items?.length || 0} Items • ⭐ 5.0</span>
                    </div>
                </div>
                <button onClick={onClose} className="modal-close-btn">
                    <X size={24} />
                </button>
            </header>

            <div className="modal-grid custom-scrollbar">
                {/* Left Column - Main Details */}
                <div className="flex flex-col">
                    <div className="modal-card">
                        <div className="modal-card-header modal-card-header--beige">
                            Order Details
                        </div>
                        <div className="modal-card-body pt-0">
                            {(() => {
                                const items = order.items || [];
                                const grouped = [];
                                const builds = {};

                                items.forEach(item => {
                                    if (item.build_id) {
                                        if (!builds[item.build_id]) {
                                            builds[item.build_id] = { header: null, components: [] };
                                        }
                                        if (item.is_build_header) {
                                            builds[item.build_id].header = item;
                                        } else {
                                            builds[item.build_id].components.push(item);
                                        }
                                    } else {
                                        grouped.push({ type: 'single', item });
                                    }
                                });

                                Object.keys(builds).forEach(bid => {
                                    grouped.push({ type: 'build', ...builds[bid] });
                                });

                                return grouped.map((group, idx) => {
                                    if (group.type === 'single') {
                                        const item = group.item;
                                        return (
                                            <div key={idx} className="modal-product-item">
                                                <div className="product-img-box">
                                                    <img 
                                                        src={formatImageUrl(item.image_url)} 
                                                        alt={item.name} 
                                                        onError={handleImageError}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <h4>{item.name || "Product Name"}</h4>
                                                        <div className="text-right">
                                                            <span className="text-lg font-black">₹{item.price?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">{item.category}</p>
                                                    <div className="flex gap-4 mt-2 items-center flex-wrap">
                                                        <div className="text-[10px] font-bold text-slate-500">Qty: {item.qty || 1}</div>
                                                        {item.color && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span
                                                                    style={{
                                                                        display: 'inline-block',
                                                                        width: 12,
                                                                        height: 12,
                                                                        borderRadius: '50%',
                                                                        background: item.color,
                                                                        border: '1.5px solid rgba(0,0,0,0.15)',
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-500 capitalize">{item.color}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const { header, components } = group;
                                        const ai = header?.build_metadata?.ai;
                                        return (
                                            <div key={idx} className="border-2 border-indigo-50 rounded-2xl p-4 mb-4 bg-indigo-50/20">
                                                <div className="flex gap-4 items-center mb-4">
                                                    <div className="w-16 h-16 bg-white rounded-xl p-2 border border-indigo-100">
                                                        <img 
                                                            src={formatImageUrl(header?.image_url)} 
                                                            alt="Build" 
                                                            className="w-full h-full object-contain" 
                                                            onError={handleImageError}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-indigo-900 flex items-center gap-2">
                                                            Custom Dream PC Build
                                                            <Sparkles size={14} className="text-indigo-500" />
                                                        </h4>
                                                        {ai && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black">{ai.score} / 10</span>
                                                                <span className="text-[10px] font-bold text-indigo-400 italic">{ai.text}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-lg font-black text-indigo-600">₹{header?.build_metadata?.total_price?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2 pl-4 border-l-2 border-indigo-100">
                                                    {components.map((c, cidx) => (
                                                        <div key={cidx} className="flex justify-between items-center text-[10px] font-bold">
                                                            <span className="text-slate-500">{c.name}</span>
                                                            <span className="text-slate-400">₹{c.price?.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {ai && ai.analysis && (
                                                    <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-100">
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">AI Build Analysis</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {Object.entries(ai.analysis).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between border-b border-slate-50 pb-1">
                                                                    <span className="text-[9px] text-slate-400 uppercase">{key}</span>
                                                                    <span className="text-[9px] font-black text-slate-700">{value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                });
                            })()}
                            {(!order.items || order.items.length === 0) && (
                                <div className="py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    No items found in this order
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery Proof Section */}
                    {order.status === 'delivered' && (
                        <div className="modal-card">
                            <div className="modal-card-header modal-card-header--blue">Delivery Confirmation Proof</div>
                            <div className="modal-card-body">
                                {order.payment_method === 'COD' && (
                                    <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                <IndianRupee size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest m-0">COD Payment Received</p>
                                                <p className="text-lg font-black text-emerald-900 m-0">₹{order.collected_amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        {order.is_cod_received && (
                                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Verified</span>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Proof of Delivery Photos</h5>
                                    <div className="grid grid-cols-3 gap-4">
                                        {order.delivery_proof && order.delivery_proof.length > 0 ? (
                                            order.delivery_proof.map((url, idx) => (
                                                <a key={idx} href={formatImageUrl(url)} target="_blank" rel="noreferrer" className="aspect-ratio-box rounded-xl overflow-hidden border border-slate-100 hover:ring-4 ring-indigo-500/10 transition-all">
                                                    <img 
                                                        src={formatImageUrl(url)} 
                                                        alt={`Proof ${idx + 1}`} 
                                                        className="w-full h-full object-cover" 
                                                        onError={handleImageError}
                                                    />
                                                </a>
                                            ))
                                        ) : (
                                            <div className="col-span-3 py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <Package size={24} className="text-slate-200 mx-auto mb-2" />
                                                <p className="text-[10px] font-bold text-slate-300 uppercase">No proof images uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Record Timeline */}
                    <div className="modal-card">
                        <div className="modal-card-header modal-card-header--blue">Order Record Flow</div>
                        <div className="modal-card-body py-6">
                            <div className="modal-timeline px-2">
                                {(order.history && order.history.length > 0) ? (
                                    order.history.map((h, i) => (
                                        <div key={i} className={`timeline-step ${i === order.history.length - 1 ? 'active' : 'completed'}`}>
                                            <div className="timeline-content">
                                                <h5 className="text-[14px] font-black text-slate-900 leading-none mb-1">{getStatusLabel(h.status)}</h5>
                                                <p className="text-[11px] font-bold text-slate-400">{formatDate(h.timestamp)}</p>
                                                
                                                {h.message && (
                                                    <div className={`mt-2 p-3 rounded-xl border text-[10px] font-medium ${h.status === 'failure' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                        {h.message}
                                                    </div>
                                                )}

                                                {(h.status === 'shipped' || h.status === 'packed') && order.tracking_number && (
                                                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Tracking Number</p>
                                                        <p className="text-[13px] font-black text-indigo-700 mt-1">{order.tracking_number}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="timeline-step completed">
                                        <div className="timeline-content">
                                            <h5 className="text-[14px] font-black text-slate-900 leading-none mb-1">Order Placed</h5>
                                            <p className="text-[11px] font-bold text-slate-400">{formatDate(order.date)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="flex flex-col">
                    <div className="modal-card">
                        <div className="modal-card-header">Order Summary</div>
                        <div className="modal-card-body">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold text-sm">Total</span>
                                <span className="text-xl font-black text-slate-900">₹{order.total?.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2 mt-4 justify-end">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400" title="Credit Card"><CreditCard size={14} /></div>
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500" title="Payment Verified"><CheckCircle size={14} /></div>
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400" title="System Log"><Save size={14} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-card">
                        <div className="modal-card-header">Customer Information</div>
                        <div className="modal-card-body space-y-4">
                            <div>
                                <h5 className="text-[14px] font-black text-slate-900">{order.user_name || order.user || "Customer Name"}</h5>
                                <p className="text-[11px] font-bold text-slate-400 mt-1">{order.user_email || order.email || "no-email@smartcart.com"}</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-1">{order.user_phone || order.phone || order.shipping_address?.phone || "+91 00000 00000"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Moved Action Section to Sidebar for better focus */}
                    <div className="modal-card">
                        <div className="modal-card-header">Logistics Control</div>
                        <div className="modal-card-body space-y-4">
                            <div className="relative">
                                <select 
                                    value={status} 
                                    onChange={(e) => {
                                        const newStatus = e.target.value;
                                        setStatus(newStatus);
                                        if (newStatus === 'packed' && !tracking) {
                                            const now = new Date();
                                            const day = String(now.getDate()).padStart(2, '0');
                                            const month = String(now.getMonth() + 1).padStart(2, '0');
                                            const year = now.getFullYear();
                                            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                                            setTracking(`TRK-${random}-${day}${month}${year}`);
                                        }
                                    }}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500/10"
                                >
                                    <option value="pending">Mark as Pending</option>
                                    <option value="packed">Packed & Ready</option>
                                    <option value="shipped">Shipped Transit</option>
                                    <option value="delivered">Delivered Success</option>
                                    <option value="cancelled">Cancel Order</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Tracking ID" 
                                value={tracking}
                                onChange={(e) => setTracking(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                            />
                            <button onClick={handleSave} className="w-full py-4 btn-status-update rounded-xl text-[10px] font-black uppercase text-white shadow-xl shadow-emerald-100 transition-all">
                                {loading ? 'Processing...' : 'Update status now'}
                            </button>
                            <button onClick={onClose} className="w-full py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-100 transition-all">Close Modal</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
