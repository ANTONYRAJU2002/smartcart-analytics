import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShoppingCart, ArrowRight, Star, Headphones, Monitor, Watch, Search, Music, Zap, Shield, CheckCircle, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories] = useState([
        { id: 1, name: 'Laptops', icon: <Monitor size={32} />, count: 'Gaming & Business' },
        { id: 2, name: 'Desktop PCs', icon: <Zap size={32} />, count: 'Performance Rigs' },
        { id: 3, name: 'Computer Components', icon: <Shield size={32} />, count: 'Core Hardare' },
    ]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data);
            } catch (err) {
                console.error("Error fetching products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="home-page">
            {/* New Hero Section V2 */}
            <section className="hero-v2">
                <div className="container hero-v2-content">
                    <div className="hero-v2-text">
                        <h1 className="hero-v2-tagline animate-fade-in">
                            The Ultimate <br />
                            Computing <br />
                            Experience
                        </h1>
                        <p className="hero-v2-description animate-fade-in">
                            Exclusive range of high-performance laptops, custom-built PCs, and pro-grade components. Unleash your potential.
                        </p>

                        <div className="hero-v2-actions animate-fade-in">
                            <Link to="/products" className="btn-hero-blue">
                                Discover More
                            </Link>

                        </div>
                    </div>

                    <div className="hero-v2-image-wrap animate-fade-in">
                        <img
                            src="https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=2070&auto=format&fit=crop"
                            alt="Computing Powerhouse"
                            className="hero-v2-image"
                        />
                    </div>
                </div>
            </section>

            {/* New Features Bar */}
            <div className="features-bar">
                <div className="container">
                    <div className="features-grid">
                        {[
                            { icon: <Monitor size={20} />, title: "High-End Gaming Laptops" },
                            { icon: <Zap size={20} />, title: "Custom Built Desktop PCs" },
                            { icon: <CheckCircle size={20} />, title: "Next-Gen PC Components" },
                            { icon: <Shield size={20} />, title: "Enterprise Grade Networking" }
                        ].map((item, i) => (
                            <div key={i} className="feature-item-v2">
                                <div className="feature-icon-v2">{item.icon}</div>
                                <span>{item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories */}
            <section className="feature-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Computing Segments</span>
                        <h2 className="section-title">Shop by Computing Category</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {categories.map(cat => (
                            <div key={cat.id} className="category-card" onClick={() => navigate(`/products?category=${cat.name}`)}>
                                <div className="category-icon">
                                    {cat.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
                                <p className="text-text-muted">{cat.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="feature-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Community</span>
                        <h2 className="section-title">Loved by Pros</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Alex M.", role: "Producer", text: "The audio clarity is unmatched. Simply the best investment for my studio setup." },
                            { name: "Sarah C.", role: "Designer", text: "Beautiful aesthetics met with powerful performance. I use them every single day." },
                            { name: "James W.", role: "Developer", text: "Fast shipping and amazing build quality. SmartCart has become my go-to tech store." }
                        ].map((t, i) => (
                            <div key={i} className="testimonial-card">
                                <Quote size={40} className="quote-icon" />
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className="fill-warning text-warning" />
                                    ))}
                                </div>
                                <p className="testimonial-text">"{t.text}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar"></div>
                                    <div className="author-info">
                                        <h5>{t.name}</h5>
                                        <span>{t.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="newsletter-section">
                <div className="container newsletter-content">
                    <h2 className="text-3xl font-bold mb-4">Join the Inner Circle</h2>
                    <p className="text-slate-300">
                        Get exclusive access to new releases, limited drops, and member-only pricing.
                    </p>
                    <form className="newsletter-input-group" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Enter your email address" />
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Home;
