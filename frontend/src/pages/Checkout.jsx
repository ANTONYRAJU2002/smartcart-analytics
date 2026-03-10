import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { CreditCard, MapPin, Truck, CheckCircle, Plus, Trash2, Lock, Smartphone, ArrowRight, ChevronLeft } from 'lucide-react';

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
        } catch (err) {
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
        } catch (err) {
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

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    if (checkoutItems.length === 0) {
        return (
            <div className="layout-wrapper flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Cart is Empty</h1>
                    <button onClick={() => navigate('/products')} className="btn btn-primary rounded-full px-6 py-2">Browse Products</button>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-wrapper bg-slate-50 min-h-screen">
            <div className="container py-12 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
                    <p className="text-slate-500 mt-1">Choose your payment method and delivery address</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                    {/* Left Column: Flow Content */}
                    <div className="space-y-6">

                        {/* STEP 1: CONTACT & ADDRESS */}
                        {checkoutStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Contact Info */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h2 className="text-lg font-bold mb-6 text-slate-800 tracking-tight">Contact Information</h2>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Mobile Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Enter your 10-digit mobile number"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium transition-shadow"
                                        />
                                    </div>
                                </div>

                                {/* Address Selection */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                                        Shipping Address
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map(addr => (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddress(addr.id)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${selectedAddress === addr.id
                                                    ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 shadow-sm'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <p className="font-bold text-slate-800 mb-1">{addr.street}</p>
                                                <p className="text-sm text-slate-600">{addr.city}, {addr.zip_code}</p>
                                                <p className="text-sm text-slate-600">{addr.state}, {addr.country}</p>

                                                {/* Actions */}
                                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleDeleteAddress(e, addr.id)}
                                                        className={`p-1.5 rounded-md hover:bg-rose-100 hover:text-rose-600 transition-colors ${selectedAddress === addr.id ? 'opacity-100 text-slate-400' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`}
                                                        title="Delete address"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {selectedAddress === addr.id && (
                                                        <div className="text-indigo-600 bg-white rounded-full">
                                                            <CheckCircle size={20} className="fill-indigo-100" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {!isAddingAddress && (
                                            <div
                                                onClick={() => setIsAddingAddress(true)}
                                                className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-slate-500 hover:text-indigo-600 min-h-[140px]"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <Plus size={20} />
                                                </div>
                                                <span className="font-medium">Add New Address</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Add Address Form */}
                                    {isAddingAddress && (
                                        <form onSubmit={handleAddAddress} className="mt-6 p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                                            <h3 className="font-bold text-slate-800 mb-4">Enter New Address</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className="form-label">Street Address</label>
                                                    <input required type="text" className="form-input bg-white" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="form-label">City</label>
                                                    <input required type="text" className="form-input bg-white" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="form-label">State</label>
                                                    <input required type="text" className="form-input bg-white" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="form-label">ZIP / Postal Code</label>
                                                    <input required type="text" className="form-input bg-white" value={newAddress.zip_code} onChange={e => setNewAddress({ ...newAddress, zip_code: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="form-label">Country</label>
                                                    <input required type="text" className="form-input bg-white" value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-6">
                                                <button type="button" onClick={() => setIsAddingAddress(false)} className="btn btn-secondary">Cancel</button>
                                                <button type="submit" className="btn btn-primary">Save Address</button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                <button
                                    onClick={handleContinueToPayment}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Continue to Payment <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* STEP 2: PAYMENT OVERVIEW */}
                        {checkoutStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                <button
                                    onClick={() => setCheckoutStep(1)}
                                    className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                                >
                                    <ChevronLeft size={18} /> Back to Address
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <button
                                        onClick={() => setSelectedPayment('gpay')}
                                        className={`py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all border ${selectedPayment === 'gpay'
                                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-500 shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">G</div>
                                        Google Pay
                                    </button>
                                    <button
                                        onClick={() => setSelectedPayment('upi')}
                                        className={`py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all border ${selectedPayment === 'upi'
                                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-500 shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Smartphone size={20} className={selectedPayment === 'upi' ? 'text-indigo-600' : 'text-slate-500'} />
                                        PhonePe / UPI
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Or Pay With Card</span>
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                </div>

                                {selectedPayment === 'card' && (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3 text-slate-800 font-bold">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <CreditCard size={20} />
                                                </div>
                                                Credit / Debit Card
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="px-2 py-1 bg-slate-100 text-[10px] font-black tracking-wider text-slate-500 rounded">VISA</div>
                                                <div className="px-2 py-1 bg-slate-100 text-[10px] font-black tracking-wider text-slate-500 rounded">MC</div>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={cardDetails.name}
                                                    onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium transition-shadow"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="4242 4242 4242 4242"
                                                    value={cardDetails.number}
                                                    onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium font-mono text-lg tracking-widest transition-shadow"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Expiry</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        value={cardDetails.expiry}
                                                        onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium tracking-wide transition-shadow"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">CVV</label>
                                                    <input
                                                        type="password"
                                                        placeholder="•••"
                                                        value={cardDetails.cvv}
                                                        onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium tracking-widest transition-shadow"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(selectedPayment === 'gpay' || selectedPayment === 'upi') && (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3 text-slate-800 font-bold">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    {selectedPayment === 'gpay' ? (
                                                        <span className="font-bold">G</span>
                                                    ) : (
                                                        <Smartphone size={20} />
                                                    )}
                                                </div>
                                                {selectedPayment === 'gpay' ? 'Google Pay' : 'PhonePe / UPI'}
                                            </div>
                                            <div className="px-3 py-1 bg-green-100 text-[10px] font-black tracking-wider text-green-700 rounded-full flex gap-1 items-center">
                                                <CheckCircle size={10} /> SECURE
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Enter your UPI ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. jondoe@oksbi or 9876543210@ybl"
                                                    value={upiId}
                                                    onChange={e => setUpiId(e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium transition-shadow"
                                                />
                                            </div>
                                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-700 flex gap-3 items-start">
                                                <Smartphone className="mt-0.5 shrink-0" size={16} />
                                                <p>Enter your Virtual Payment Address (VPA). Your payment will be simulated right away securely.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={placingOrder}
                                    className={`w-full mt-6 bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${placingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <Lock size={18} /> {placingOrder ? 'Processing...' : 'Place Order'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm sticky top-24">
                            <h2 className="text-lg font-bold mb-6 text-slate-800 tracking-tight">Order Summary</h2>
                            <div className="flex flex-col gap-4 mb-6">
                                {checkoutItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm leading-tight">{item.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-100 pt-5 space-y-3 mb-5">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal</span>
                                    <span>₹{checkoutTotal.toFixed(0)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-lg font-black text-slate-800">Total</span>
                                    <span className="text-2xl font-black text-indigo-600">₹{checkoutTotal.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
