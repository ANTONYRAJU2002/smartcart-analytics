import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShoppingCart, ArrowRight, Star, Headphones, Monitor, Watch, Search, Music, Zap, Shield, CheckCircle, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import gamingHero from '../assets/gaming-hero.png';
import laptopHero from '../assets/laptop-hero.png';
import componentsHero from '../assets/components-hero.png';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderRef = useRef(null);
    const imgRefs = useRef([]);

    const slides = [
        {
            title: "Ultimate Gaming Power",
            description: "Experience next-gen performance with RTX GPUs and lightning-fast refresh rates. Unleash your full potential today.",
            buttonText: "Shop Now",
            image: gamingHero
        },
        {
            title: "Premium Laptops",
            description: "Ultra-thin, powerful laptops designed for creative professionals and hardcore gamers. Find your perfect balance of portability and power.",
            buttonText: "Explore",
            image: laptopHero
        },
        {
            title: "Build Your PC",
            description: "Custom components for your dream setup. From high-end GPUs to ultra-fast SSDs, find everything you need to build your masterpiece.",
            buttonText: "Start Build",
            image: componentsHero
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

    // AUTO SLIDER
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // 3D MOUSE EFFECT
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 25;
            const y = (window.innerHeight / 2 - e.pageY) / 25;

            imgRefs.current.forEach(img => {
                if (img) {
                    img.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
                }
            });
        };

        document.addEventListener("mousemove", handleMouseMove);
        return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="home-page home-page-root">
            {/* HERO SLIDER */}
            <section className="hero">
                <div 
                    className="slider" 
                    ref={sliderRef}
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div key={index} className={`slide ${currentSlide === index ? 'active' : ''}`}>
                            {/* LEFT CONTENT */}
                            <div className="hero-text">
                                <h1>{slide.title}</h1>
                                <p>{slide.description}</p>
                                <button className="btn-premium" onClick={() => navigate('/products')}>
                                    {slide.buttonText}
                                </button>
                            </div>

                            {/* RIGHT IMAGE */}
                            <div className="hero-img">
                                <img 
                                    src={slide.image} 
                                    alt={slide.title}
                                    ref={el => imgRefs.current[index] = el}
                                />
                            </div>
                        </div>
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
                                <div key={product.id} className="card" onClick={() => navigate(`/product/${product.id}`)}>
                                    <img src={product.image_url || gamingHero} alt={product.name} />
                                    <h3>{product.name}</h3>
                                    <p>${product.price}</p>
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


