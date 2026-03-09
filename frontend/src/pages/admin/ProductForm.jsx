import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Upload, X, UploadCloud, Plus, Trash2, ChevronRight, Settings, Image as ImageIcon, Briefcase, Tag, AlertCircle } from 'lucide-react';

const SPEC_FIELDS = {
    "Laptops": ["CPU", "RAM", "Storage", "GPU", "Display Size", "Battery", "OS"],
    "Desktop PCs": ["Prebuilt", "Gaming", "Office", "Custom Build"],
    "Monitors": ["Screen Size", "Resolution", "Refresh Rate", "Panel Type"],
    "Computer Components": ["Socket", "Capacity", "Speed", "Compatibility"],
    "Computer Accessories": ["Connectivity", "Compatibility", "Weight"]
};

const ProductForm = ({ product, onSubmit, onCancel }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        sub_category: '',
        brand: '',
        model_number: '',
        price: '',
        mrp: '',
        discount: 0,
        cost_price: '',
        stock: '',
        sku: '',
        description: '',
        warranty: '1 Year Manufacturer Warranty',
        return_policy: '7 Days Replacement',
        status: 'active',
        image_url: '',
        image_gallery: [],
        specifications: {},
        variants: [],
        serial_numbers: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/products/categories');
                setCategories(res.data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (product) {
            setFormData({
                ...formData,
                ...product,
                specifications: product.specifications || {},
                variants: product.variants || [],
                image_gallery: product.image_gallery || [],
                serial_numbers: product.serial_numbers || []
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'price' || name === 'mrp') {
                const price = parseFloat(name === 'price' ? value : prev.price) || 0;
                const mrp = parseFloat(name === 'mrp' ? value : prev.mrp) || 0;
                if (mrp > 0) {
                    newData.discount = Math.round(((mrp - price) / mrp) * 100);
                }
            }
            if (name === 'serial_numbers_input') {
                newData.serial_numbers = value.split(',').map(s => s.trim()).filter(s => s !== '');
            }
            return newData;
        });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSpecChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            specifications: { ...prev.specifications, [field]: value }
        }));
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { type: '', value: '', price: prev.price, stock: prev.stock, sku: '', image: '' }]
        }));
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleVariantChange = (index, field, value) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            newVariants[index][field] = value;
            return { ...prev, variants: newVariants };
        });
    };

    const addColor = () => {
        setFormData(prev => {
            const colors = prev.specifications?.colors || [];
            return {
                ...prev,
                specifications: {
                    ...prev.specifications,
                    colors: [...colors, { name: '', image: '' }]
                }
            };
        });
    };

    const removeColor = (index) => {
        setFormData(prev => {
            const colors = [...(prev.specifications?.colors || [])];
            colors.splice(index, 1);
            return {
                ...prev,
                specifications: {
                    ...prev.specifications,
                    colors: colors
                }
            };
        });
    };

    const handleColorChange = (index, field, value) => {
        setFormData(prev => {
            const colors = [...(prev.specifications?.colors || [])];
            if (colors[index]) {
                colors[index][field] = value;
            }
            return {
                ...prev,
                specifications: {
                    ...prev.specifications,
                    colors: colors
                }
            };
        });
    };

    const uploadFiles = async (files, target = 'gallery', targetIndex = null) => {
        if (files.length === 0) return;
        const uploadData = new FormData();
        files.forEach(file => uploadData.append('files[]', file));

        try {
            const res = await api.post('/upload/', uploadData);
            const newUrls = res.data.urls;

            if (target === 'gallery') {
                setFormData(prev => {
                    const updatedGallery = [...prev.image_gallery, ...newUrls];
                    return {
                        ...prev,
                        image_gallery: updatedGallery,
                        image_url: prev.image_url || updatedGallery[0]
                    };
                });
            } else if (target === 'variant' && targetIndex !== null) {
                handleVariantChange(targetIndex, 'image', newUrls[0]);
            } else if (target === 'color' && targetIndex !== null) {
                handleColorChange(targetIndex, 'image', newUrls[0]);
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload images");
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.category) newErrors.category = "Category is required";
        if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
        if (formData.stock < 0) newErrors.stock = "Stock cannot be negative";
        if (formData.image_gallery.length === 0) newErrors.images = "At least one product image is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setActiveTab('general');
            return;
        }

        setIsSubmitting(true);
        try {
            if (product) {
                await api.put(`/products/${product.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            onSubmit();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || "Failed to save product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderGeneralTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group col-span-2">
                    <label className="form-label">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`form-input ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g. ASUS ROG Strix G16" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} className={`form-select ${errors.category ? 'border-red-500' : ''}`} disabled={loadingCategories}>
                        <option value="">{loadingCategories ? 'Loading...' : 'Select Category'}</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Sub-Category</label>
                    <select name="sub_category" value={formData.sub_category} onChange={handleChange} className="form-select" disabled={!formData.category || loadingCategories}>
                        <option value="">Select Sub-Category</option>
                        {formData.category && categories.find(c => c.name === formData.category)?.subcategories?.map(sub => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="form-input" placeholder="e.g. ASUS" />
                </div>

                <div className="form-group">
                    <label className="form-label">Stock Number (Bulk Stock ID)</label>
                    <input type="text" name="model_number" value={formData.model_number} onChange={handleChange} className="form-input" placeholder="e.g. G614JV-AS73 (Same for all 10 items)" />
                    <p className="text-[10px] text-slate-500 mt-1">Identifies the exact version of the product you are adding to stock.</p>
                </div>

                <div className="form-group">
                    <label className="form-label">Selling Price *</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} className={`form-input pl-8 ${errors.price ? 'border-red-500' : ''}`} />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">MRP</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                        <input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="form-input pl-8" />
                        {formData.discount > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">{formData.discount}% OFF</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Stock Quantity *</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} className={`form-input ${errors.stock ? 'border-red-500' : ''}`} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Short Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="form-input resize-none" placeholder="Brief overview of the product..."></textarea>
            </div>
        </div>
    );

    const renderSpecsTab = () => {
        const fields = SPEC_FIELDS[formData.category] || [];
        return (
            <div className="space-y-6">
                {!formData.category ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Please select a category first to see specific fields</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map(field => (
                            <div key={field} className="form-group">
                                <label className="form-label">{field}</label>
                                <input
                                    type="text"
                                    value={formData.specifications[field] || ''}
                                    onChange={(e) => handleSpecChange(field, e.target.value)}
                                    className="form-input"
                                    placeholder={`e.g. ${field === 'CPU' ? 'Intel i9 13th Gen' : field === 'RAM' ? '32GB DDR5' : 'Value'}`}
                                />
                            </div>
                        ))}
                        <div className="form-group">
                            <label className="form-label">Warranty Policy</label>
                            <input type="text" name="warranty" value={formData.warranty} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Return Policy</label>
                            <input type="text" name="return_policy" value={formData.return_policy} onChange={handleChange} className="form-input" />
                        </div>
                    </div>
                )}

                {formData.category && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Color Options</h3>
                                <p className="text-sm text-slate-500">Add available colors and their images</p>
                            </div>
                            <button type="button" onClick={addColor} className="btn btn-secondary flex items-center gap-2">
                                <Plus size={16} /> Add Color
                            </button>
                        </div>

                        {(!formData.specifications?.colors || formData.specifications.colors.length === 0) ? (
                            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500">No colors added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.specifications.colors.map((color, idx) => (
                                    <div key={idx} className="glass-panel p-4 border border-slate-200 relative group">
                                        <button type="button" onClick={() => removeColor(idx)} className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Color Name</label>
                                                <input type="text" value={color.name} onChange={(e) => handleColorChange(idx, 'name', e.target.value)} className="form-input text-sm" placeholder="e.g. Midnight Black" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Color Image</label>
                                                <div className="flex gap-2">
                                                    <div onClick={() => document.getElementById(`c-file-${idx}`).click()} className="flex-1 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden">
                                                        {color.image ? <img src={color.image} className="h-full w-20 object-contain mx-auto" /> : <ImageIcon size={16} className="text-slate-400" />}
                                                        <input id={`c-file-${idx}`} type="file" className="hidden" onChange={(e) => uploadFiles([e.target.files[0]], 'color', idx)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderVariantsTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Product Variants</h3>
                    <p className="text-sm text-slate-500">Add options like RAM, Storage, or Color</p>
                </div>
                <button type="button" onClick={addVariant} className="btn btn-secondary flex items-center gap-2">
                    <Plus size={16} /> Add Variant
                </button>
            </div>

            {formData.variants.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Settings className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No variants added yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {formData.variants.map((variant, idx) => (
                        <div key={idx} className="glass-panel p-4 border border-slate-200 relative group">
                            <button type="button" onClick={() => removeVariant(idx)} className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Type</label>
                                    <input type="text" value={variant.type} onChange={(e) => handleVariantChange(idx, 'type', e.target.value)} className="form-input text-sm" placeholder="e.g. RAM" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Value</label>
                                    <input type="text" value={variant.value} onChange={(e) => handleVariantChange(idx, 'value', e.target.value)} className="form-input text-sm" placeholder="e.g. 16GB" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Price Offset (₹)</label>
                                    <input type="number" value={variant.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} className="form-input text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Image</label>
                                    <div className="flex gap-2">
                                        <div onClick={() => document.getElementById(`v-file-${idx}`).click()} className="flex-1 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden">
                                            {variant.image ? <img src={variant.image} className="h-full w-full object-cover" /> : <ImageIcon size={16} className="text-slate-400" />}
                                            <input id={`v-file-${idx}`} type="file" className="hidden" onChange={(e) => uploadFiles([e.target.files[0]], 'variant', idx)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderMediaTab = () => (
        <div className="space-y-6">
            <div className="form-group">
                <label className="form-label">Upload Product Images *</label>
                <div
                    onClick={() => document.getElementById('mainFileInput').click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50'); }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50'); uploadFiles(Array.from(e.dataTransfer.files)); }}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition-all ${errors.images ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                >
                    <input id="mainFileInput" type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadFiles(Array.from(e.target.files))} />
                    <div className="flex flex-row items-center justify-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                            <UploadCloud size={16} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-700 m-0">Click to upload or drag & drop</p>
                            <p className="text-[10px] text-slate-500 m-0">Auto-sized main/gallery images</p>
                        </div>
                    </div>
                </div>
                {errors.images && <p className="text-red-500 text-xs mt-2 text-center font-bold">{errors.images}</p>}
            </div>

            {formData.image_gallery.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                    {formData.image_gallery.map((img, idx) => (
                        <div key={idx} className={`relative group w-[200px] h-[200px] rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-slate-200'} bg-white`}>
                            <img src={img} className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {idx !== 0 && (
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_url: img, image_gallery: [img, ...prev.image_gallery.filter(i => i !== img)] }))} className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:scale-110 transition-transform">
                                        <Briefcase size={16} />
                                    </button>
                                )}
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_gallery: prev.image_gallery.filter((_, i) => i !== idx), image_url: idx === 0 ? prev.image_gallery[1] || '' : prev.image_url }))} className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:scale-110 transition-transform">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {idx === 0 && <span className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded">Main</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    {[
                        { id: 'general', label: 'General Info', icon: Tag },
                        { id: 'specs', label: 'Specifications', icon: ChevronRight },
                        { id: 'variants', label: 'Variants & Inventory', icon: Settings },
                        { id: 'media', label: 'Product Media', icon: ImageIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                        </button>
                    ))}

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="form-group mb-6">
                            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Publish Status</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setFormData(p => ({ ...p, status: 'active' }))} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formData.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-500 border-slate-200'}`}>Active</button>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, status: 'draft' }))} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formData.status === 'draft' ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-white text-slate-500 border-slate-200'}`}>Draft</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1">
                    <form onSubmit={handleSubmit} className="glass-panel p-8 bg-white border border-slate-200 shadow-2xl shadow-slate-200/50">
                        {activeTab === 'general' && renderGeneralTab()}
                        {activeTab === 'specs' && renderSpecsTab()}
                        {activeTab === 'variants' && renderVariantsTab()}
                        {activeTab === 'media' && renderMediaTab()}

                        <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
                            <button type="button" onClick={onCancel} className="btn-secondary px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="btn-primary px-10 py-2.5 rounded-xl font-black uppercase tracking-wider text-sm shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                                {isSubmitting ? 'Processing...' : (product ? 'Save Changes' : 'Upload Product')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductForm;
