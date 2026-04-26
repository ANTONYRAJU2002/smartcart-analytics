import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Upload, X, UploadCloud, Plus, Trash2, ChevronRight, Settings, Image as ImageIcon, Briefcase, Tag, AlertCircle, IndianRupee, Package, CheckCircle2 } from 'lucide-react';

const SPEC_FIELDS = {
    "Laptops": ["CPU", "RAM", "Storage", "GPU", "Display Size", "Battery", "OS"],
    "Desktop PCs": ["Prebuilt", "Gaming", "Office", "Custom Build"],
    "Monitors": ["Screen Size", "Resolution", "Refresh Rate", "Panel Type"],
    "Computer Components": ["Socket", "Capacity", "Speed", "Compatibility"],
    "Computer Accessories": ["Connectivity", "Compatibility", "Weight"]
};

const ProductForm = ({ product, categories, onSubmit, onCancel, onManageCategories }) => {
    const [activeTab, setActiveTab] = useState('General Info');
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
    useEffect(() => {
        if (product) {
            setFormData(prev => {
                const gallery = product.image_gallery || [];
                const mainImage = product.image_url;
                // If gallery is empty but main image exists, populate it for the form
                const initialGallery = (gallery.length === 0 && mainImage) ? [mainImage] : gallery;
                
                return {
                    ...prev,
                    ...product,
                    specifications: product.specifications || {},
                    variants: product.variants || [],
                    image_gallery: initialGallery,
                    serial_numbers: product.serial_numbers || []
                };
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

    const handleSpecKeyChange = (oldKey, newKey) => {
        if (oldKey === newKey) return;
        setFormData(prev => {
            const newSpecs = { ...prev.specifications };
            const value = newSpecs[oldKey] || '';
            delete newSpecs[oldKey];
            newSpecs[newKey] = value;
            return { ...prev, specifications: newSpecs };
        });
    };

    const removeSpec = (field) => {
        setFormData(prev => {
            const newSpecs = { ...prev.specifications };
            delete newSpecs[field];
            return { ...prev, specifications: newSpecs };
        });
    };

    const addCustomSpec = () => {
        const newKey = `New Specification ${Object.keys(formData.specifications).filter(k => k !== 'colors').length + 1}`;
        handleSpecChange(newKey, '');
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...(prev.variants || []), { type: '', value: '', price: prev.price, stock: prev.stock, sku: '', image: '' }]
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
                    const updatedGallery = [...(prev.image_gallery || []), ...newUrls];
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
        if ((!formData.image_gallery || formData.image_gallery.length === 0) && !formData.image_url) {
            newErrors.images = "At least one product image is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!validateForm()) {
            setActiveTab('General Info');
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
        <div className="animate-fade">
            <div className="form-grid-3">
                {/* Basic Information Card */}
                <div className="form-card-premium">
                    <h3>
                        <div className="icon-box bg-blue-50 text-blue-600">
                             <Tag size={18} />
                        </div>
                        Basic Information
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label-premium">Product Name *</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                className={`form-input-premium ${errors.name ? 'border-red-500' : ''}`} 
                                placeholder="e.g. ASUS ROG Strix G16" 
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name}</p>}
                        </div>

                        {errors.images && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                                <div className="p-1.5 bg-red-600 text-white rounded-lg">
                                    <AlertCircle size={14} />
                                </div>
                                <p className="text-[10px] font-bold text-red-900 leading-tight">
                                    {errors.images} - <span className="text-red-600 cursor-pointer underline" onClick={() => setActiveTab('Media')}>Go to Media Tab</span>
                                </p>
                            </div>
                        )}

                        <div className="form-group">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="form-label-premium !mb-0">Category *</label>
                                <button 
                                    type="button" 
                                    onClick={onManageCategories}
                                    className="category-btn category-btn-compact !py-1 !px-3 font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <Plus size={12} /> Manage
                                </button>
                            </div>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className={`form-input-premium form-select-premium ${errors.category ? 'border-red-500' : ''}`}
                            >
                                <option value="">Select Category</option>
                                {(categories || []).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label-premium">Sub-Category</label>
                            <select 
                                name="sub_category" 
                                value={formData.sub_category} 
                                onChange={handleChange} 
                                className="form-input-premium form-select-premium"
                                disabled={!formData.category}
                            >
                                <option value="">Select Sub-Category</option>
                                {formData.category && (categories || []).find(c => c.name === formData.category)?.subcategories?.map(sub => (
                                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label-premium">Brand</label>
                            <input 
                                type="text" 
                                name="brand" 
                                value={formData.brand} 
                                onChange={handleChange} 
                                className="form-input-premium" 
                                placeholder="e.g. ASUS, Apple, Samsung" 
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="form-card-premium">
                    <h3>
                        <div className="icon-box bg-purple-50 text-purple-600">
                             <IndianRupee size={18} />
                        </div>
                        Pricing
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label-premium">Selling Price *</label>
                            <div className="price-input-wrapper">
                                <span className="price-currency">₹</span>
                                <input 
                                    type="number" 
                                    name="price" 
                                    value={formData.price} 
                                    onChange={handleChange} 
                                    className={`form-input-premium ${errors.price ? 'border-red-500' : ''}`}
                                    placeholder="Enter selling price"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label-premium">MRP</label>
                            <div className="price-input-wrapper">
                                <span className="price-currency">₹</span>
                                <input 
                                    type="number" 
                                    name="mrp" 
                                    value={formData.mrp} 
                                    onChange={handleChange} 
                                    className="form-input-premium"
                                    placeholder="Enter MRP"
                                />
                            </div>
                        </div>

                        {formData.mrp > 0 && formData.price > 0 && (
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                                    <AlertCircle size={14} />
                                </div>
                                <p className="text-[10px] font-bold text-indigo-900 leading-tight">
                                    MRP helps show savings of <span className="text-indigo-600">₹{(formData.mrp - formData.price).toLocaleString()} ({formData.discount}%)</span> to customers
                                </p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Inventory Card */}
                <div className="form-card-premium">
                    <h3>
                        <div className="icon-box bg-amber-50 text-amber-600">
                             <Package size={18} />
                        </div>
                        Inventory
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label-premium">Model Number / SKU</label>
                            <input 
                                type="text" 
                                name="model_number" 
                                value={formData.model_number} 
                                onChange={handleChange} 
                                className="form-input-premium" 
                                placeholder="e.g. G614L-AS373" 
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label-premium">Stock Quantity</label>
                            <input 
                                type="number" 
                                name="stock" 
                                value={formData.stock} 
                                onChange={handleChange} 
                                className={`form-input-premium ${errors.stock ? 'border-red-500' : ''}`}
                                placeholder="Enter quantity in stock"
                            />
                        </div>
                    </div>
                </div>

                {/* Description - Full Width */}
                <div className="col-span-1 md:col-span-3">
                    <div className="form-card-premium">
                        <h3>
                            <div className="icon-box bg-slate-50 text-slate-600">
                                <Briefcase size={18} />
                            </div>
                            Description
                        </h3>
                        <div className="form-group">
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows="4" 
                                className="form-input-premium resize-none" 
                                placeholder="Enter product description..."
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSpecsTab = () => {
        const fields = SPEC_FIELDS[formData.category] || [];
        return (
            <div className="animate-fade space-y-8">
                <div className="form-card-premium">
                    <h3>
                        <div className="icon-box bg-slate-50 text-slate-600">
                             <ChevronRight size={18} />
                        </div>
                        Technical Specifications
                    </h3>
                    
                    {!formData.category ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium text-sm">Please select a category first</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map(field => (
                                <div key={field} className="form-group">
                                    <label className="form-label-premium">{field}</label>
                                    <input
                                        type="text"
                                        value={formData.specifications[field] || ''}
                                        onChange={(e) => handleSpecChange(field, e.target.value)}
                                        className="form-input-premium"
                                        placeholder={`Enter ${field}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {formData.category && (
                    <div className="form-card-premium">
                        <div className="flex justify-between items-center mb-6">
                            <h3>
                                <div className="icon-box bg-slate-50 text-slate-600">
                                     <Plus size={18} />
                                </div>
                                Additional Specifications
                            </h3>
                            <button type="button" onClick={addCustomSpec} className="btn-premium btn-premium-draft flex items-center gap-2 py-2 text-xs">
                                <Plus size={14} /> Add Specification
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {Object.keys(formData.specifications)
                                .filter(k => !fields.includes(k) && k !== 'colors')
                                .map((key) => (
                                    <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => removeSpec(key)} 
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-white text-red-500 rounded-full flex items-center justify-center border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <X size={12} />
                                        </button>
                                        <div className="form-group">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Spec Name</label>
                                            <input
                                                type="text"
                                                value={key}
                                                onChange={(e) => handleSpecKeyChange(key, e.target.value)}
                                                className="form-input-premium !bg-white !py-2 !text-xs"
                                                placeholder="e.g. Warranty"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Value</label>
                                            <input
                                                type="text"
                                                value={formData.specifications[key]}
                                                onChange={(e) => handleSpecChange(key, e.target.value)}
                                                className="form-input-premium !bg-white !py-2 !text-xs"
                                                placeholder="e.g. 2 Years"
                                            />
                                        </div>
                                    </div>
                                ))}
                            {Object.keys(formData.specifications).filter(k => !fields.includes(k) && k !== 'colors').length === 0 && (
                                <p className="text-center py-6 text-slate-400 text-xs italic">No custom specifications added yet</p>
                            )}
                        </div>
                    </div>
                )}

                {formData.category && (
                    <div className="form-card-premium">
                        <div className="flex justify-between items-center mb-6">
                            <h3>
                                <div className="icon-box bg-indigo-50 text-indigo-600">
                                     <ImageIcon size={18} />
                                </div>
                                Color Options
                            </h3>
                            <button type="button" onClick={addColor} className="btn-premium btn-premium-draft flex items-center gap-2 py-2 text-xs">
                                <Plus size={14} /> Add Color
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(formData.specifications?.colors || []).map((color, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                    <button type="button" onClick={() => removeColor(idx)} className="absolute -top-2 -right-2 w-7 h-7 bg-white text-red-500 rounded-full flex items-center justify-center border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                        <X size={12} />
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={color.name} onChange={(e) => handleColorChange(idx, 'name', e.target.value)} className="form-input-premium !py-2 !text-xs" placeholder="Color Name" />
                                        <div onClick={() => document.getElementById(`c-file-${idx}`).click()} className="h-9 border border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white transition-colors overflow-hidden">
                                            {color.image ? <img src={color.image} className="h-full w-full object-contain p-1" /> : <ImageIcon size={14} className="text-slate-300" />}
                                            <input id={`c-file-${idx}`} type="file" className="hidden" onChange={(e) => uploadFiles([e.target.files[0]], 'color', idx)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderVariantsTab = () => (
        <div className="animate-fade space-y-8">
            <div className="form-card-premium">
                <div className="flex justify-between items-center mb-8">
                    <h3>
                        <div className="icon-box bg-amber-50 text-amber-600">
                             <Settings size={18} />
                        </div>
                        Product Variants
                    </h3>
                    <button type="button" onClick={addVariant} className="btn-premium btn-premium-draft flex items-center gap-2 py-2 text-xs">
                        <Plus size={14} /> Add Variant
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.variants.map((variant, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                            <button type="button" onClick={() => removeVariant(idx)} className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <input type="text" value={variant.type} onChange={(e) => handleVariantChange(idx, 'type', e.target.value)} className="form-input-premium !py-2.5" placeholder="Type" />
                                <input type="text" value={variant.value} onChange={(e) => handleVariantChange(idx, 'value', e.target.value)} className="form-input-premium !py-2.5" placeholder="Value" />
                                <input type="number" value={variant.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} className="form-input-premium !py-2.5" placeholder="Price" />
                                <div onClick={() => document.getElementById(`v-file-${idx}`).click()} className="h-10 border border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white transition-colors overflow-hidden">
                                    {variant.image ? <img src={variant.image} className="h-full w-full object-contain p-1" /> : <ImageIcon size={16} className="text-slate-300" />}
                                    <input id={`v-file-${idx}`} type="file" className="hidden" onChange={(e) => uploadFiles([e.target.files[0]], 'variant', idx)} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMediaTab = () => (
        <div className="animate-fade space-y-8">
            <div className="form-card-premium">
                <h3>
                    <div className="icon-box bg-blue-50 text-blue-600">
                         <ImageIcon size={18} />
                    </div>
                    Product Gallery
                </h3>
                
                <div
                    onClick={() => document.getElementById('mainFileInput').click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition-all ${errors.images ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                >
                    <input id="mainFileInput" type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadFiles(Array.from(e.target.files))} />
                    <UploadCloud size={32} className="mx-auto mb-4 text-indigo-600" />
                    <p className="font-bold text-slate-700">Click to upload or drag & drop</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10">
                    {(formData.image_gallery || []).map((img, idx) => (
                        <div key={idx} className={`relative group aspect-square rounded-2xl overflow-hidden border-2 ${idx === 0 ? 'border-indigo-500' : 'border-slate-100'} bg-white`}>
                            <img src={img} className="w-full h-full object-contain p-3" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={() => setFormData(p => ({ ...p, image_gallery: p.image_gallery.filter((_, i) => i !== idx) }))} className="w-9 h-9 bg-white text-red-500 rounded-xl flex items-center justify-center">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderPublishTab = () => (
        <div className="animate-fade">
            <div className="form-card-premium max-w-2xl mx-auto text-center py-12">
                <CheckCircle2 size={40} className="mx-auto mb-6 text-green-500" />
                <h3 className="justify-center mb-2">Ready to Publish?</h3>
                <div className="flex gap-4 justify-center mt-8">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, status: 'active' }))} className={`px-8 py-3 rounded-xl font-bold border-2 ${formData.status === 'active' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-100'}`}>Active</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, status: 'draft' }))} className={`px-8 py-3 rounded-xl font-bold border-2 ${formData.status === 'draft' ? 'bg-slate-50 border-slate-500 text-slate-700' : 'border-slate-100'}`}>Draft</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade">
            <div className="form-tabs-horizontal mx-auto">
                {[
                    { id: 'General Info', icon: Tag },
                    { id: 'Specifications', icon: ChevronRight },
                    { id: 'Variants', icon: Settings },
                    { id: 'Media', icon: ImageIcon },
                    { id: 'Publish', icon: UploadCloud },
                ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`form-tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
                        <tab.icon size={16} /> {tab.id}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8">
                {activeTab === 'General Info' && renderGeneralTab()}
                {activeTab === 'Specifications' && renderSpecsTab()}
                {activeTab === 'Variants' && renderVariantsTab()}
                {activeTab === 'Media' && renderMediaTab()}
                {activeTab === 'Publish' && renderPublishTab()}

                <div className="form-actions-premium">
                    <button type="button" onClick={onCancel} className="btn-premium btn-premium-cancel">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="btn-premium btn-premium-publish">
                        {isSubmitting ? 'Processing...' : (product ? 'Save Changes' : 'Publish Product 🚀')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
