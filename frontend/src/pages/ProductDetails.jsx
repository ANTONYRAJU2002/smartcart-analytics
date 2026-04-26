import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useContext(AuthContext);
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [themeColor, setThemeColor] = useState('#6366f1'); // Default Indigo
    
    const colorMap = {
        'red': '#ef4444',
        'blue': '#3b82f6',
        'black': '#1e293b',
        'white': '#94a3b8',
        'green': '#10b981',
        'yellow': '#eab308',
        'purple': '#8b5cf6',
        'pink': '#ec4899',
        'orange': '#f97316',
        'cyan': '#06b6d4',
        'gray': '#64748b',
        'grey': '#64748b',
        'gold': '#d4af37',
        'silver': '#c0c0c0'
    };
    
    // Review eligibility
    const [canReview, setCanReview] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, revRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/reviews`)
                ]);
                const prodData = prodRes.data;
                setProduct(prodData);
                setReviews(revRes.data.reviews || revRes.data);

                let initialImage = prodData.image_url;
                if (prodData.specifications?.colors?.length > 0) {
                    const firstColor = prodData.specifications.colors[0];
                    setSelectedColor(firstColor.name);
                    if (firstColor.image) {
                        initialImage = firstColor.image;
                    }
                    const cName = firstColor.name.toLowerCase();
                    if (colorMap[cName]) setThemeColor(colorMap[cName]);
                }
                if (initialImage) setActiveImage(initialImage);

                // Fetch related products independently
                api.get(`/analytics/related/${id}`)
                    .then(res => {
                        setRelatedProducts(res.data);
                    })
                    .catch(err => {
                        console.error("Failed to load related products", err);
                        setRelatedProducts([]); 
                    });

            // Check review eligibility
            if (user) {
                api.get(`/products/${id}/check_purchase`)
                    .then(res => {
                        setCanReview(res.data.has_purchased);
                        setAlreadyReviewed(res.data.already_reviewed);
                    })
                    .catch(() => {});
            }

            } catch (err) {
                console.error("Failed to load product data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    if (loading) return <div style={{padding: '40px'}}>Loading...</div>;
    if (!product) return <div style={{padding: '40px'}}>Product not found</div>;

    const allImages = Array.from(new Set([
        product.image_url,
        ...(product.images || []),
        ...(product.specifications?.colors?.map(c => c.image) || [])
    ])).filter(Boolean);

    // Mock average rating for exact UI matching
    const avgRating = "4.5"; 

    const handleColorSelect = (color) => {
        setSelectedColor(color.name);
        if (color.image) setActiveImage(color.image);
        
        const cName = color.name.toLowerCase();
        if (colorMap[cName]) {
            setThemeColor(colorMap[cName]);
        } else {
            setThemeColor('#6366f1'); // Fallback to default
        }
    };

    return (
        <div className="product-page-wrapper" style={{ '--theme-color': themeColor, '--theme-color-light': `${themeColor}15` }}>
            {/* 🧩 PRODUCT SECTION */}
            <section className="product-container">
              {/* LEFT: IMAGE */}
              <div className="product-image">
                <img 
                    src={formatImageUrl(activeImage || product.image_url)} 
                    alt={product.name} 
                    className="main-img" 
                    onError={handleImageError}
                />
                
                {allImages.length > 1 && (
                    <div className="thumbnails">
                      {allImages.map((img, idx) => (
                          <img 
                              key={idx} 
                              src={formatImageUrl(img)} 
                              alt={`Thumbnail ${idx}`} 
                              className={activeImage === img ? 'active-thumb' : ''}
                              onClick={() => setActiveImage(img)}
                              onError={handleImageError}
                          />
                      ))}
                    </div>
                )}
              </div>

              {/* RIGHT: DETAILS */}
              <div className="product-details">
                <div className="brand-tag">{product.brand || 'Premium'}</div>
                <h1>{product.name}</h1>
                {/* <p className="rating">⭐⭐⭐⭐☆ ({avgRating})</p> */}

                <h2 className="price">
                    ₹{(product.price || 0).toLocaleString('en-IN')} 
                    <span className="mrp">₹{(product.mrp || (product.price || 0) * 1.25).toLocaleString('en-IN')}</span>
                    <span className="discount-tag">{product.discount || 20}% OFF</span>
                </h2>

                {/* Color Selector */}
                {product.specifications?.colors?.length > 0 && (
                    <div className="variant-selector">
                        <label className="variant-label">Select Color: <span className="selected-variant-name">{selectedColor}</span></label>
                        <div className="color-options">
                            {product.specifications.colors.map((color, idx) => (
                                <div 
                                    key={idx} 
                                    className={`color-option ${selectedColor === color.name ? 'active' : ''}`}
                                    title={color.name}
                                    onClick={() => handleColorSelect(color)}
                                >
                                    {color.image ? (
                                        <img 
                                            src={formatImageUrl(color.image)} 
                                            alt={color.name} 
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <div className="color-circle" style={{ backgroundColor: color.name.toLowerCase() }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ul className="features">
                  {Object.entries(product.specifications || {})
                    .filter(([k]) => k !== 'colors')
                    .slice(0, 4)
                    .map(([k, v]) => (
                        <li key={k}>✔ {k}: {Array.isArray(v) ? v.join('/') : v}</li>
                    ))}
                  {(!product.specifications || Object.keys(product.specifications).filter(k => k !== 'colors').length === 0) && (
                      <>
                        <li>✔ Premium Quality Audio</li>
                        <li>✔ Comfortable Ergonomic Design</li>
                        <li>✔ Universal Compatibility</li>
                        <li>✔ Manufacturer Warranty</li>
                      </>
                  )}
                </ul>

                <div className="buttons">
                  <button className="cart" onClick={() => { addToCart(product, 1, selectedColor); alert(`${product.name} (${selectedColor || 'Standard'}) added to cart`); }}>Add to Cart</button>
                  <button className="buy" onClick={() => { addToCart(product, 1, selectedColor); navigate('/cart'); }}>Buy Now</button>
                </div>
              </div>
            </section>
            
            {/* 🔗 RELATED PRODUCTS (AI RECOMMENDED) */}
            {relatedProducts.length > 0 && (
                <section className="related-section">
                    <h3 className="section-title">Frequently Bought Together</h3>
                    <div className="related-grid">
                        {relatedProducts.map(p => (
                            <div key={p.id} className="related-card" onClick={() => navigate(`/products/${p.id}`)}>
                                <div className="related-img-box">
                                    <img 
                                        src={formatImageUrl(p.image_url)} 
                                        alt={p.name} 
                                        onError={handleImageError}
                                    />
                                </div>
                                <h4>{p.name}</h4>
                                <div className="related-footer">
                                    <span className="price">₹{p.price.toLocaleString()}</span>
                                    <button className="add-btn" onClick={(e) => { 
                                        e.stopPropagation(); 
                                        addToCart(p, 1); 
                                        alert(`${p.name} added to cart!`);
                                    }}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 📋 TABS */}
            <section className="tabs">
              <button 
                  className={activeTab === 'description' ? 'active' : ''} 
                  onClick={() => setActiveTab('description')}
              >
                  Description
              </button>
              <button 
                  className={activeTab === 'specifications' ? 'active' : ''} 
                  onClick={() => setActiveTab('specifications')}
              >
                  Specifications
              </button>
              <button 
                  className={activeTab === 'reviews' ? 'active' : ''} 
                  onClick={() => setActiveTab('reviews')}
              >
                  Reviews
              </button>
            </section>

            {/* 📊 SPECIFICATIONS */}
            {activeTab === 'specifications' && (
                <section className="specs">
                  <div>Processor <span>{product.specifications?.Processor || 'i7 12th Gen'}</span></div>
                  <div>RAM <span>16GB</span></div>
                  <div>Storage <span>{product.specifications?.Storage || '512GB SSD'}</span></div>
                  <div>GPU <span>RTX 3050</span></div>
                  <div>Display <span>{product.specifications?.Display || '165Hz'}</span></div>
                </section>
            )}

            {activeTab === 'description' && (
                <section className="tab-content-panel">
                    <p>{product.description || 'Experience the next level of computing...'}</p>
                </section>
            )}

            {activeTab === 'reviews' && (
                <section className="tab-content-panel">
                    <div className="review-action-bar">
                        <h3 className="section-title">Customer Feedback</h3>
                        {canReview && !alreadyReviewed && (
                            <button 
                                className="order-btn success review-trigger-btn"
                                onClick={() => navigate('/orders')}
                            >
                                ★ Write a Review
                            </button>
                        )}
                        {alreadyReviewed && (
                            <span className="review-status-tag">Review Submitted</span>
                        )}
                    </div>
                    {reviews.length === 0 ? <p>No reviews yet. Be the first to review!</p> : (
                        reviews.map(r => (
                            <div key={r.id} className="review-card">
                                <div className="review-header">{r.username || r.user} - {r.rating}/5 Stars</div>
                                <div className="review-body">
                                    {r.comment}
                                    {r.image_url && (
                                        <div className="review-image-wrapper mt-4">
                                            <img 
                                                src={formatImageUrl(r.image_url)} 
                                                alt="Review" 
                                                className="review-image"
                                                onClick={() => window.open(formatImageUrl(r.image_url), '_blank')}
                                                onError={handleImageError}
                                            />
                                        </div>
                                    )}
                                </div>
                                {r.admin_comment && (
                                    <div className="admin-reply">
                                        <strong>SmartCart Reply:</strong> {r.admin_comment}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </section>
            )}
        </div>
    );
};

export default ProductDetails;
