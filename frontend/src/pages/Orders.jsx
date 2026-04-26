import React, { useEffect, useState, Fragment } from 'react';
import api from '../services/api';
import {
    Package, ShoppingBag, X, FileText, MapPin, Eye, Phone,
    ChevronRight, Filter, ArrowUpDown, CheckCircle2,
    Clock, Truck, AlertCircle, ShoppingCart, Star
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
import './Orders.css';

const Orders = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filters & Sorting
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Latest');

    // Review Modal State
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [productToReview, setProductToReview] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/my');
            setOrders(res.data);
            applyFiltersAndSort(res.data, statusFilter, sortBy);
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSort = (data, filter, sort) => {
        let result = [...data];

        // Filter
        if (filter !== 'All') {
            result = result.filter(order => {
                const status = order.status.toLowerCase();
                if (filter === 'Processing') return status === 'pending' || status === 'processing';
                return status === filter.toLowerCase();
            });
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sort === 'Latest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredOrders(result);
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFiltersAndSort(orders, statusFilter, sortBy);
    }, [statusFilter, sortBy, orders]);

    const handleDownloadInvoice = async (orderId) => {
        try {
            const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
            window.open(url, '_blank');
        } catch {
            alert('Error downloading invoice');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const getStatusInfo = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
            case 'processing':
                return { label: 'Processing', class: 'processing', icon: <Clock size={14} />, step: 1 };
            case 'shipped':
                return { label: 'Shipped', class: 'shipped', icon: <Truck size={14} />, step: 2 };
            case 'delivered':
            case 'completed':
                return { label: 'Delivered', class: 'delivered', icon: <CheckCircle2 size={14} />, step: 3 };
            case 'cancelled':
                return { label: 'Cancelled', class: 'cancelled', icon: <AlertCircle size={14} />, step: 0 };
            default:
                return { label: status, class: '', icon: null, step: 1 };
        }
    };

    if (loading) return (
        <div className="order-history-wrapper flex items-center justify-center">
            <div className="text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse flex flex-col items-center gap-4">
                <ShoppingBag size={48} className="text-slate-200" />
                Loading Your Orders...
            </div>
        </div>
    );

    return (
        <div className="order-history-wrapper">
            <div className="order-history-container">

                {/* TOP BAR */}
                <div className="order-top-bar animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1>Order History</h1>
                        <p>Manage and track your recent purchases</p>
                    </div>
                </div>

                {/* FILTERS & SORT */}
                <div className="order-filters animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                    {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                        >
                            {f === 'All' ? <Filter size={14} /> : null} {f === 'All' ? 'All Orders' : f}
                        </button>
                    ))}

                    <div className="order-sort">
                        <ArrowUpDown size={14} className="text-slate-400" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="Latest">Latest Orders</option>
                            <option value="Oldest">Oldest Orders</option>
                        </select>
                    </div>
                </div>

                {/* LIST */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                            <ShoppingCart size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">No orders found</h2>
                        <p className="text-slate-500 mb-8 max-w-sm">
                            {statusFilter === 'All'
                                ? "You haven't placed any orders yet. Start shopping to fill your history!"
                                : `You don't have any orders with status "${statusFilter}".`}
                        </p>
                        {statusFilter !== 'All' && (
                            <button onClick={() => setStatusFilter('All')} className="order-btn primary px-8">View All Orders</button>
                        )}
                    </div>
                ) : (
                    <div className="order-list">
                        {filteredOrders.map(order => {
                            const statusInfo = getStatusInfo(order.status);

                            // Group components by build_id
                            const groupedItems = [];
                            const builds = {};

                            order.items.forEach(item => {
                                if (item.build_id) {
                                    if (!builds[item.build_id]) {
                                        builds[item.build_id] = { header: null, components: [] };
                                    }
                                    if (item.is_build_header) builds[item.build_id].header = item;
                                    else builds[item.build_id].components.push(item);
                                } else {
                                    groupedItems.push({ type: 'single', item });
                                }
                            });

                            Object.entries(builds).forEach(([bid, b]) => {
                                // Fallback: if no header is marked, use first component
                                if (!b.header && b.components.length > 0) {
                                    b.header = b.components[0];
                                    b.components = b.components.slice(1);
                                }
                                if (b.header) groupedItems.push({ type: 'build', ...b, build_id: bid });
                            });

                            return (
                                <Fragment key={order.id}>
                                    {groupedItems.map((group, gIdx) => {
                                        const isBuild = group.type === 'build';
                                        const item = isBuild ? group.header : group.item;
                                        if (!item) return null;

                                        const ai = isBuild ? item.build_metadata?.ai : null;
                                        const cardKey = `${order.id}-${isBuild ? 'build-' + group.build_id : 'single-' + gIdx}`;

                                        return (
                                            <div key={cardKey} className={`order-history-card animate-in fade-in slide-in-from-bottom-4 duration-500 ${isBuild ? 'is-build' : ''}`}>

                                                {/* IMAGE */}
                                                <div className="order-card-img-wrapper">
                                                    {item.image_url ? (
                                                        <img
                                                            src={formatImageUrl(item.image_url)}
                                                            alt={item.name}
                                                            onError={handleImageError}
                                                        />
                                                    ) : (
                                                        <Package className="text-slate-200" size={32} />
                                                    )}
                                                    {isBuild && <div className="build-badge">PC Build</div>}
                                                </div>

                                                {/* DETAILS */}
                                                <div className="order-card-details">
                                                    <h3>{isBuild ? "Custom Dream PC Build" : (item.name || `Product #${item.product_id}`)}</h3>
                                                    <div className="order-card-meta">
                                                        Order ID: #{order.id} • {new Date(order.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} • Qty: {item.qty} {item.color && <span className="text-slate-500 ml-2">• Color: {item.color}</span>}
                                                    </div>

                                                    {isBuild && (
                                                        <div className="build-items-preview">
                                                            {group.components.slice(0, 5).map((c, ci) => (
                                                                <span key={ci} className="item-tag">{c.name.split(' ').slice(0, 3).join(' ')}</span>
                                                            ))}
                                                            {group.components.length > 5 && <span className="item-tag">+{group.components.length - 5} more</span>}
                                                        </div>
                                                    )}

                                                    {ai && (
                                                        <div className="ai-analysis-snippet">
                                                            <div className="ai-snippet-header">
                                                                <Star size={12} fill="#6366f1" className="text-indigo-500" />
                                                                <span>AI Performance Analysis: {ai.score}/10</span>
                                                            </div>
                                                            {ai.analysis && (
                                                                <div className="ai-mini-grid">
                                                                    {Object.entries(ai.analysis).map(([key, val]) => (
                                                                        <div key={key} className="mini-spec">
                                                                            <span className="spec-label">{key}:</span>
                                                                            <span className="spec-val">{val}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* PROGRESS BAR (Only if not cancelled) */}
                                                    {order.status !== 'cancelled' && (
                                                        <div className="order-progress-container">
                                                            <div className={`progress-step ${statusInfo.step >= 1 ? 'completed' : 'active'}`}>
                                                                <div className="progress-dot"></div>
                                                                Order Placed
                                                            </div>
                                                            <div className="progress-line"></div>
                                                            <div className={`progress-step ${statusInfo.step >= 2 ? 'completed' : statusInfo.step === 1 ? 'active' : ''}`}>
                                                                <div className="progress-dot"></div>
                                                                {statusInfo.step >= 2 ? 'Shipped' : 'Processing'}
                                                            </div>
                                                            <div className="progress-line"></div>
                                                            <div className={`progress-step ${statusInfo.step >= 3 ? 'completed' : statusInfo.step === 2 ? 'active' : ''}`}>
                                                                <div className="progress-dot"></div>
                                                                Delivered
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* PRICE & STATUS */}
                                                <div className="order-card-status-info">
                                                    <div className="order-card-price">
                                                        {formatCurrency(isBuild ? (item.build_metadata?.total_price || item.price) : (item.price * item.qty))}
                                                    </div>
                                                    <div className={`order-card-status-pill status-pill ${statusInfo.class}`}>
                                                        {statusInfo.icon} {statusInfo.label}
                                                    </div>
                                                    <div className="delivery-info">
                                                        {order.status === 'delivered' || order.status === 'completed' ? (
                                                            <>Delivered on <span className="delivery-date">{new Date(new Date(order.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span></>
                                                        ) : order.status === 'cancelled' ? (
                                                            <span className="text-rose-500 font-bold uppercase text-[10px]">Order Terminated</span>
                                                        ) : (
                                                            <>Expected Delivery <span className="delivery-date">{new Date(new Date(order.date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span></>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="order-card-actions">
                                                    <button onClick={() => setSelectedOrder(order)} className="order-btn primary">
                                                        <Eye size={14} /> {isBuild ? 'View Build Details' : 'View Details'}
                                                    </button>
                                                    {order.status !== 'cancelled' && (
                                                        <button onClick={() => handleDownloadInvoice(order.id)} className="order-btn">
                                                            <FileText size={14} /> Invoice
                                                        </button>
                                                    )}
                                                    {order.status === 'pending' && item.status !== 'cancelled' && (
                                                        <button 
                                                            onClick={async () => {
                                                                const msg = isBuild ? "Are you sure you want to cancel this entire Custom PC build? This will cancel all components." : "Do you want to cancel this product?";
                                                                if (window.confirm(msg)) {
                                                                    try {
                                                                        await api.post(`/orders/${order.id}/cancel_item`, { product_id: item.product_id });
                                                                        fetchOrders();
                                                                    } catch {
                                                                        alert('Failed to cancel.');
                                                                    }
                                                                }
                                                            }}
                                                            className="order-btn danger"
                                                        >
                                                            <X size={14} /> Cancel
                                                        </button>
                                                    )}
                                                    {(order.status === 'delivered' || order.status === 'completed') && !isBuild && (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                className="order-btn success"
                                                                onClick={() => {
                                                                    setProductToReview({
                                                                        id: item.product_id,
                                                                        name: item.name || `Product #${item.product_id}`,
                                                                        image_url: formatImageUrl(item.image_url)
                                                                    });
                                                                    setIsReviewOpen(true);
                                                                }}
                                                            >
                                                                <Star size={14} /> Review Product
                                                            </button>
                                                            <button 
                                                                className="order-btn"
                                                                onClick={() => {
                                                                    const prod = {
                                                                        id: item.product_id,
                                                                        name: item.name,
                                                                        price: item.price,
                                                                        image_url: formatImageUrl(item.image_url)
                                                                    };
                                                                    addToCart(prod, 1, item.color);
                                                                    alert(`${item.name} added to cart`);
                                                                    navigate('/cart');
                                                                }}
                                                            >
                                                                <ShoppingCart size={14} /> Buy Again
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}
                    </div>
                )}

                {/* PAGINATION (Mocked) */}
                {filteredOrders.length > 5 && (
                    <div className="order-pagination">
                        <button className="page-nav-btn" disabled>Previous</button>
                        <button className="page-btn active">1</button>
                        <button className="page-btn">2</button>
                        <button className="page-btn">3</button>
                        <button className="page-nav-btn">Next <ChevronRight size={14} /></button>
                    </div>
                )}

            </div>

            {/* MODAL */}
            {selectedOrder && (
                <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="order-modal-container animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="order-modal-header">
                            <h3 className="order-modal-title">Order Info #{selectedOrder.id}</h3>
                            <button onClick={() => setSelectedOrder(null)} className="order-modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="order-modal-body">
                            <div className="order-modal-section">
                                <div className="order-modal-icon-wrapper blue">
                                    <MapPin size={24} />
                                </div>
                                <div className="order-modal-info">
                                    <h4 className="order-modal-subtitle">Shipping Destination</h4>
                                    <p className="order-modal-text">{selectedOrder.shipping_address || 'Address not listed'}</p>
                                </div>
                            </div>

                            <div className="order-modal-section">
                                <div className="order-modal-icon-wrapper green">
                                    <Phone size={24} />
                                </div>
                                <div className="order-modal-info">
                                    <h4 className="order-modal-subtitle">Contact Information</h4>
                                    <p className="order-modal-text">{selectedOrder.phone_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="order-modal-section">
                                <h4 className="order-modal-subtitle" style={{ marginBottom: '15px', color: '#1e293b' }}>Order Summary</h4>
                                <div className="order-modal-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {(() => {
                                        const grouped = [];
                                        const builds = {};
                                        (selectedOrder.items || []).forEach(item => {
                                            if (item.build_id) {
                                                if (!builds[item.build_id]) builds[item.build_id] = { header: null, components: [] };
                                                if (item.is_build_header) builds[item.build_id].header = item;
                                                else builds[item.build_id].components.push(item);
                                            } else {
                                                grouped.push({ type: 'single', item });
                                            }
                                        });
                                        Object.values(builds).forEach(b => {
                                            if (!b.header && b.components.length > 0) { b.header = b.components[0]; b.components = b.components.slice(1); }
                                            if (b.header) grouped.push({ type: 'build', ...b });
                                        });

                                        return grouped.map((group, idx) => {
                                            if (group.type === 'single') {
                                                return (
                                                    <div key={idx} className="order-modal-item">
                                                        <img src={formatImageUrl(group.item.image_url)} alt="" className="order-modal-item-img" onError={handleImageError} />
                                                        <div className="order-modal-item-info">
                                                            <h4>{group.item.name}</h4>
                                                            <p>Qty: {group.item.qty} • ₹{group.item.price?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                const allComponents = [group.header, ...group.components];
                                                return (
                                                    <div key={idx} className="order-modal-build-full-view">
                                                        <div className="modal-build-hero">
                                                            <div className="hero-img-container">
                                                                <img src={formatImageUrl(group.header.image_url)} alt="PC Build" onError={handleImageError} />
                                                                <div className="hero-badge">Custom Dream PC</div>
                                                            </div>
                                                            <div className="hero-details">
                                                                <h3>Custom Build Assembly</h3>
                                                                <p className="hero-id">System ID: #B-{group.build_id}</p>
                                                                <div className="hero-price">₹{(group.header.build_metadata?.total_price || group.header.price)?.toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="modal-build-specs-header">
                                                            <span>Build Components Breakdown</span>
                                                            <span className="count-badge">{allComponents.length} Items</span>
                                                        </div>

                                                        <div className="modal-build-grid">
                                                            {allComponents.map((c, ci) => (
                                                                <div key={ci} className="modal-component-card">
                                                                    <div className="comp-img-wrapper">
                                                                        <img src={formatImageUrl(c.image_url)} alt={c.name} onError={handleImageError} />
                                                                    </div>
                                                                    <div className="comp-info">
                                                                        <span className="comp-cat">{c.sub_category || (ci === 0 ? 'Cabinet' : 'Component')}</span>
                                                                        <h5 className="comp-name">{c.name}</h5>
                                                                        <div className="comp-footer">
                                                                            <span className="comp-price">₹{c.price?.toLocaleString()}</span>
                                                                            <span className="comp-qty">Qty: 1</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="order-modal-footer">
                            <button onClick={() => setSelectedOrder(null)} className="order-modal-btn">
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVIEW MODAL */}
            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                product={productToReview}
                onReviewSubmitted={() => {
                    alert("Review submitted! Thank you for your feedback.");
                    fetchOrders();
                }}
            />
        </div>
    );
};

export default Orders;
