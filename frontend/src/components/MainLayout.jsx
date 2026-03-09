import { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LogOut, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const MainLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const { cart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?q=${searchTerm}`);
            setIsMenuOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="layout-wrapper">
            {/* Navigation Bar */}
            <nav className="main-navbar">
                <div className="container nav-container">
                    {/* Logo */}
                    <Link to="/portal" className="nav-brand">
                        <div className="brand-icon">S</div>
                        SmartCart
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="nav-links desktop-only">
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
                        <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>Shop</Link>
                        <Link to="/support" className={`nav-link ${isActive('/support') ? 'active' : ''}`}>Support</Link>
                        <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>Orders</Link>
                    </div>

                    {/* Desktop Actions */}
                    <div className="nav-actions desktop-only">
                        <form onSubmit={handleSearch} className="search-form">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </form>

                        <Link to="/wishlist" className="icon-btn" title="Wishlist">
                            <Heart size={20} />
                        </Link>

                        <Link to="/cart" className="icon-btn" title="Cart">
                            <ShoppingCart size={20} />
                            {cart.length > 0 && (
                                <span className="cart-badge">
                                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="user-menu">
                                <Link to="/profile" className="user-profile-link">
                                    <div className="avatar-small">
                                        <User size={18} />
                                    </div>
                                    <span className="username">{user.username}</span>
                                </Link>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu animate-fade-in">
                        <div className="mobile-menu-content">
                            <form onSubmit={handleSearch} className="mobile-search">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input"
                                />
                            </form>

                            <div className="mobile-links">
                                <Link to="/" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
                                <Link to="/products" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Shop</Link>
                                <Link to="/support" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Support</Link>
                                <Link to="/orders" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Orders</Link>
                                <Link to="/wishlist" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>Wishlist</Link>
                            </div>

                            <div className="mobile-auth">
                                {user ? (
                                    <>
                                        <Link to="/profile" className="sidebar-link" onClick={() => setIsMenuOpen(false)}>
                                            <User size={18} className="mr-2" /> Profile
                                        </Link>
                                    </>
                                ) : (
                                    <Link to="/login" className="btn btn-primary w-full justify-center" onClick={() => setIsMenuOpen(false)}>
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )
                }
            </nav >

            {/* Main Content */}
            < main className="main-content" >
                <Outlet />
            </main >

            {/* Footer */}
            < footer className="site-footer" >
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-section">
                            <div className="footer-brand">
                                <div className="brand-icon">S</div>
                                SmartCart
                            </div>
                            <p className="footer-text">
                                Premium electronics for the modern professional. Experience the future of technology today.
                            </p>
                        </div>

                        <div className="footer-section">
                            <h4>Shop</h4>
                            <ul>
                                <li><Link to="/products">All Hardware</Link></li>
                                <li><Link to="/products?category=Laptops">Laptops</Link></li>
                                <li><Link to="/products?category=Computer Components">Components</Link></li>
                                <li><Link to="/products?category=Monitors">Monitors</Link></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4>Support</h4>
                            <ul>
                                <li><Link to="/support">Help Center</Link></li>
                                <li><Link to="/orders">Order Status</Link></li>
                                <li><Link to="#">Returns</Link></li>
                                <li><Link to="/portal">Staff Portal</Link></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4>Stay Connected</h4>
                            <p className="footer-text-sm">Subscribe for the latest updates.</p>
                            <div className="newsletter-form">
                                <input type="email" placeholder="Email" />
                                <button>Join</button>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        &copy; {new Date().getFullYear()} SmartCart Analytics. All rights reserved.
                    </div>
                </div>
            </footer >
        </div >
    );
};

export default MainLayout;
