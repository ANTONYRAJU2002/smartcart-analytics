import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { Trash2, CheckCircle, Plus, ArrowRight, ChevronLeft } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const buyNowProduct = location.state?.buyNowProduct;

    // Determine checkout items and total
    const checkoutItems = buyNowProduct
        ? [{ ...buyNowProduct, quantity: 1 }]
        : cart;

    const checkoutTotal = buyNowProduct
        ? Number(buyNowProduct.price)
        : cartTotal;

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);

    // Multi-Step State
    const [checkoutStep, setCheckoutStep] = useState(1);

    // Profile State (Customer Number)
    const [phoneNumber, setPhoneNumber] = useState('');
    const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
    const [isEditingPhone, setIsEditingPhone] = useState(false);

    // Inline Address State
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '', city: '', state: '', zip_code: '', country: '', is_default: false
    });

    // Dummy Payment State
    const [selectedPayment, setSelectedPayment] = useState('card');
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [upiId, setUpiId] = useState('');

    const fetchAddressesAndProfile = async () => {
        try {
            const [addrRes, profileRes] = await Promise.all([
                api.get('/user/addresses'),
                api.get('/auth/profile')
            ]);
            setAddresses(addrRes.data);
            if (addrRes.data.length > 0) {
                const defaultAddr = addrRes.data.find(a => a.is_default) || addrRes.data[0];
                setSelectedAddress(defaultAddr.id);
            }
            if (profileRes.data.phone_number) {
                setPhoneNumber(profileRes.data.phone_number);
                setOriginalPhoneNumber(profileRes.data.phone_number);
            }
        } catch (err) {
            console.error("Failed to fetch checkout data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddressesAndProfile();
    }, []);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/user/addresses', newAddress);
            await fetchAddressesAndProfile();
            setSelectedAddress(res.data.id);
            setIsAddingAddress(false);
            setNewAddress({ street: '', city: '', state: '', zip_code: '', country: '', is_default: false });
        } catch {
            alert('Failed to add address');
        }
    };

    const handleDeleteAddress = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/user/addresses/${id}`);
            if (selectedAddress === id) {
                setSelectedAddress(null);
            }
            fetchAddressesAndProfile();
        } catch {
            alert('Failed to delete address');
        }
    };

    const handleContinueToPayment = () => {
        if (!phoneNumber || phoneNumber.trim().length < 8) {
            alert("Please enter a valid mobile number for delivery contact.");
            return;
        }
        if (!selectedAddress) {
            alert("Please select a shipping address.");
            return;
        }
        setCheckoutStep(2);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!selectedAddress) {
            alert('Please select a shipping address');
            return;
        }

        if (checkoutStep !== 2) {
            handleContinueToPayment();
            return;
        }

        if ((selectedPayment === 'gpay' || selectedPayment === 'upi') && (!upiId || upiId.trim() === '')) {
            alert('Please enter your UPI ID');
            return;
        }

        setPlacingOrder(true);
        try {
            // Quietly save the phone number to the profile if it has changed
            if (phoneNumber && phoneNumber !== originalPhoneNumber) {
                await api.put('/auth/profile', { phone_number: phoneNumber });
            }

            const response = await api.post('/orders/', {
                items: checkoutItems.map(item => ({ id: item.id, quantity: item.quantity })),
                address_id: selectedAddress
            });

            const selectedAddrObj = addresses.find(a => a.id === selectedAddress);
            const addressString = selectedAddrObj
                ? `${selectedAddrObj.street}, ${selectedAddrObj.city}, ${selectedAddrObj.state} ${selectedAddrObj.zip_code}, ${selectedAddrObj.country}`
                : "Address details unavailable";

            const orderState = {
                orderDetails: {
                    orderId: response.data.order_id,
                    items: checkoutItems,
                    total: checkoutTotal,
                    address: addressString,
                    phoneNumber: phoneNumber
                }
            };

            if (!buyNowProduct) {
                clearCart();
            }

            navigate('/order-success', { state: orderState });
        } catch (err) {
            console.error("Order Placement Failure Details:", err.response?.data || err.message);
            const backendMsg = err.response?.data?.msg || "Please check your network and try again.";
            alert(`Failed to place order: ${backendMsg}`);
        } finally {
            setPlacingOrder(false);
        }
    };

    const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    if (checkoutItems.length === 0) {
        return (
            <div className="checkout-page-wrapper flex items-center justify-center">
                <div className="checkout-card text-center" style={{ maxWidth: '400px' }}>
                    <h1 className="text-2xl font-bold mb-4">Cart is Empty</h1>
                    <button onClick={() => navigate('/products')} className="checkout-continue-btn">Browse Products</button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page-wrapper">
            <div className="checkout-container">
                
                {/* LEFT SIDE */}
                <div className="checkout-left">
                    <h1>Checkout</h1>
                    <p className="checkout-sub">Choose your payment method and delivery address</p>

                    {checkoutStep === 2 && (
                        <button 
                            onClick={() => setCheckoutStep(1)}
                            className="mb-4 flex items-center gap-2 text-blue-600 font-bold cursor-pointer bg-transparent border-none p-0"
                        >
                            <ChevronLeft size={20} /> Back to Address
                        </button>
                    )}

                    {/* STEP 1: CONTACT & ADDRESS */}
                    {checkoutStep === 1 ? (
                        <div className="animate-in fade-in duration-500">
                            {/* CONTACT */}
                            <div className="checkout-card">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 style={{ margin: 0 }}>Contact Information</h3>
                                    {!isEditingPhone ? (
                                        <button 
                                            onClick={() => setIsEditingPhone(true)}
                                            className="text-blue-600 font-bold bg-transparent border-none p-0 cursor-pointer text-sm"
                                        >
                                            ✏ Edit
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditingPhone(false)}
                                            className="text-green-600 font-bold bg-transparent border-none p-0 cursor-pointer text-sm"
                                        >
                                            ✅ Done
                                        </button>
                                    )}
                                </div>
                                <div className="checkout-input-box">
                                    📞 {isEditingPhone ? (
                                        <input 
                                            type="text" 
                                            placeholder="Phone number" 
                                            value={phoneNumber} 
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-bold text-slate-700">{phoneNumber || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>

                            {/* ADDRESSES */}
                            <h3>Shipping Address</h3>
                            {addresses.map(addr => (
                                <div 
                                    key={addr.id} 
                                    className={`checkout-card ${selectedAddress === addr.id ? 'selected-address-card' : ''}`}
                                    onClick={() => setSelectedAddress(addr.id)}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="checkout-address-text">
                                            📍 <strong>{addr.street}</strong> <br />
                                            {addr.city}, {addr.zip_code} <br />
                                            {addr.state}, {addr.country}
                                        </p>
                                        {selectedAddress === addr.id && (
                                            <CheckCircle size={24} className="text-blue-600 fill-blue-50" />
                                        )}
                                    </div>

                                    <div className="checkout-actions">
                                        <button className="checkout-edit-btn" onClick={(e) => { e.stopPropagation(); /* Edit logic could go here */ }}>✏ Edit</button>
                                        <button className="checkout-delete-btn" onClick={(e) => handleDeleteAddress(e, addr.id)}>🗑 Delete</button>
                                    </div>
                                </div>
                            ))}

                            {/* ADD NEW */}
                            {!isAddingAddress ? (
                                <div className="checkout-card checkout-add-card" onClick={() => setIsAddingAddress(true)}>
                                    + Add New Address
                                </div>
                            ) : (
                                <div className="checkout-card">
                                    <h3>New Address</h3>
                                    <form onSubmit={handleAddAddress} className="space-y-4">
                                        <div className="checkout-input-box">
                                            <input required type="text" placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="checkout-input-box">
                                                <input required type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                            </div>
                                            <div className="checkout-input-box">
                                                <input required type="text" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="checkout-input-box">
                                                <input required type="text" placeholder="ZIP Code" value={newAddress.zip_code} onChange={e => setNewAddress({ ...newAddress, zip_code: e.target.value })} />
                                            </div>
                                            <div className="checkout-input-box">
                                                <input required type="text" placeholder="Country" value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsAddingAddress(false)}
                                                className="checkout-edit-btn p-3 rounded-lg flex-1 font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="checkout-continue-btn p-3 rounded-lg flex-1"
                                                style={{ width: 'auto' }}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <button className="checkout-continue-btn" onClick={handleContinueToPayment}>
                                Continue to Payment →
                            </button>
                        </div>
                    ) : (
                        /* STEP 2: PAYMENT OVERVIEW */
                        <div className="animate-in fade-in duration-500">
                            <div className="checkout-card">
                                <h3>Payment Method</h3>
                                <div className="flex gap-4 mb-6">
                                    <button 
                                        onClick={() => setSelectedPayment('card')}
                                        className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${selectedPayment === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                    >
                                        💳 Card
                                    </button>
                                    <button 
                                        onClick={() => setSelectedPayment('upi')}
                                        className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${selectedPayment === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                    >
                                        📱 UPI
                                    </button>
                                </div>

                                {selectedPayment === 'card' ? (
                                    <div className="space-y-4">
                                        <div className="checkout-input-box">
                                            <input type="text" placeholder="Card Number" value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="checkout-input-box">
                                                <input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} />
                                            </div>
                                            <div className="checkout-input-box">
                                                <input type="password" placeholder="CVV" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="checkout-input-box">
                                        <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" value={upiId} onChange={e => setUpiId(e.target.value)} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="checkout-card">
                                <h3>Delivery Contact</h3>
                                <div className="checkout-input-box">
                                    📞 <strong>{phoneNumber}</strong>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Order updates will be sent to this number.</p>
                            </div>

                            <button className="checkout-continue-btn" onClick={handlePlaceOrder} disabled={placingOrder}>
                                {placingOrder ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE (SUMMARY) */}
                <div className="checkout-right">
                    <h3>Order Summary</h3>

                    {checkoutItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="mb-4">
                            <div className="checkout-row">
                                <span>{item.name}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                            <p className="checkout-qty-info">Qty: {item.quantity}</p>
                        </div>
                    ))}

                    <hr className="checkout-hr" />

                    <div className="checkout-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(checkoutTotal)}</span>
                    </div>

                    <div className="checkout-row">
                        <span>Shipping</span>
                        <span className="checkout-free-text">Free</span>
                    </div>

                    <hr className="checkout-hr" />

                    <div className="checkout-total-row">
                        <span>Total</span>
                        <span>{formatCurrency(checkoutTotal)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Checkout;
