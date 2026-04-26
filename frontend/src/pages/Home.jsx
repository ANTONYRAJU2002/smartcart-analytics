import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShoppingCart, ArrowRight, Star, Headphones, Monitor, Watch, Search, Music, Zap, Shield, CheckCircle, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import gamingHero from '../assets/hero-gaming.jpg';
import internalsHero from '../assets/hero-internals.jpg';
import laptopHero from '../assets/hero-laptop.jpg';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Ultimate Gaming Power",
            description: "Experience next-gen performance with RTX GPUs and lightning-fast refresh rates. Unleash your full potential today.",
            buttonText: "Shop Now",
            image: gamingHero
        },
        {
            title: "Engineered for Speed",
            description: "Built with premium components for maximum reliability and peak performance. The heart of your next-gen setup.",
            buttonText: "Explore Parts",
            image: internalsHero
        },
        {
            title: "Performance on the Go",
            description: "Power meets portability in our refined laptop lineup. Modern aesthetics with professional-grade capabilities.",
            buttonText: "View Range",
            image: laptopHero
        }
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data.slice(0, 3)); // Only show top 3 for the grid
            } catch (err) {
                console.error("Error fetching products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // AUTO SLIDER & SWIPE LOGIC
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // Increased interval for better UX
        return () => clearInterval(interval);
    }, [slides.length]);

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        if (isLeftSwipe) {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        } else if (isRightSwipe) {
            setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        }
    };

    return (
        <div className="home-page home-page-root">
            {/* HERO SLIDER */}
            <section 
                className="hero"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div 
                    className="slider" 
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div key={index} className={`slide ${currentSlide === index ? 'active' : ''}`}>
                            {/* GRADIENT OVERLAY FOR BLENDING */}
                            <div className="hero-overlay"></div>
                            
                            {/* LEFT CONTENT */}
                            <div className="hero-text">
                                <h1>{slide.title}</h1>
                                <p>{slide.description}</p>
                                <div className="hero-actions">
                                    <button className="btn-premium" onClick={() => navigate(slide.path || '/products')}>
                                        {slide.buttonText}
                                        <ArrowRight className="btn-icon" size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT IMAGE */}
                            <div className="hero-img">
                                <div className="img-glow"></div>
                                <img 
                                    src={slide.image} 
                                    alt={slide.title}
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* SLIDER DOTS */}
                <div className="slider-dots">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            className={`dot ${currentSlide === i ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(i)}
                        ></div>
                    ))}
                </div>
            </section>

            {/* PRODUCTS */}
            <section className="products">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Featured hardware</span>
                        <h2 className="section-title">Popular Products</h2>
                    </div>
                    
                    <div className="product-grid">
                        {loading ? (
                            <p>Loading products...</p>
                        ) : (
                            products.map(product => (
                                <div key={product.id} className="card" onClick={() => navigate(`/products/${product.id}`)}>
                                    <img 
                                        src={formatImageUrl(product.image_url)} 
                                        alt={product.name} 
                                        onError={handleImageError}
                                    />
                                    <h3>{product.name}</h3>
                                    <p>₹{(product.price || 0).toLocaleString('en-IN')}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="newsletter-section">
                <div className="container newsletter-content">
                    <h2 className="text-3xl font-bold mb-4 text-slate-900">Join the Inner Circle</h2>
                    <p className="text-slate-600">
                        Get exclusive access to new releases, limited drops, and member-only pricing.
                    </p>
                    <form className="newsletter-input-group" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Enter your email address" className="newsletter-input" />
                        <button type="submit" className="subscribe-btn">Subscribe</button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Home;


