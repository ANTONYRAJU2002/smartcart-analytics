import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2 } from 'lucide-react';
import './Cart.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (cart.length === 0) {
        return (
            <div className="cart-wrapper">
                <div className="cart-main-container" style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="cart-section" style={{ textAlign: 'center', padding: '60px 20px', width: '100%', maxWidth: '600px' }}>
                      <h2>Your cart is empty</h2>
                      <p style={{ color: 'gray', marginBottom: '20px' }}>Looks like you haven't added anything yet.</p>
                      <button 
                          className="btn-checkout-action" 
                          onClick={() => navigate('/products')}
                          style={{ width: 'auto', padding: '10px 20px' }}
                      >
                          Start Shopping
                      </button>
                  </div>
                </div>
            </div>
        );
    }

    const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

    return (
        <div className="cart-wrapper">
          {/* 🧩 MAIN */}
          <div className="cart-main-container">

            {/* 🛒 LEFT: CART */}
            <div className="cart-section">
              <h2>Cart</h2>

              {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="cart-list-item">
                    <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.name} />

                    <div className="cart-info">
                      <h3>{item.name}</h3>
                      <p>{item.category}</p>

                      <div className="cart-bottom">
                        <div className="cart-qty-controls">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>

                        <h4 className="cart-item-price">{formatCurrency(item.price * item.quantity)}</h4>
                        
                        <button className="cart-remove-icon" onClick={() => removeFromCart(item.id)} title="Remove item">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            {/* 💳 RIGHT: SUMMARY */}
            <div className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-row-item">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>

              <div className="summary-row-item">
                <span>Shipping</span>
                <span className="summary-free">Free</span>
              </div>

              <div className="summary-row-item">
                <span>Tax</span>
                <span>₹0</span>
              </div>

              <hr />

              <div className="summary-total">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>

              <button className="btn-checkout-action" onClick={handleCheckout}>
                Checkout →
              </button>
            </div>

          </div>
        </div>
    );
};

export default Cart;
