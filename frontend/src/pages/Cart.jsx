import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, ChevronDown, ChevronUp, Sparkles, Box } from 'lucide-react';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
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

              {/* Grouping logic */}
              {(() => {
                  const grouped = [];
                  const builds = {};

                  cart.forEach(item => {
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

                  return grouped.map((group, gIdx) => {
                      if (group.type === 'single') {
                          const item = group.item;
                          return (
                              <div key={`single-${item.id}-${gIdx}`} className="cart-list-item">
                                  <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.name} />
                                  <div className="cart-info">
                                      <h3>{item.name}</h3>
                                      <p>{item.category} {item.selected_color && `• Color: ${item.selected_color}`}</p>
                                      <div className="cart-bottom">
                                          <div className="cart-qty-controls">
                                              <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selected_color)}>-</button>
                                              <span>{item.quantity}</span>
                                              <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selected_color)}>+</button>
                                          </div>
                                          <h4 className="cart-item-price">{formatCurrency(item.price * item.quantity)}</h4>
                                          <button className="cart-remove-icon" onClick={() => removeFromCart(item.id, item.selected_color)} title="Remove item">
                                              <Trash2 size={20} />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          );
                      } else {
                          const { header, components } = group;
                          if (!header) return null; // Defensive check
                          return <BuildGroupCard key={header.build_id} header={header} components={components} formatCurrency={formatCurrency} removeFromCart={removeFromCart} />;
                      }
                  });
              })()}
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
            
            {/* Mobile-only Sticky Checkout Bar */}
            <div className="mobile-cart-checkout-sticky mobile-only">
                <div className="sticky-price-info">
                    <span className="sticky-price-label">Total Amount</span>
                    <span className="sticky-price-value">{formatCurrency(cartTotal)}</span>
                </div>
                <button className="btn-checkout-sticky" onClick={handleCheckout}>
                    Checkout
                </button>
            </div>

          </div>
        </div>
    );
};

const BuildGroupCard = ({ header, components, formatCurrency, removeFromCart }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const ai = header.build_metadata?.ai;

    return (
        <div className="cart-build-group">
            <div className="cart-list-item build-header-item">
                <div className="build-image-wrapper">
                    <img 
                        src={formatImageUrl(header.image_url)} 
                        alt={header.name} 
                        onError={handleImageError}
                    />
                    <div className="build-badge">Dream PC</div>
                </div>

                <div className="cart-info">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="flex items-center gap-2">
                                {header.name}
                                {ai && <Sparkles size={16} className="text-blue-500" />}
                            </h3>
                            <p className="text-sm font-bold text-slate-500">{components.length} Premium Components</p>
                        </div>
                        <h4 className="cart-item-price">{formatCurrency(header.build_metadata?.total_price || 0)}</h4>
                    </div>

                    {ai && (
                        <div className="cart-ai-mini-badge mt-2">
                            <span className="font-black">{ai.score}</span> / 10 • {ai.text}
                        </div>
                    )}

                    <div className="cart-bottom mt-4">
                        <button 
                            className="flex items-center gap-1 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <><ChevronUp size={16} /> Hide Setup</> : <><ChevronDown size={16} /> View Setup</>}
                        </button>

                        <button className="cart-remove-icon" onClick={() => removeFromCart(header.id, null, header.build_id)} title="Remove entire build">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="build-components-list animate-in slide-in-from-top-2 duration-300">
                    {components.map((comp, idx) => (
                        <div key={idx} className="build-component-row">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded p-1">
                                    <img 
                                        src={formatImageUrl(comp.image_url)} 
                                        alt={comp.name} 
                                        className="w-full h-full object-contain" 
                                        onError={handleImageError}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{comp.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{comp.sub_category || comp.category}</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-600">₹{comp.price?.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Cart;
