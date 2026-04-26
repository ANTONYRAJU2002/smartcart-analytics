import { useEffect, useState, useMemo, useContext } from 'react';
import { 
    Plus, Edit2, Trash2, Search, Filter, Package, 
    LayoutGrid, List, ChevronRight, TrendingUp, 
    AlertTriangle, IndianRupee, User, MoreVertical,
    Laptop, Smartphone, Camera, Headphones, Monitor, Settings
} from 'lucide-react';
import ProductForm from './ProductForm';
import CategoryManager from './CategoryManager';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import '../../admin_products.css';

const ProductList = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid'); // 'grid' or 'form'
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    
    // Filters
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSubcategory, setSelectedSubcategory] = useState('All');
    const [priceRange, setPriceRange] = useState('All');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/products/categories')
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                setProducts(products.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to delete product", err);
            }
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setView('form');
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setView('form');
    };

    const handleFormSubmit = () => {
        fetchProducts();
        setView('grid');
    };

    // Stats calculation
    const stats = useMemo(() => {
        const total = products.length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
        const revenue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
        return { total, lowStock, revenue };
    }, [products]);

    // Filtering logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = (p.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
                                (p.category?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false);
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesSubcategory = selectedSubcategory === 'All' || p.sub_category === selectedSubcategory;
            
            let matchesPrice = true;
            if (priceRange === '20k-50k') matchesPrice = p.price >= 20000 && p.price <= 50000;
            else if (priceRange === '50k-1l') matchesPrice = p.price > 50000 && p.price <= 100000;
            else if (priceRange === '1l+') matchesPrice = p.price > 100000;

            return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice;
        });
    }, [products, searchTerm, selectedCategory, selectedSubcategory, priceRange]);

    const subcategories = useMemo(() => {
        if (selectedCategory === 'All') return [];
        const cat = (categories || []).find(c => c.name === selectedCategory);
        return cat ? (cat.subcategories || []) : [];
    }, [selectedCategory, categories]);

    const getCategoryIcon = (name) => {
        switch(name) {
            case 'Laptops': return <Laptop size={18} />;
            case 'Mobiles': return <Smartphone size={18} />;
            case 'Cameras': return <Camera size={18} />;
            case 'Accessories': return <Headphones size={18} />;
            case 'Monitors': return <Monitor size={18} />;
            default: return <Package size={18} />;
        }
    };

    return (
        <>
            <div className="products-premium-container">
                {view === 'form' ? (
                    <div className="max-w-[1200px] mx-auto py-8 px-4">
                        {/* Redesigned Form Header */}
                        <div className="flex justify-between items-center mb-10">
                            <button
                                onClick={() => setView('grid')}
                                className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-600 transition-all">
                                    &larr;
                                </div>
                                Back to Inventory
                            </button>
                            
                            <button 
                                onClick={() => setShowCategoryManager(true)}
                                className="category-btn bg-white border border-slate-200 shadow-sm"
                            >
                                <Settings size={16} /> Manage Categories
                            </button>
                        </div>

                        <div className="animate-fade">
                            <div className="mb-10">
                                <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                                    <span className="text-indigo-600 text-5xl">+</span> {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h1>
                                <p className="text-slate-500 font-medium mt-2">Create a new product by filling in the details below. Fields marked with * are required.</p>
                            </div>

                            <ProductForm
                                product={editingProduct}
                                categories={categories}
                                onUpdateCategories={fetchProducts}
                                onSubmit={handleFormSubmit}
                                onCancel={() => setView('grid')}
                                onManageCategories={() => setShowCategoryManager(true)}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Glass Header */}
                        <header className="glass-header animate-fade">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                         Product Intelligence
                                    </h1>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Management & Catalog Control</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search assets..." 
                                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all w-64"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={handleAdd} className="add-btn">
                                        <Plus size={18} /> Add New Product
                                    </button>
                                </div>
                            </div>

                            {/* Filter Bar */}
                            <div className="top-bar">
                                <div className="filters">
                                    <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('All'); }}>
                                        <option value="All">All Categories</option>
                                        {(categories || []).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    </select>

                                    <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} disabled={selectedCategory === 'All'}>
                                        <option value="All">All Subcategories</option>
                                        {(subcategories || []).map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                                    </select>

                                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                                        <option value="All">Price Range</option>
                                        <option value="20k-50k">₹20K - ₹50K</option>
                                        <option value="50k-1l">₹50K - ₹1L</option>
                                        <option value="1l+">₹1L+</option>
                                    </select>
                                </div>

                                <div className="actions">
                                    <button onClick={() => setShowCategoryManager(true)} className="category-btn">
                                        <Filter size={16} /> Product Category
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* Quick Category Icons */}
                        <div className="category-quick-nav custom-scrollbar animate-fade">
                            <div 
                                className={`cat-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                                onClick={() => { setSelectedCategory('All'); setSelectedSubcategory('All'); }}
                            >
                                <LayoutGrid size={18} />
                                <span>All Inventory</span>
                            </div>
                            {(categories || []).slice(0, 5).map(cat => (
                                <div 
                                    key={cat.id} 
                                    className={`cat-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory('All'); }}
                                >
                                    {getCategoryIcon(cat.name)}
                                    <span>{cat.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Stats Overview */}
                        <div className="stats-row animate-fade" style={{animationDelay: '0.1s'}}>
                            <div className="stat-card-premium">
                                <div className="icon-box bg-indigo-50 text-indigo-600">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="label">Total Products</p>
                                    <p className="value">{stats.total}</p>
                                </div>
                            </div>
                            <div className="stat-card-premium">
                                <div className="icon-box bg-amber-50 text-amber-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <p className="label">Low Stock</p>
                                    <p className="value">{stats.lowStock}</p>
                                </div>
                            </div>
                            <div className="stat-card-premium">
                                <div className="icon-box bg-emerald-50 text-emerald-600">
                                    <IndianRupee size={24} />
                                </div>
                                <div>
                                    <p className="label">Asset Value</p>
                                    <p className="value">₹{(stats.revenue / 100000).toFixed(1)}L</p>
                                </div>
                            </div>
                            <div className="stat-card-premium">
                                <div className="icon-box bg-slate-50 text-slate-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="label">Operator</p>
                                    <p className="value">{user?.username || 'Staff'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data Assets...</p>
                            </div>
                        ) : (
                            <div className="product-grid-premium animate-fade" style={{animationDelay: '0.2s'}}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="product-card-premium">
                                        <div className="pc-image-container">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="pc-image" />
                                            ) : (
                                                <Package size={48} className="text-slate-200" />
                                            )}
                                            <div className="absolute top-4 right-4">
                                                <span className={`badge-pill ${
                                                    product.stock > 10 ? 'badge-in-stock' : 
                                                    product.stock > 0 ? 'badge-low-stock' : 'badge-out-stock'
                                                }`}>
                                                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pc-content">
                                            <h3 className="pc-title">{product.name}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                {product.category} • {product.sub_category}
                                            </p>
                                            <div className="pc-footer">
                                                <p className="pc-price">₹{product.price?.toLocaleString()}</p>
                                                <div className="pc-actions">
                                                    <button onClick={() => handleEdit(product)} className="btn-icon" title="Edit Product">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="btn-icon delete" title="Delete Product">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Stock Count</span>
                                                <span className="text-xs font-bold text-slate-600">{product.stock} Units</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full text-center py-20 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                         <Package size={48} className="text-slate-200 mx-auto mb-4" />
                                         <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching assets found</p>
                                     </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
                {showCategoryManager && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div className="glass-panel p-2 rounded-[2.5rem] border-white/20 shadow-2xl w-full max-w-2xl bg-white/90">
                        <CategoryManager 
                            onClose={() => setShowCategoryManager(false)} 
                            onUpdate={fetchProducts}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductList;
