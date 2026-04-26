import React, { useState } from 'react';
import { Star, X, Upload, Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';

const ReviewModal = ({ isOpen, onClose, product, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !product) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', comment);
            if (image) {
                formData.append('image', image);
            }

            await api.post(`/products/${product.id}/reviews`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onReviewSubmitted();
            onClose();
        } catch (err) {
            console.error("Submission failed", err);
            setError(err.response?.data?.error || "Failed to submit review. Have you already reviewed this product?");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Review Product</h3>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Share your experience</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Product Info Minimal */}
                    <div className="mb-8 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <img 
                            src={formatImageUrl(product.image_url)} 
                            alt={product.name} 
                            className="w-12 h-12 rounded-lg object-contain bg-white p-1" 
                            onError={handleImageError}
                        />
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Delivered Purchase</p>
                        </div>
                    </div>

                    {/* Rating Section */}
                    <div className="mb-8 text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">How was the product?</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`p-1 transition-transform hover:scale-110 ${
                                        (hover || rating) >= star ? 'text-amber-400' : 'text-slate-200'
                                    }`}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star size={32} fill={(hover || rating) >= star ? 'currentColor' : 'none'} className={ (hover || rating) >= star ? 'drop-shadow-sm' : '' } />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment Area */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Feedback</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[120px]"
                            placeholder="What did you like or dislike? How was the quality?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Photo (Optional)</label>
                        <div className="flex flex-wrap gap-4">
                            {imagePreview ? (
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => { setImage(null); setImagePreview(null); }}
                                        className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                    <Upload size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase mt-2">Add</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
