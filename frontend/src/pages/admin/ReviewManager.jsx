import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Star, MessageCircle, Image as ImageIcon, CheckCircle, ShieldCheck } from 'lucide-react';

const ReviewManager = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [adminComment, setAdminComment] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reviews');
            setReviews(res.data.reviews || []);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            // alert('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/reviews/${selectedReview.id}/comment`, { admin_comment: adminComment });
            alert('Comment added successfully!');
            setSelectedReview(null);
            setAdminComment('');
            fetchReviews();
        } catch (error) {
            alert('Failed to add comment');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-slate-500">Loading reviews...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Review Management</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Product</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">User & Rating</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Review</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                    No reviews found.
                                </td>
                            </tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded border border-slate-200 flex items-center justify-center bg-white p-1">
                                                {review.product_image ? (
                                                    <img src={review.product_image} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    <ImageIcon size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 line-clamp-2 max-w-[150px]" title={review.product_name}>{review.product_name}</p>
                                                <span className="text-xs text-slate-500">ID: {review.product_id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="font-medium text-slate-900">{review.username}</p>
                                        <div className="flex mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4 align-top max-w-sm">
                                        <p className="text-sm text-slate-700 line-clamp-3 mb-2">{review.comment}</p>
                                        {review.image_url && (
                                            <a href={review.image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                                                <ImageIcon size={12} /> View Attached Photo
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {review.admin_comment ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                <CheckCircle size={12} /> Replied
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                <MessageCircle size={12} /> Needs Reply
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedReview(review);
                                                setAdminComment(review.admin_comment || '');
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                                        >
                                            {review.admin_comment ? 'Edit Reply' : 'Reply'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reply Modal */}
            {selectedReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                <ShieldCheck size={20} className="text-indigo-600" />
                                Store Reply
                            </h3>
                            <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                &times;
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-slate-800">{selectedReview.username}</span>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} className={i < selectedReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 italic">"{selectedReview.comment}"</p>
                            </div>

                            <form onSubmit={handleCommentSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Public Reply</label>
                                    <textarea
                                        value={adminComment}
                                        onChange={(e) => setAdminComment(e.target.value)}
                                        rows="4"
                                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Type your response... This will be visible to all customers."
                                        required
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedReview(null)}
                                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                    >
                                        Save Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManager;
