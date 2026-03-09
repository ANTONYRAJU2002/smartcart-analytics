import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Truck, ShieldCheck, Star, MessageSquare, Heart, Check, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [reviewImage, setReviewImage] = useState(null);
    const [showAllSpecs, setShowAllSpecs] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, revRes, relatedRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/reviews`),
                    api.get(`/products/${id}/related`)
                ]);
                setProduct(prodRes.data);

                let initialImage = prodRes.data.image_url;
                if (prodRes.data.specifications?.colors?.length > 0) {
                    setSelectedColor(prodRes.data.specifications.colors[0]);
                    if (prodRes.data.specifications.colors[0].image) {
                        initialImage = prodRes.data.specifications.colors[0].image;
                    }
                }
                if (initialImage) setActiveImage(initialImage);

                setReviews(revRes.data.reviews || revRes.data);
                setRelatedProducts(relatedRes.data);

                // Check wishlist status
                if (user || localStorage.getItem('token')) {
                    try {
                        const wishRes = await api.get('/products/wishlist');
                        const found = wishRes.data.find(item => item.id === parseInt(id));
                        if (found) setIsInWishlist(true);
                    } catch (err) {
                        // console.error("Wishlist check failed", err);
                    }
                }
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('rating', newReview.rating);
            formData.append('comment', newReview.comment);
            if (reviewImage) {
                formData.append('image', reviewImage);
            }
            await api.post(`/products/${id}/reviews`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // Interceptor clears it, letting browser set boundary
            });
            // Refresh reviews
            const res = await api.get(`/products/${id}/reviews`);
            setReviews(res.data.reviews || res.data);
            setNewReview({ rating: 5, comment: '' });
            setReviewImage(null);
            alert('Review submitted!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit review');
        }
    };

    const handleNotifyMe = async () => {
        if (!user) {
            alert('Please login to subscribe to alerts');
            return;
        }
        try {
            await api.post(`/products/${id}/notify`);
            setNotified(true);
            alert('We will notify you when this item is back in stock!');
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to register for notification');
        }
    };

    const handleToggleWishlist = async () => {
        if (!user) {
            alert('Please sign in to add to favorites');
            return;
        }
        try {
            if (isInWishlist) {
                await api.delete(`/products/${id}/wishlist`);
                setIsInWishlist(false);
            } else {
                await api.post(`/products/${id}/wishlist`);
                setIsInWishlist(true);
            }
        } catch (err) {
            console.error("Wishlist operation failed", err);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-text-secondary">Loading...</div>;
    if (!product) return <div className="flex items-center justify-center min-h-screen text-text-secondary">Product not found</div>;

    const allImages = Array.from(new Set([
        product.image_url,
        ...(product.images || []),
        ...(product.specifications?.colors?.map(c => c.image) || [])
    ])).filter(Boolean);

    const handleNextImage = () => {
        const currentIndex = allImages.indexOf(activeImage);
        const nextIndex = (currentIndex + 1) % allImages.length;
        setActiveImage(allImages[nextIndex]);
    };

    const handlePrevImage = () => {
        const currentIndex = allImages.indexOf(activeImage);
        const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        setActiveImage(allImages[prevIndex]);
    };

    return (
        <div className="layout-wrapper pb-12">
            {/* Breadcrumb / Back */}
            <div className="bg-white border-b border-slate-100 py-3 mb-2">
                <div className="container">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Back to Browse
                    </button>
                </div>
            </div>

            <main className="container py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 items-start">
                    {/* Image Section - Sticky */}
                    <div className="lg:sticky lg:top-24 space-y-4">
                        <div
                            onClick={() => setIsZoomed(true)}
                            className="relative bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center h-[200px] group transition-all cursor-zoom-in hover:shadow-md"
                        >
                            {activeImage ? (
                                <>
                                    <img
                                        src={activeImage}
                                        alt={product.name}
                                        className="max-w-full max-h-full object-contain transition-opacity duration-300"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={16} className="text-slate-600" />
                                    </div>

                                    {allImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <span className="text-slate-400">No Image Available</span>
                            )}
                        </div>

                        {/* Horizontal Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`w-14 h-14 rounded-lg border-2 flex-shrink-0 p-1 bg-white overflow-hidden transition-all ${activeImage === img ? 'border-blue-600 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Desktop Only Buttons - Sticky under Gallery */}
                        <div className="hidden lg:flex gap-3 mt-4">
                            <button
                                onClick={() => { addToCart(product); alert('Added to cart'); }}
                                className="flex-1 bg-[#ff9f00] hover:bg-[#f39700] text-white font-bold py-4 rounded shadow flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
                            >
                                <ShoppingCart size={22} /> ADD TO CART
                            </button>
                            <button
                                onClick={() => { navigate('/checkout', { state: { buyNowProduct: product } }); }}
                                className="flex-1 bg-[#fb641b] hover:bg-[#f35b14] text-white font-bold py-4 rounded shadow flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
                            >
                                <Truck size={22} /> BUY NOW
                            </button>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="bg-white p-6 rounded-lg border border-slate-100 h-fit">
                        <nav className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                            Home {' > '} {product.category} {' > '} {product.brand || 'Premium'}
                        </nav>

                        <div className="flex justify-between items-start gap-4 mb-1">
                            <h1 className="text-xl font-medium text-slate-900">
                                {product.name}
                            </h1>
                            <button
                                onClick={handleToggleWishlist}
                                className={`p-2 rounded-full border transition-all ${isInWishlist
                                    ? 'bg-rose-50 border-rose-500'
                                    : 'bg-white border-slate-200 hover:border-rose-200'
                                    }`}
                                title={isInWishlist ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart size={20} fill={isInWishlist ? '#f43f5e' : 'none'} color={isInWishlist ? '#f43f5e' : '#94a3b8'} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1 bg-success text-white px-1.5 py-0.5 rounded text-xs font-bold">
                                4.4 <Star size={12} className="fill-white" />
                            </div>
                            <span className="text-sm font-bold text-slate-400">{reviews.length} Ratings & {reviews.length} Reviews</span>
                            <div className="badge-assured">
                                <span className="text-primary italic font-black">SmartCart</span>
                                <span className="text-fk-yellow font-black">Assured</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div>
                                <span className="text-3xl font-bold text-slate-900">₹{Number(product.price).toLocaleString()}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-slate-400 line-through">₹{Math.floor(product.price * 1.3).toLocaleString()}</span>
                                    <span className="text-sm font-bold text-success">30% off</span>
                                </div>
                            </div>
                        </div>



                        {/* Color Selection */}
                        {product.specifications?.colors?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-900 mb-3">Color: <span className="text-primary font-black ml-1">{selectedColor?.name}</span></h4>
                                <div className="flex gap-3 flex-wrap">
                                    {product.specifications.colors.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setSelectedColor(c);
                                                if (c.image) setActiveImage(c.image);
                                            }}
                                            className={`w-10 h-10 rounded-lg border-2 p-1 overflow-hidden transition-all focus:outline-none ${selectedColor?.name === c.name ? 'border-primary shadow-md shadow-primary/20 scale-110' : 'border-slate-200 hover:border-slate-300'}`}
                                            title={c.name}
                                        >
                                            {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[8px] text-slate-400 text-center leading-tight">No Img</div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}



                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-t border-slate-100">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-bold uppercase mb-1">Warranty</span>
                                <span className="text-sm text-slate-800">{product.warranty || '1 Year Warranty'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-bold uppercase mb-1">Delivery</span>
                                <span className="text-sm text-success font-bold">FREE Delivery by Tomorrow</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900 mb-3">Product Description</h4>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                                {product.description || `Experience the next level of technology with the ${product.name}. Featuring a sleek design and powerful performance, it's crafted to meet the needs of modern users.`}
                            </p>
                        </div>


                    </div>
                </div>

                {/* Specifications Section */}
                <div className="mt-12 bg-white p-8 rounded-lg border border-slate-100">
                    <h2 className="text-xl font-bold mb-6">Specifications</h2>
                    <div className="space-y-6">
                        <div className="overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">General</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 border-b border-slate-50 pb-6">
                                {(() => {
                                    // Extract all non-color specs from the product.specifications object
                                    const dynamicSpecs = Object.entries(product.specifications || {})
                                        .filter(([key]) => key !== 'colors')
                                        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

                                    // Merge with existing general fields
                                    const allSpecs = {
                                        'In The Box': 'Main Unit, User Manual, Warranty Card',
                                        'Model Name': product.name,
                                        ...dynamicSpecs,
                                        'Color': selectedColor ? selectedColor.name : (product.specifications?.colors?.map(c => c.name).join(', ') || 'Standard'),
                                        'Category': product.category,
                                        'Brand': product.brand || 'Premium'
                                    };

                                    const itemsToDisplay = showAllSpecs ? Object.entries(allSpecs) : Object.entries(allSpecs).slice(0, 5);

                                    return (
                                        <>
                                            {itemsToDisplay.map(([key, val]) => (
                                                <div key={key} className="flex flex-col md:flex-row md:col-span-3 border-b border-slate-50 py-3 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded">
                                                    <span className="text-sm text-slate-400 w-64 shrink-0 font-medium">{key}</span>
                                                    <span className="text-sm text-slate-800 font-medium">{val || 'N/A'}</span>
                                                </div>
                                            ))}

                                            {Object.entries(allSpecs).length > 5 && (
                                                <div className="md:col-span-3 pt-2">
                                                    <button
                                                        onClick={() => setShowAllSpecs(!showAllSpecs)}
                                                        className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                                                    >
                                                        {showAllSpecs ? 'Show Less' : `Show All ${Object.entries(allSpecs).length} Specifications`}
                                                        <ChevronRight size={14} className={showAllSpecs ? '-rotate-90' : 'rotate-90'} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="py-12 border-t border-slate-100 mt-12">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/5 rounded-full mb-2 inline-block">
                                    Smart Recommendations
                                </span>
                                <h2 className="text-3xl font-black text-slate-900">Frequently Bought Together</h2>
                            </div>
                            <Link to="/products" className="text-primary font-bold hover:underline flex items-center gap-1 group">
                                Explore More <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {relatedProducts.map(p => (
                                <Link
                                    key={p.id}
                                    to={`/products/${p.id}`}
                                    className="panel group bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all p-2 rounded-xl"
                                >
                                    <div className="aspect-square bg-slate-50 rounded-lg mb-2 overflow-hidden p-3">
                                        <img
                                            src={p.image_url}
                                            alt={p.name}
                                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">{p.category}</div>
                                    <h3 className="font-black text-slate-900 truncate mb-2">{p.name}</h3>
                                    <div className="text-primary font-black">₹{Number(p.price).toLocaleString()}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews Section */}
                <div className="py-8 mt-12">
                    <div className="bg-white border border-border-color rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-8 pb-4 border-b border-border-color">Customer Reviews</h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Review List */}
                            <div className="space-y-6">
                                {reviews.length === 0 ? <p className="text-text-muted italic">No reviews yet. Be the first to review!</p> :
                                    reviews.map(r => (
                                        <div key={r.id} className="bg-bg-main p-6 rounded-xl border border-border-color">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-text-main">{r.username || r.user}</span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} className={i < r.rating ? "fill-warning text-warning" : "text-gray-300"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-text-secondary mb-3 leading-relaxed">"{r.comment}"</p>

                                            {r.image_url && (
                                                <div className="mb-4 mt-2">
                                                    <img src={`http://127.0.0.1:5000${r.image_url}`} alt="Review attached" className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { setActiveImage(`http://127.0.0.1:5000${r.image_url}`); setIsZoomed(true); }} />
                                                </div>
                                            )}

                                            {r.admin_comment && (
                                                <div className="mb-3 mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                                                    <span className="font-bold text-slate-800 flex items-center gap-1 mb-1"><ShieldCheck size={16} className="text-primary" /> Store Response:</span>
                                                    <p className="text-slate-600 italic mt-1">"{r.admin_comment}"</p>
                                                </div>
                                            )}

                                            <span className="text-xs text-text-muted mt-2 block">
                                                {new Date(r.created_at || r.date || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                }
                            </div>

                            {/* Write Review Form */}
                            <div>
                                <div className="bg-bg-main p-6 rounded-2xl border border-border-color sticky top-24">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                        <MessageSquare size={20} className="text-primary" /> Write a Review
                                    </h3>

                                    {!user ? (
                                        <div className="text-center py-8 text-text-secondary">
                                            Please <Link to="/login" className="text-primary font-medium hover:underline">sign in</Link> to write a review.
                                        </div>
                                    ) : !product.can_review ? (
                                        <div className="text-center py-6 text-text-secondary bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                                            <p className="text-sm">Verified Purchase Required</p>
                                            <p className="text-xs text-text-muted mt-1">
                                                You can only review products you have purchased and received.
                                            </p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitReview}>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Rating</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                            className="focus:outline-none transition-transform hover:scale-110"
                                                        >
                                                            <Star
                                                                size={28}
                                                                className={`${star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Review</label>
                                                <textarea
                                                    rows="4"
                                                    value={newReview.comment}
                                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                    placeholder="Share your thoughts..."
                                                    className="form-textarea w-full resize-none border border-slate-200 rounded p-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                    required
                                                ></textarea>
                                            </div>

                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Add a Photo (Optional)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setReviewImage(e.target.files[0])}
                                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>

                                            <button type="submit" className="w-full bg-[#fb641b] hover:bg-[#f35b14] text-white font-bold py-3 rounded shadow transition-transform active:scale-95">
                                                Submit Review
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile/Tablet Sticky Bottom Bar - Only shown on smaller screens */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-50 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => { addToCart(product); alert('Added to cart'); }}
                    className="flex-1 bg-[#ff9f00] text-white font-bold py-3.5 rounded flex items-center justify-center gap-2 text-sm uppercase tracking-tight shadow-sm"
                >
                    <ShoppingCart size={18} /> Add to Cart
                </button>
                <button
                    onClick={() => { navigate('/checkout', { state: { buyNowProduct: product } }); }}
                    className="flex-1 bg-[#fb641b] text-white font-bold py-3.5 rounded flex items-center justify-center gap-2 text-sm uppercase tracking-tight shadow-sm"
                >
                    <Truck size={18} /> Buy Now
                </button>
            </div>

            {/* Image Zoom Lightbox */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
                        onClick={() => setIsZoomed(false)}
                    >
                        <X size={32} />
                    </button>
                    <div className="max-w-7xl max-h-[90vh] flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
                        <img
                            src={activeImage}
                            alt="Full Screen View"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
