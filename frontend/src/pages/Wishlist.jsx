import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Package, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
import './Wishlist.css';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products/wishlist');
            setWishlist(res.data);
        } catch (err) {
            console.error("Failed to load wishlist", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const removeFromWishlist = async (productId) => {
        try {
            await api.delete(`/products/${productId}/wishlist`);
            fetchWishlist(); // Refresh
        } catch (err) {
            console.error("Failed to remove product from wishlist", err);
        }
    };

    const moveToCart = async (productId) => {
        const product = wishlist.find(p => p.id === productId);
        if (product) {
            addToCart(product, 1);
            await removeFromWishlist(productId);
            navigate('/cart');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    if (loading) return (
        <div className="layout-wrapper bg-slate-50 min-h-screen flex items-center justify-center">
            <div className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse flex flex-col items-center gap-4">
                <Heart size={32} className="text-slate-300" />
                Loading Wishlist...
            </div>
        </div>
    );

    return (
        <div className="layout-wrapper bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 shadow-sm mb-10">
                <div className="container max-w-6xl mx-auto px-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                            <Heart size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">My Wishlist</h1>
                            <p className="text-sm md:text-base font-medium text-slate-500 mt-1">A curated selection of the technology you love.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container max-w-6xl mx-auto px-4">
                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                            <Heart size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">Your wishlist is empty</h2>
                        <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                            Start exploring our premium collection and save your favorite tech here.
                        </p>
                        <button
                            onClick={() => window.location.href = '/products'}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <ShoppingBag size={20} /> Explore Collection
                        </button>
                    </div>
                ) : (
                    <div className="order-page">
                        <h1 className="order-title">My Wishlist</h1>
                        <p className="order-subtitle">Manage and track your saved items.</p>

                        {wishlist.map(product => (
                            <div key={product.id} className="order-card wishlist-card" onClick={() => navigate(`/products/${product.id}`)}>
                                
                                {/* Product Image */}
                                <div className="order-image">
                                    {product.image_url ? (
                                        <img 
                                            src={formatImageUrl(product.image_url)} 
                                            alt={product.name} 
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                            <Package className="text-slate-300" size={32} />
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="order-details">
                                    <h3>{product.name}</h3>
                                    <p>Category: {product.category}</p>
                                    <p>Saved to Wishlist</p>
                                </div>

                                {/* Price */}
                                <div className="order-price">
                                    {formatCurrency(product.price)}
                                </div>

                                {/* Actions */}
                                <div className="order-actions" onClick={e => e.stopPropagation()}>
                                    <div className="buttons">
                                        <button 
                                            className="view" 
                                            onClick={(e) => { e.stopPropagation(); moveToCart(product.id); }}
                                            style={{ marginRight: '8px' }}
                                        >
                                            Add to Cart
                                        </button>
                                        <button 
                                            className="cancel"
                                            onClick={(e) => { e.stopPropagation(); removeFromWishlist(product.id); }}
                                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
