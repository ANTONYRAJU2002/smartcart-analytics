import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Trash2, ShoppingCart, Heart, Search, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

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
            console.error(err);
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
            console.error(err);
        }
    };

    const moveToCart = async (productId) => {
        const product = wishlist.find(p => p.id === productId);
        if (product) {
            addToCart(product);
            await removeFromWishlist(productId);
            navigate('/cart');
        }
    };

    return (
        <div className="layout-wrapper bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-100 py-16 shadow-sm">
                <div className="container">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Heart className="fill-current" size={24} />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest text-primary">Your Collection</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">My Wishlist</h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            A curated selection of the technology you love. Keep track of your favorites and bring them home.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container py-16">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="panel h-[420px] animate-pulse bg-slate-100" />
                        ))}
                    </div>
                ) : wishlist.length === 0 ? (
                    <div className="panel py-32 flex flex-col items-center justify-center text-center max-w-2xl mx-auto border-dashed border-2">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8 text-slate-300">
                            <Heart size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Your wishlist is empty</h2>
                        <p className="text-slate-500 text-lg mb-10 px-6">
                            Start exploring our premium collection and click the heart icon to save your favorite tech here.
                        </p>
                        <Link
                            to="/products"
                            className="btn btn-primary px-10 py-4 flex items-center gap-2 group"
                        >
                            Explore Collection <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                ) : (
                    <div className="product-list-fk bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {wishlist.map(p => {
                            const discount = Math.floor(Math.random() * 20) + 10;
                            const mrp = Math.floor(p.price / (1 - discount / 100));
                            return (
                                <div key={p.id} className="product-row-fk relative">
                                    {/* Image Column */}
                                    <div className="product-image-col-fk cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                                        <div className="w-12 h-9 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 mx-auto">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <Package size={14} className="text-slate-200" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Info/Specs Column */}
                                    <div className="product-info-col-fk cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                                        <h3 className="product-title-fk group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                        <div className="product-rating-row-fk">
                                            <div className="rating-badge-fk">
                                                4.2 <Star size={10} className="fill-white" />
                                            </div>
                                            <span className="rating-count-fk">
                                                1,205 Ratings & 241 Reviews
                                            </span>
                                        </div>
                                        <ul className="product-specs-fk">
                                            <li><span className="font-semibold text-slate-700">Category:</span> {p.category}</li>
                                        </ul>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFromWishlist(p.id) }}
                                            className="mt-6 flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors w-fit font-medium text-sm"
                                        >
                                            <Trash2 size={16} /> Remove from Wishlist
                                        </button>
                                    </div>

                                    {/* Pricing & Cart Column */}
                                    <div className="product-price-col-fk flex flex-col items-end">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="price-fk">₹{Number(p.price).toLocaleString()}</span>
                                            <div className="badge-assured">
                                                <span className="text-[#2874f0] italic font-black">SmartCart</span>
                                                <span className="text-[#fab600] font-black ml-0.5">Assured</span>
                                            </div>
                                        </div>
                                        <div className="mrp-row-fk">
                                            <span className="mrp-fk">₹{mrp.toLocaleString()}</span>
                                            <span className="discount-fk">{discount}% off</span>
                                        </div>
                                        <p className="free-delivery-fk font-bold mb-4">Free delivery</p>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); moveToCart(p.id); }}
                                            className="bg-[#ff9f00] hover:bg-[#f39700] text-white font-bold py-2.5 px-6 rounded shadow flex items-center gap-2 text-sm uppercase transition-all"
                                        >
                                            <ShoppingCart size={16} /> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
