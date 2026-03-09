import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';

const Cart = () => {
    const { cart, removeFromCart, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (cart.length === 0) {
        return (
            <div className="layout-wrapper flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl border border-border-color shadow-sm max-w-md w-full">
                    <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                        <ShoppingBag size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-text-main">Your cart is empty</h2>
                    <p className="text-text-secondary mb-8">Looks like you haven't added anything yet.</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="btn btn-primary w-full py-3 rounded-full"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-wrapper">
            <div className="container py-12">
                <button
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-8 font-medium"
                >
                    <ArrowLeft size={18} /> Continue Shopping
                </button>

                <h1 className="text-3xl font-bold mb-8 text-text-main">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Items List */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {cart.map((item, idx) => (
                            <div key={idx} className="bg-white border border-border-color rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                                <div className="w-12 h-9 bg-bg-main rounded-lg flex items-center justify-center p-0.5 flex-shrink-0 border border-border-color">
                                    {item.image_url ?
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" /> :
                                        <span className="text-[10px] text-text-muted">No Img</span>
                                    }
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-semibold text-text-main mb-1">{item.name}</h3>
                                    <p className="text-text-muted text-sm">{item.category}</p>
                                </div>

                                <div className="flex items-center gap-6 md:gap-8 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-center">
                                        <div className="text-xs text-text-muted mb-1">Qty</div>
                                        <div className="font-semibold">{item.quantity}</div>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <div className="text-lg font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 rounded-lg text-danger hover:bg-danger-bg transition-colors"
                                        title="Remove item"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-border-color rounded-2xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-xl font-bold mb-6 text-text-main">Order Summary</h2>

                            <div className="flex justify-between mb-3 text-text-secondary">
                                <span>Subtotal</span>
                                <span className="font-semibold text-text-main">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-3 text-text-secondary">
                                <span>Shipping</span>
                                <span className="text-success font-medium">Free</span>
                            </div>
                            <div className="flex justify-between mb-6 text-text-secondary">
                                <span>Tax</span>
                                <span className="text-text-muted italic">Calculated at checkout</span>
                            </div>

                            <div className="border-t border-border-color pt-6 mt-2 flex justify-between mb-8 items-baseline">
                                <span className="text-lg font-bold text-text-main">Total</span>
                                <span className="text-2xl font-bold text-primary">${cartTotal.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="btn btn-primary w-full py-3.5 text-base rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Checkout <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
