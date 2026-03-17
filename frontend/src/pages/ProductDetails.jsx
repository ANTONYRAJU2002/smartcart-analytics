import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useContext(AuthContext);
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(null);
    
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, revRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/reviews`)
                ]);
                setProduct(prodRes.data);

                let initialImage = prodRes.data.image_url;
                if (prodRes.data.specifications?.colors?.length > 0) {
                    if (prodRes.data.specifications.colors[0].image) {
                        initialImage = prodRes.data.specifications.colors[0].image;
                    }
                }
                if (initialImage) setActiveImage(initialImage);

                setReviews(revRes.data.reviews || revRes.data);
            } catch (err) {
                console.error("Failed to load data", err);
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

    return (
        <div className="product-page-wrapper">
            {/* 🧩 PRODUCT SECTION */}
            <section className="product-container">
              {/* LEFT: IMAGE */}
              <div className="product-image">
                <img src={activeImage || product.image_url} alt={product.name} className="main-img" />
                
                {allImages.length > 1 && (
                    <div className="thumbnails">
                      {allImages.map((img, idx) => (
                          <img 
                              key={idx} 
                              src={img} 
                              alt={`Thumbnail ${idx}`} 
                              className={activeImage === img ? 'active-thumb' : ''}
                              onClick={() => setActiveImage(img)}
                          />
                      ))}
                    </div>
                )}
              </div>

              {/* RIGHT: DETAILS */}
              <div className="product-details">
                <h1>{product.name}</h1>
                <p className="rating">⭐⭐⭐⭐☆ ({avgRating})</p>

                <h2 className="price">
                    ${Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} 
                    <span>${(Number(product.price) * 1.25).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </h2>

                <ul className="features">
                  <li>✔ Intel i7 12th Gen</li>
                  <li>✔ RTX 3050 GPU</li>
                  <li>✔ 16GB RAM</li>
                  <li>✔ 165Hz Display</li>
                </ul>

                <div className="buttons">
                  <button className="cart" onClick={() => { addToCart(product, 1); alert('Added to cart'); }}>Add to Cart</button>
                  <button className="buy" onClick={() => { addToCart(product, 1); navigate('/cart'); }}>Buy Now</button>
                </div>
              </div>
            </section>

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
                    {reviews.length === 0 ? <p>No reviews yet. Be the first to review!</p> : (
                        reviews.map(r => (
                            <div key={r.id} className="review-card">
                                <div className="review-header">{r.username || r.user} - {r.rating}/5 Stars</div>
                                <div className="review-body">{r.comment}</div>
                            </div>
                        ))
                    )}
                </section>
            )}
        </div>
    );
};

export default ProductDetails;
