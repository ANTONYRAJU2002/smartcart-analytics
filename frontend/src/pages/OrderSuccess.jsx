import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Package, MapPin, Smartphone, ShoppingBag, Truck, Download, Mail } from 'lucide-react';
import { useEffect } from 'react';
import api from '../services/api';
import './OrderSuccess.css';

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

    const { items, total, address, phoneNumber, orderId } = orderDetails;

    const handleDownloadInvoice = async () => {
        try {
            const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
            window.open(url, '_blank');
        } catch (err) {
            console.error("Invoice Download Failed:", err);
            alert('Failed to download invoice. Please try again later.');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    // Mock estimated delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const dateOptions = { month: 'long', day: 'numeric' };
    const formattedDate = deliveryDate.toLocaleDateString('en-US', dateOptions);

    return (
        <div className="order-success-body">
            <div className="order-success-container">
                
                {/* SUCCESS HEADER */}
                <div className="order-success-header animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="order-success-icon-wrap">
                        <Check size={32} strokeWidth={4} />
                    </div>
                    <div className="order-success-title-box">
                        <h1>Order Confirmed!</h1>
                        <p>Your item will be delivered soon.</p>
                    </div>
                </div>

                <div className="order-success-grid animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    
                    {/* LEFT COLUMN */}
                    <div className="order-success-left">
                        
                        {/* PRODUCT CARD(S) */}
                        {items.map((item, idx) => (
                            <div key={idx} className="order-success-card order-success-product-item">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} />
                                ) : (
                                    <div className="flex items-center justify-center bg-slate-100 rounded-xl" style={{ width: '220px', height: '160px' }}>
                                        <Package size={48} className="text-slate-300" />
                                    </div>
                                )}
                                <div className="order-success-product-info">
                                    <h2>{item.name}</h2>
                                    <p>{item.category || 'Electronic Hardware'}</p>
                                    <p className="order-success-product-qty">Qty: {item.quantity}</p>
                                </div>
                            </div>
                        ))}

                        {/* SUMMARY CARD */}
                        <div className="order-success-card">
                            <h3>Order Summary</h3>
                            <div className="order-success-summary-row">
                                <span>Item Price</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                            <div className="order-success-summary-row">
                                <span>Delivery</span>
                                <span className="order-success-free-label">Free</span>
                            </div>
                            <div className="order-success-summary-row order-success-summary-total">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="order-success-right">
                        
                        {/* DELIVERY DETAILS */}
                        <div className="order-success-card">
                            <h3>Delivery Details</h3>
                            <div className="order-delivery-status">
                                <p className="order-delivery-arriving">Arriving by <b>{formattedDate}</b></p>
                                
                                <div className="order-delivery-progress">
                                    <div className="order-delivery-step active">
                                        <div className="order-delivery-dot"></div>
                                        <span className="order-delivery-label">Confirmed</span>
                                    </div>
                                    <div className="order-delivery-step">
                                        <div className="order-delivery-dot"></div>
                                        <span className="order-delivery-label">Shipped</span>
                                    </div>
                                    <div className="order-delivery-step">
                                        <div className="order-delivery-dot"></div>
                                        <span className="order-delivery-label">Out</span>
                                    </div>
                                    <div className="order-delivery-step">
                                        <div className="order-delivery-dot"></div>
                                        <span className="order-delivery-label">Delivered</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ADDRESS CARD */}
                        <div className="order-success-card">
                            <h3>Delivery Address</h3>
                            
                            <div className="order-success-detail-row">
                                <MapPin size={18} />
                                <div className="order-success-detail-content">
                                    <p>{address}</p>
                                </div>
                            </div>

                            <div className="order-success-detail-row">
                                <Smartphone size={18} />
                                <div className="order-success-detail-content">
                                    <p>{phoneNumber || '9961228320'}</p>
                                </div>
                            </div>

                            <div className="order-success-detail-row">
                                <Mail size={18} />
                                <div className="order-success-detail-content">
                                    <p>Support included via SmartCart</p>
                                </div>
                            </div>
                        </div>

                        {/* NAVIGATION BUTTONS */}
                        <div className="order-success-buttons">
                            <button 
                                onClick={() => navigate('/orders')}
                                className="order-success-btn order-success-btn-primary"
                            >
                                <Truck size={18} /> Track Order
                            </button>
                            <button 
                                onClick={() => navigate('/products')}
                                className="order-success-btn order-success-btn-secondary"
                            >
                                <ShoppingBag size={18} /> Continue Shopping
                            </button>
                            <button 
                                onClick={handleDownloadInvoice}
                                className="order-success-btn order-success-btn-download"
                            >
                                <Download size={14} /> Download Invoice
                            </button>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default OrderSuccess;
