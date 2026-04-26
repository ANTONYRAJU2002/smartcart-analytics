import { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const CategoryManager = ({ onClose, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [newSubCategory, setNewSubCategory] = useState({ categoryId: null, name: '' });
    const [loading, setLoading] = useState(true);
    const [expandedCats, setExpandedCats] = useState({});

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories');
            setCategories(res.data);
        } catch (err) {
            console.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleExpand = (catId) => {
        setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) {
            return;
        }
        try {
            await api.post('/products/categories', { name: newCategory });
            setNewCategory('');
            fetchCategories();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to add category:", err);
            alert(err.response?.data?.msg || "Failed to add category");
        }
    };

    const handleAddSubCategory = async (catId) => {
        if (!newSubCategory.name.trim()) {
            return;
        }
        try {
            await api.post(`/products/categories/${catId}/subcategories`, { name: newSubCategory.name });
            setNewSubCategory({ categoryId: null, name: '' });
            fetchCategories();
            setExpandedCats(prev => ({ ...prev, [catId]: true }));
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to add subcategory:", err);
            alert(err.response?.data?.msg || "Failed to add subcategory");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category? All subcategories will also be deleted.")) return;
        try {
            await api.delete(`/products/categories/${id}`);
            fetchCategories();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(err.response?.data?.msg || "Failed to delete category");
        }
    };

    const handleDeleteSubCategory = async (id) => {
        if (!window.confirm("Delete this subcategory?")) return;
        try {
            await api.delete(`/products/subcategories/${id}`);
            fetchCategories();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(err.response?.data?.msg || "Failed to delete subcategory");
        }
    };

    return (
        <div className="glass-panel w-full max-w-lg p-6 bg-white rounded-[2.5rem] shadow-2xl relative animate-slide-up mx-4 max-h-[90vh] flex flex-col border border-white/20">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
                <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-800 mb-6">Manage Product Structure</h2>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-input flex-1"
                    placeholder="New primary category..."
                />
                <button type="submit" className="btn-premium btn-premium-publish px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-100">
                    <Plus size={18} /> Category
                </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <p className="text-slate-500 text-center py-4">Loading structure...</p>
                ) : categories.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No categories found.</p>
                ) : (
                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="border border-slate-100 rounded-lg overflow-hidden transition-all hover:border-slate-200">
                                <div className="flex items-center justify-between p-3 bg-slate-50">
                                    <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleExpand(cat.id)}>
                                        {expandedCats[cat.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                        <span className="text-slate-700 font-bold">{cat.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                            {cat.subcategories?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setNewSubCategory({ categoryId: cat.id, name: '' })}
                                            className="p-1.5 text-indigo-600 hover:bg-white rounded transition-colors"
                                            title="Add Subcategory"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {newSubCategory.categoryId === cat.id && (
                                    <div className="p-2 border-t border-slate-100 bg-white flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newSubCategory.name}
                                            onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(cat.id)}
                                            className="form-input text-sm py-1"
                                            placeholder="Subcategory name..."
                                        />
                                        <button onClick={() => handleAddSubCategory(cat.id)} className="btn-primary text-[10px] px-3 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm">Add</button>
                                        <button onClick={() => setNewSubCategory({ categoryId: null, name: '' })} className="text-slate-400 text-xs px-2 hover:text-slate-600">Cancel</button>
                                    </div>
                                )}

                                {expandedCats[cat.id] && (
                                    <div className="bg-white border-t border-slate-50">
                                        {cat.subcategories?.length === 0 ? (
                                            <p className="text-[10px] text-slate-400 italic p-3 text-center">No subcategories yet</p>
                                        ) : (
                                            <ul className="divide-y divide-slate-50">
                                                {cat.subcategories.map(sub => (
                                                    <li key={sub.id} className="flex justify-between items-center py-2 px-8 group hover:bg-slate-50 transition-colors">
                                                        <span className="text-sm text-slate-600">{sub.name}</span>
                                                        <button
                                                            onClick={() => handleDeleteSubCategory(sub.id)}
                                                            className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;
