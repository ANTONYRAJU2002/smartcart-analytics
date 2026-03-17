import React, { useEffect, useState, Fragment } from 'react';
import api from '../services/api';
import { 
    Package, ShoppingBag, X, FileText, MapPin, Eye, Phone, 
    ChevronRight, Filter, ArrowUpDown, CheckCircle2, 
    Clock, Truck, AlertCircle, ShoppingCart 
} from 'lucide-react';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    // Filters & Sorting
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Latest');

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
                            return (
                                <Fragment key={order.id}>
                                    {order.items.map((item, idx) => (
                                        <div key={`${order.id}-${idx}`} className="order-history-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            
                                            {/* IMAGE */}
                                            <div className="order-card-img-wrapper">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} />
                                                ) : (
                                                    <Package className="text-slate-200" size={32} />
                                                )}
                                            </div>

                                            {/* DETAILS */}
                                            <div className="order-card-details">
                                                <h3>{item.name || `Product #${item.product_id}`}</h3>
                                                <div className="order-card-meta">
                                                    Order ID: #{order.id} • {new Date(order.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} • Qty: {item.qty}
                                                </div>

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
                                                <div className="order-card-price">{formatCurrency(item.price * item.qty)}</div>
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
                                                    <Eye size={14} /> View Details
                                                </button>
                                                {order.status !== 'cancelled' && (
                                                    <button onClick={() => handleDownloadInvoice(order.id)} className="order-btn">
                                                        <FileText size={14} /> Invoice
                                                    </button>
                                                )}
                                                {order.status === 'pending' && item.status !== 'cancelled' && (
                                                    <button 
                                                        onClick={async () => {
                                                            if (window.confirm("Do you want to cancel this product?")) {
                                                                try {
                                                                    await api.post(`/orders/${order.id}/cancel_item`, { product_id: item.product_id });
                                                                    fetchOrders();
                                                                } catch {
                                                                    alert('Failed to cancel product.');
                                                                }
                                                            }
                                                        }}
                                                        className="order-btn danger"
                                                    >
                                                        <X size={14} /> Cancel
                                                    </button>
                                                )}
                                                {(order.status === 'delivered' || order.status === 'completed') && (
                                                    <button className="order-btn success">
                                                        <ShoppingCart size={14} /> Buy Again
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
                        <button className="page-nav-btn">Next <ChevronRight size={14}/></button>
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
                                    <h4 className="order-modal-subtitle">Contact Numbers</h4>
                                    <p className="order-modal-text">{selectedOrder.phone_number || 'N/A'}</p>
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
        </div>
    );
};

export default Orders;
