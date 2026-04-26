import { useEffect, useState, useMemo, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
    Search, ShoppingCart, Filter, X, Star, 
    ChevronRight, SlidersHorizontal, Heart,
    ChevronDown, ChevronUp, LayoutGrid
} from 'lucide-react';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';

const ProductList = () => {
    const { user } = useContext(AuthContext);
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Parse query params
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('sub_category') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
    // Support multiple brands, comma-separated in URL
    const initialBrands = searchParams.get('brands') ? searchParams.get('brands').split(',') : [];
    const [selectedBrands, setSelectedBrands] = useState(initialBrands);
    const [selectedSpecs, setSelectedSpecs] = useState({}); // { 'Processor': ['Core i5'], 'RAM': ['16 GB'] }
    const [sortOrder, setSortOrder] = useState('relevance');
    const [isCategoryListExpanded, setIsCategoryListExpanded] = useState(true);

    const categories = [
        'Laptops',
        'Desktop PCs',
        'Monitors',
        'Keyboards & Mouse',
        'Computer Components',
        'Storage Devices',
        'Networking Devices',
        'Computer Accessories'
    ];
    const brands = ['SmartCart', 'Apple', 'Sony', 'Bose', 'Samsung', 'Logitech', 'Razer'];
    const ratings = [4, 3, 2];

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Fetch ALL products once
                const prodRes = await api.get('/products');
                setAllProducts(prodRes.data);
                setFilteredProducts(prodRes.data);

                if (user || localStorage.getItem('token')) {
                    try {
                        const wishRes = await api.get('/products/wishlist');
                        setWishlistIds(new Set(wishRes.data.map(item => item.id)));
                    } catch (err) {
                        console.error("Wishlist operation failed", err);
                        setWishlistIds(new Set());
                    }
                } else {
                    setWishlistIds(new Set());
                }
            } catch (err) {
                console.error("Error fetching products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]);

    // Compute dynamic specs specifically for the currently visible products
    const dynamicSpecs = useMemo(() => {
        // Only consider products that match the current category, so we don't show Monitor refresh rates when Laptop category is selected
        const currentCategoryProducts = selectedCategory
            ? allProducts.filter(p => p.category === selectedCategory || p.sub_category === selectedCategory)
            : allProducts;

        const specsMap = {}; // { 'Processor': Set(['Core i5', 'Core i7']), ... }
        currentCategoryProducts.forEach(p => {
            if (p.specifications) {
                Object.entries(p.specifications).forEach(([key, val]) => {
                    // Ignore complex objects (like colors) or completely unhelpful huge text blocks
                    if (typeof val === 'string' && val.length < 50 && key !== 'Model Name' && key !== 'In The Box') {
                        if (!specsMap[key]) {
                            specsMap[key] = new Set();
                        }
                        specsMap[key].add(val);
                    }
                });
            }
        });

        // Convert map of Sets to array format for rendering
        // [{ name: 'Processor', values: ['Core i5', 'Core i7'] }, ...]
        return Object.entries(specsMap)
            .map(([name, values]) => ({ name, values: Array.from(values).sort() }))
            .filter(spec => spec.values.length > 1); // Only show filters that actually help refine choices
    }, [allProducts, selectedCategory]);

    // Compute available brands based strictly on products matching the current category
    const availableBrands = useMemo(() => {
        const currentCategoryProducts = selectedCategory
            ? allProducts.filter(p => p.category === selectedCategory || p.sub_category === selectedCategory)
            : allProducts;

        const b = new Set();
        currentCategoryProducts.forEach(p => {
            if (p.brand) b.add(p.brand);
        });
        return Array.from(b).sort();
    }, [allProducts, selectedCategory]);

    // Compute dynamic subcategories based on the active category
    const dynamicSubCategories = useMemo(() => {
        if (!selectedCategory) return [];

        const subs = new Set();
        allProducts.forEach(p => {
            if (p.category === selectedCategory && p.sub_category) {
                subs.add(p.sub_category);
            }
        });
        return Array.from(subs).sort();
    }, [allProducts, selectedCategory]);

    // Local filter effect
    useEffect(() => {
        let result = [...allProducts];

        // 1. Search filter
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.brand && p.brand.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        // 2. Category filter
        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        // 3. Sub-Category filter
        if (selectedSubCategory) {
            result = result.filter(p => p.sub_category === selectedSubCategory);
        }

        // 4. Brands filter (Multiple)
        if (selectedBrands.length > 0) {
            result = result.filter(p => selectedBrands.includes(p.brand));
        }

        // 5. Specs filters
        Object.entries(selectedSpecs).forEach(([specKey, selectedValues]) => {
            if (selectedValues && selectedValues.length > 0) {
                result = result.filter(p => p.specifications && selectedValues.includes(p.specifications[specKey]));
            }
        });

        // 5. Price filter (if numeric)
        if (minPrice) {
            result = result.filter(p => p.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            result = result.filter(p => p.price <= parseFloat(maxPrice));
        }

        // 6. Sort
        switch (sortOrder) {
            case 'price_low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price_high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                result.sort((a, b) => b.id - a.id); // higher ID roughly means newer
                break;
            case 'popularity':
            case 'relevance':
            default:
                // No complex sort
                break;
        }

        setFilteredProducts(result);
    }, [allProducts, searchTerm, selectedCategory, selectedSubCategory, selectedBrands, selectedSpecs, minPrice, maxPrice, sortOrder]);

    const handleToggleWishlist = async (e, productId) => {
        e.stopPropagation();
        try {
            if (wishlistIds.has(productId)) {
                await api.delete(`/products/${productId}/wishlist`);
                setWishlistIds(prev => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            } else {
                await api.post(`/products/${productId}/wishlist`);
                setWishlistIds(prev => new Set(prev).add(productId));
            }
        } catch (err) {
            console.error("Wishlist operation failed", err);
            if (err.response?.status === 401) {
                alert('Please sign in to add to favorites');
            }
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Reset spec filters entirely when jumping categories to prevent impossible states
        setSelectedSpecs({});
        applyFilters({ q: searchTerm });
    };

    const applyFilters = (updates = {}) => {
        // Navigation URL update, state handled by individual setters
        const params = new URLSearchParams(location.search);

        if (updates.category !== undefined) {
            updates.category ? params.set('category', updates.category) : params.delete('category');
            // Drop sub_category when category changes
            params.delete('sub_category');
            setSelectedSpecs({});
        }
        if (updates.sub_category !== undefined) {
            updates.sub_category ? params.set('sub_category', updates.sub_category) : params.delete('sub_category');
        }
        if (updates.brands !== undefined) {
            updates.brands.length > 0 ? params.set('brands', updates.brands.join(',')) : params.delete('brands');
        }
        if (updates.q !== undefined) {
            updates.q ? params.set('q', updates.q) : params.delete('q');
        }

        navigate(`/products?${params.toString()}`, { replace: true });
    };

    const handleCategoryClick = (cat) => {
        const newCat = selectedCategory === cat ? '' : cat;
        setSelectedCategory(newCat);
        setSelectedSubCategory('');
        applyFilters({ category: newCat });
    };

    const handleSubCategoryClick = (subCat) => {
        const newSubCat = selectedSubCategory === subCat ? '' : subCat;
        setSelectedSubCategory(newSubCat);
        applyFilters({ sub_category: newSubCat });
    };

    const handleSpecToggle = (specName, value) => {
        setSelectedSpecs(prev => {
            const currentSelected = prev[specName] || [];
            const newSelected = currentSelected.includes(value)
                ? currentSelected.filter(v => v !== value)
                : [...currentSelected, value];

            return {
                ...prev,
                [specName]: newSelected
            };
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedSubCategory('');
        setMinPrice('');
        setMaxPrice('');
        setSelectedBrands([]);
        setSelectedSpecs({});
        navigate('/products', { replace: true });
    };

    const getTopSpecs = (specs) => {
        if (!specs) return [];
        const priorityPatterns = ['Processor', 'CPU', 'RAM', 'Storage', 'Graphic', 'Display', 'Screen', 'Operating System', 'OS'];

        const valid = Object.entries(specs).filter(([key, val]) => typeof val === 'string' && val.length < 60);

        return valid.sort(([keyA], [keyB]) => {
            const aIdx = priorityPatterns.findIndex(p => keyA.toLowerCase().includes(p.toLowerCase()));
            const bIdx = priorityPatterns.findIndex(p => keyB.toLowerCase().includes(p.toLowerCase()));
            const aRank = aIdx !== -1 ? aIdx : 999;
            const bRank = bIdx !== -1 ? bIdx : 999;

            if (aRank !== bRank) {
                return aRank - bRank;
            }
            return keyA.localeCompare(keyB);
        }).slice(0, 4);
    };

    return (
        <div className="layout-wrapper bg-[#f1f3f6] min-h-screen pb-8">
            {/* Top Bar: Breadcrumbs & Results Info */}
            <div className="bg-white border-b border-slate-200 mb-2">
                <div className="container py-3">
                    <nav className="text-[12px] text-slate-500 mb-1 flex items-center gap-1">
                        <Link to="/" className="hover:text-blue-600">Home</Link>
                        <ChevronRight size={10} />
                        <span className="text-slate-900 font-medium">Computing</span>
                        <ChevronRight size={10} />
                        <span className="text-slate-900 font-medium">{selectedCategory || 'Laptops'}</span>
                    </nav>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-2">
                        <div className="flex-1">
                            <h2 className="text-sm font-bold text-slate-900">
                                Showing {filteredProducts.length} items
                            </h2>
                        </div>
                        {/* Mobile Filter Toggle */}
                        <div className="mobile-only">
                            <button 
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-700"
                            >
                                <Filter size={16} />
                                Filters
                            </button>
                        </div>
                        {/* Search Input in Results Bar - Centered */}
                        <div className="flex-1 flex justify-center">
                            <form onSubmit={handleSearch} className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search in this category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </form>
                        </div>
                        <div className="flex-1 hidden md:block"></div> {/* Spacer for symmetry */}
                    </div>
                </div>
            </div>

            <div className={`container shop-container-fk ${showMobileFilters ? 'show-filters-mobile' : ''}`}>
                {/* Filters Sidebar */}
                <aside className={`sidebar-fk ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
                    <div className="sidebar-fk-header">
                        <h2>Filters</h2>
                    </div>

                    {/* Category Filter */}
                    <div className="filter-section-fk">
                        <div className="filter-title-fk">CATEGORIES</div>
                        <div className="filter-options-fk">
                            <div className="mb-2">
                                <button
                                    onClick={() => setIsCategoryListExpanded(!isCategoryListExpanded)}
                                    className={`text-[14px] text-left py-2.5 px-3 w-full rounded font-bold transition-all flex items-center justify-between border ${!selectedCategory ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid size={16} />
                                        <span>All Products</span>
                                    </div>
                                    {isCategoryListExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCategoryListExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {categories.map(cat => (
                                    <div key={cat} className="mb-1">
                                        <button
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`text-[13.5px] text-left py-2 px-3 w-full rounded font-medium transition-colors flex items-center justify-between ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                                        >
                                            <span>{cat}</span>
                                            {selectedCategory === cat ? <ChevronRight size={14} className="rotate-90" /> : <ChevronRight size={14} className="opacity-40" />}
                                        </button>
                                        {selectedCategory === cat && dynamicSubCategories.length > 0 && (
                                            <div className="pl-4 pr-1 flex flex-col gap-1 mt-1 mb-2 border-l-2 border-blue-100 ml-3 py-1">
                                                {dynamicSubCategories.map(sub => (
                                                    <button
                                                        key={sub}
                                                        onClick={() => handleSubCategoryClick(sub)}
                                                        className={`text-[12.5px] text-left py-1.5 px-3 rounded transition-colors ${selectedSubCategory === sub ? 'font-bold bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                                                    >
                                                        {sub}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Brand Filter */}
                    {availableBrands.length > 0 && (
                        <div className="filter-section-fk">
                            <div className="filter-title-fk">BRAND</div>
                            <div className="filter-options-fk">
                                {availableBrands.map(brand => (
                                    <label key={brand} className="filter-option-fk">
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand)}
                                            onChange={() => {
                                                const newBrands = selectedBrands.includes(brand)
                                                    ? selectedBrands.filter(b => b !== brand)
                                                    : [...selectedBrands, brand];

                                                setSelectedBrands(newBrands);
                                                applyFilters({ brands: newBrands });
                                            }}
                                        />
                                        <span>{brand}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Specs Filters */}
                    {dynamicSpecs.map(spec => (
                        <div key={spec.name} className="filter-section-fk">
                            <div className="filter-title-fk uppercase">{spec.name}</div>
                            <div className="filter-options-fk">
                                {spec.values.map(val => (
                                    <label key={val} className="filter-option-fk">
                                        <input
                                            type="checkbox"
                                            checked={(selectedSpecs[spec.name] || []).includes(val)}
                                            onChange={() => handleSpecToggle(spec.name, val)}
                                        />
                                        <span>{val}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* Main Content Area */}
                <main className="main-content-fk">
                    {/* Sort Tabs */}
                    <div className="sort-bar-fk">
                        <span className="sort-label-fk">Sort By</span>
                        <div className="sort-tabs-fk">
                            {[
                                { id: 'relevance', label: 'Relevance' },
                                { id: 'popularity', label: 'Popularity' },
                                { id: 'price_low', label: 'Price -- Low to High' },
                                { id: 'price_high', label: 'Price -- High to Low' },
                                { id: 'newest', label: 'Newest First' }
                            ].map(tab => (
                                <div
                                    key={tab.id}
                                    className={`sort-tab-fk ${sortOrder === tab.id ? 'active' : ''}`}
                                    onClick={() => setSortOrder(tab.id)}
                                >
                                    {tab.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-24 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center px-4">
                            <Search size={48} className="text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No matching products found</h3>
                            <p className="text-slate-500 mb-8 max-w-sm">Try relaxing your filters or searching for something else.</p>
                            <button onClick={clearFilters} className="px-8 py-2.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">Reset All Filters</button>
                        </div>
                    ) : (
                        <div className="product-list-fk">
                            {filteredProducts.map(p => {
                                const discount = Math.floor(Math.random() * 20) + 10;
                                const mrp = Math.floor(p.price / (1 - discount / 100));

                                return (
                                    <div
                                        key={p.id}
                                        className="product-row-fk"
                                        onClick={() => navigate(`/products/${p.id}`)}
                                    >
                                        {/* Row Left: Image */}
                                        <div className="product-image-col-fk">
                                            <div className="relative group p-2">
                                                <img 
                                                    src={formatImageUrl(p.image_url)} 
                                                    alt={p.name} 
                                                    className="product-img-fk" 
                                                    loading="lazy" 
                                                    onError={handleImageError}
                                                />
                                                <button
                                                    onClick={(e) => handleToggleWishlist(e, p.id)}
                                                    className={`absolute top-0 right-0 p-2 transition-all`}
                                                >
                                                    <Heart size={18} fill={wishlistIds.has(p.id) ? '#f43f5e' : 'none'} color={wishlistIds.has(p.id) ? '#f43f5e' : '#cbd5e1'} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Row Center: Specs & Info */}
                                        <div className="product-info-col-fk">
                                            <h3 className="product-title-fk group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                            {/* 
                                            <div className="product-rating-row-fk">
                                                <div className="rating-badge-fk">
                                                    {p.avg_rating || '4.2'} <Star size={10} className="fill-white" />
                                                </div>
                                                <span className="rating-count-fk">
                                                    {(p.review_count || 1205).toLocaleString()} Ratings & {Math.floor((p.review_count || 1205) / 5)} Reviews
                                                </span>
                                            </div>
                                            */}
                                            <ul className="product-specs-fk">
                                                {p.brand && <li><span className="font-semibold text-slate-700">Brand:</span> {p.brand}</li>}
                                                {getTopSpecs(p.specifications).map(([key, value]) => (
                                                    <li key={key}><span className="font-semibold text-slate-700">{key}:</span> {value}</li>
                                                ))}
                                                {p.warranty && <li><span className="font-semibold text-slate-700">Warranty:</span> {p.warranty}</li>}
                                            </ul>
                                        </div>

                                        {/* Row Right: Pricing */}
                                        <div className="product-price-col-fk">
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
                                            <p className="free-delivery-fk font-bold">Free delivery</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductList;
