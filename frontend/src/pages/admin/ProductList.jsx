import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import ProductForm from './ProductForm';
import CategoryManager from './CategoryManager';
import api from '../../services/api';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error("Failed to fetch products", err);
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
        setView('list');
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (view === 'form') {
        return (
            <div className="container max-w-4xl">
                <button
                    onClick={() => setView('list')}
                    className="mb-4 text-sm text-slate-500 hover:text-indigo-600 flex items-center"
                >
                    &larr; Back to Products
                </button>
                <div className="panel">
                    <h2 className="text-xl font-bold mb-6 border-b border-slate-100 pb-4">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <ProductForm
                        product={editingProduct}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setView('list')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Products</h1>
                    <p className="text-slate-500 text-sm">Manage your product catalog</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowCategoryManager(true)}
                    >
                        Manage Categories
                    </button>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            {showCategoryManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <CategoryManager onClose={() => setShowCategoryManager(false)} />
                </div>
            )}

            <div className="panel p-0 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="form-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Placeholder for filter - could be a dropdown */}
                    <button className="btn btn-secondary px-3">
                        <Filter size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading products...</div>
                ) : (
                    <div className="table-container border-0 shadow-none rounded-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="font-medium">
                                            <div className="flex items-center gap-3">
                                                {product.image_url ? (
                                                    <div className="w-12 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-0.5 shadow-sm shrink-0">
                                                        <img src={product.image_url} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm shrink-0">
                                                        <Package size={14} />
                                                    </div>
                                                )}
                                                {product.name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td>₹{product.price}</td>
                                        <td>
                                            <span className={`badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                                {product.stock} in stock
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-slate-500">
                                            No products found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductList;
