import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import OrderList from './admin/OrderList';
import TicketManager from './admin/TicketManager';
import {
    LayoutDashboard, PlusCircle, Upload, RotateCcw,
    BarChart3, FileText, User, Users, Eye, Download,
    Search, TrendingUp, Package, UserCircle, Target,
    CheckCircle2, IndianRupee, MoreHorizontal,
    ChevronLeft, ChevronRight, Settings, LogOut,
    Bell, ShoppingCart, MessageSquare, Menu, X
} from 'lucide-react';
import FloatingChatbot from '../components/FloatingChatbot';
import { getTargetForUser } from '../utils/targetUtils';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StaffPortal = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [personalStats, setPersonalStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBuildMode, setIsBuildMode] = useState(false);
    const [buildComponents, setBuildComponents] = useState([
        { id: Date.now(), name: '', price: '' }
    ]);
    const [buildTitle, setBuildTitle] = useState('Custom Gaming PC Build');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffSearchTerm, setStaffSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [showStaffResults, setShowStaffResults] = useState(false);
    const [isGlobal, setIsGlobal] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
    const [submitting, setSubmitting] = useState(false);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [historyFilters, setHistoryFilters] = useState({
        startDate: '',
        buyerName: '',
        staffName: '',
        productName: '',
        paymentMethod: ''
    });
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [profile, setProfile] = useState(null);
    const [returnsHistory, setReturnsHistory] = useState([]);
    const [returnsFilter, setReturnsFilter] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Helper to generate unique Sale ID
    const generateSaleID = () => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `OFF-${dateStr}-${randomStr}`;
    };

    // Form states
    const [formData, setFormData] = useState({
        sale_id: generateSaleID(),
        staff_name: '', staff_unique_id: '', product_id: '', product_name: '',
        category: '', sub_category: '', quantity: 1, price: '',
        offline_discount: 0,
        customer_name: '', customer_phone: '', notes: '',
        payment_method: 'UPI', date: new Date().toISOString().split('T')[0]
    });

    const [returnId, setReturnId] = useState('');
    const [returnQty, setReturnQty] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Profile state

    // Sync isGlobal logic when user loads
    useEffect(() => {
        if (['admin', 'staff'].includes(user?.role)) {
            setIsGlobal(true);
        }
    }, [user?.role]);

    // Clear messages when changing tabs to prevent misleading errors on unrelated pages
    useEffect(() => {
        setMessage(null);
    }, [activeTab]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch categories independently - always needed for the form dropdown
                try {
                    const catRes = await api.get('/products/categories');
                    setCategories(catRes.data);
                } catch (err) {
                    console.error("Failed to fetch categories", err);
                }

                // Fetch products (available to all authenticated users)
                try {
                    const productsRes = await api.get('/products');
                    setProducts(productsRes.data);
                } catch (err) {
                    console.error("Failed to fetch products", err);
                }

                // Fetch staff list (requires staff or admin role)
                try {
                    const staffRes = await api.get('/offline/staff/list');
                    setStaffList(staffRes.data);
                } catch (err) {
                    console.error("Failed to fetch staff list (likely permission)", err);
                    // Fallback: just put the current user as the only option
                    if (user) setStaffList([{ id: user.id, username: user.username }]);
                }

                // Fetch stats, leaderboard, profile, analysis
                try {
                    const statsParams = {
                        params: {
                            global: isGlobal,
                            no_history: true,
                            year: filterYear,
                            month: filterMonth,
                            day: filterDay
                        }
                    };
                    const [statsRes, personalStatsRes, lbRes, profileRes, analysisRes] = await Promise.all([
                        api.get('/offline/stats', statsParams).catch(err => ({ data: { total_revenue: 0, today_sales: 0, avg_transaction_value: 0, history: [] } })),
                        api.get('/offline/stats', { params: { global: false, month: new Date().getMonth() + 1, year: new Date().getFullYear() } }).catch(err => ({ data: { total_revenue: 0 } })),
                        api.get('/offline/leaderboard').catch(err => ({ data: [] })),
                        api.get('/auth/profile').catch(err => ({ data: null })),
                        api.get('/offline/analysis', {
                            params: {
                                global: isGlobal,
                                year: filterYear,
                                month: filterMonth,
                                day: filterDay
                            }
                        }).catch(err => ({ data: { daily_sales: [], category_split: [], payment_split: [], staff_perf: [] } }))
                    ]);

                    if (statsRes.data) setStats(statsRes.data);
                    if (personalStatsRes.data) setPersonalStats(personalStatsRes.data);
                    if (lbRes.data) setLeaderboard(lbRes.data);
                    if (profileRes.data) setProfile(profileRes.data);
                    if (analysisRes.data) setAnalysis(analysisRes.data);

                    // Fetch history independently to ensure it doesn't fail the whole block
                    try {
                        let finalHistory = [];
                        if (['admin', 'staff'].includes(user?.role)) {
                            const adminHistRes = await api.get('/admin/offline');
                            finalHistory = adminHistRes.data;
                        } else {
                            // Non-admins get their data from personal stats
                            // Here we might need a separate /personal/history if we used no_history above
                            // But for simplicity let's just re-fetch stats with history if needed
                            const personalStats = await api.get('/offline/stats', { params: { global: false } });
                            finalHistory = personalStats.data?.history || [];
                        }

                        // Process history to add fast numeric timestamps
                        const processed = (finalHistory || []).map(h => ({
                            ...h,
                            _ts: h.date ? new Date(h.date).getTime() : 0
                        }));
                        setHistory(processed);
                    } catch (err) {
                        console.error("Failed to fetch history", err);
                        setHistory([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch stats/leaderboard/analysis", err);
                }

                // Fetch returns history independently so it always loads
                try {
                    const returnsRes = await api.get('/offline/returns');
                    setReturnsHistory(returnsRes.data || []);
                } catch (err) {
                    console.error("Failed to fetch returns history", err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey, isBuildMode, isGlobal, filterYear, filterMonth, filterDay]);

    useEffect(() => {
        if (user && !formData.staff_name) {
            setFormData(prev => ({
                ...prev,
                staff_name: user.username || '',
                staff_unique_id: user.id ? `EMP-${user.id}` : ''
            }));
            setStaffSearchTerm(user.username || '');
        }
    }, [user]);

    const filteredProducts = products.filter(p => {
        const matchesSearch = !searchTerm ||
            (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = !formData.category || p.category === formData.category;
        const matchesSubCategory = !formData.sub_category || p.sub_category === formData.sub_category;
        return matchesSearch && matchesCategory && matchesSubCategory;
    });

    // Build category / sub-category lists from the dedicated Category model (same source as admin)
    const subCategoriesForSelected = formData.category
        ? (categories.find(c => c.name === formData.category)?.subcategories || [])
        : [];

    const filteredStaff = staffList.filter(s =>
        (s.username && s.username.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
        (s.id && `EMP-${s.id}`.toLowerCase().includes(staffSearchTerm.toLowerCase()))
    );

    const handleProductSelect = (product) => {
        setFormData({
            ...formData,
            product_id: product.id,
            product_name: product.name,
            category: product.category || '',
            sub_category: product.sub_category || '',
            price: product.price
        });
        setSearchTerm(product.name);
        setShowResults(false);
        setShowStaffResults(false);
    };

    const handleStaffSelect = (s) => {
        setFormData({
            ...formData,
            staff_name: s.username,
            staff_unique_id: `EMP-${s.id}`
        });
        setStaffSearchTerm(s.username);
        setShowStaffResults(false);
    };

    const handleFormReset = () => {
        setFormData({
            sale_id: generateSaleID(),
            staff_name: user?.username || '',
            staff_unique_id: user?.id ? `EMP-${user.id}` : '',
            product_id: '',
            product_name: '',
            category: '',
            sub_category: '',
            quantity: 1,
            price: '',
            offline_discount: 0,
            customer_name: '',
            customer_phone: '',
            notes: '',
            payment_method: 'UPI',
            date: new Date().toISOString().split('T')[0]
        });
        setSearchTerm('');
        setStaffSearchTerm(user?.username || '');
        setMessage(null);
    };

    const addComponentRow = () => {
        setBuildComponents([...buildComponents, { id: Date.now(), name: '', price: '' }]);
    };

    const removeComponentRow = (id) => {
        if (buildComponents.length > 1) {
            setBuildComponents(buildComponents.filter(c => c.id !== id));
        }
    };

    const updateComponent = (id, field, value) => {
        setBuildComponents(buildComponents.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    const calculateBuildTotal = () => {
        return buildComponents.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
    };

    const handleSaleSubmit = async (e) => {
        if (e) e.preventDefault();

        let productName = formData.product_name || searchTerm;
        let finalPrice = formData.price;
        let finalNotes = formData.notes;

        if (isBuildMode) {
            productName = buildTitle || 'Custom PC Build';
            finalPrice = calculateBuildTotal();
            const breakdown = buildComponents
                .filter(c => c.name && c.price)
                .map(c => `- ${c.name}: ₹${parseFloat(c.price).toLocaleString()}`)
                .join('\n');
            finalNotes = `PC BUILD BREAKDOWN:\n${breakdown}\n\n${formData.notes || ''}`;
        }

        // Validate required fields manually
        if (!productName) {
            setMessage({ type: 'error', text: 'Please select or enter a product name.' });
            return;
        }
        if (!finalPrice || parseFloat(finalPrice) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid price.' });
            return;
        }

        setSubmitting(true);
        try {
            const saleData = {
                ...formData,
                product_name: productName,
                price: finalPrice,
                notes: finalNotes
            };
            const res = await api.post('/offline', saleData);
            setMessage({ type: 'success', text: `✅ Sale recorded: ${res.data.sale_id}` });
            setFormData({
                ...formData,
                'sale_id': res.data.sale_id,
                product_id: '',
                product_name: '',
                category: '',
                sub_category: '',
                quantity: 1,
                price: '',
                offline_discount: 0,
                customer_name: '',
                customer_phone: '',
                notes: ''
            });
            setSearchTerm('');
            setIsBuildMode(false);
            setBuildComponents([{ id: Date.now(), name: '', price: '' }]);
            setBuildTitle('Custom Gaming PC Build');
            
            // Show Success Popup
            setShowSuccessPopup(true);
            setTimeout(() => {
                setShowSuccessPopup(false);
            }, 1000);

            // Refresh history & stats after successful sale
            try {
                const statsRes = await api.get('/offline/stats');
                setStats(statsRes.data);
                setHistory(statsRes.data.history || []);
            } catch (err) {
                console.error("Failed to refresh stats after sale", err);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Submission failed. Check all fields.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        try {
            const reason = e.target.querySelector('textarea')?.value || 'Not specified';
            await api.post('/offline/return', { sale_id: returnId, quantity: returnQty, reason });
            setMessage({ type: 'success', text: 'Return processed successfully!' });
            setReturnId('');
            setReturnQty(1);
            // Refresh returns history
            const returnsRes = await api.get('/offline/returns');
            setReturnsHistory(returnsRes.data || []);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Return failed' });
        }
    };

    const handleDownloadReceipt = (sale) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(74, 108, 247);
            doc.text("SMART CART", 105, 20, { align: "center" });

            doc.setFontSize(14);
            doc.setTextColor(100);
            doc.text("OFFLINE SALES RECEIPT", 105, 30, { align: "center" });

            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Details
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Sale ID: ${sale?.sale_id || 'N/A'}`, 20, 45);
            doc.text(`Date & Time: ${sale?.created_at || sale?.date || 'N/A'}`, 20, 52);
            doc.text(`Staff: ${sale?.staff || 'N/A'}`, 20, 59);

            doc.text("CUSTOMER INFORMATION", 120, 45);
            doc.text(`Name: ${sale?.customer_name || 'N/A'}`, 120, 52);
            doc.text(`Phone: ${sale?.customer_phone || 'N/A'}`, 120, 59);

            // Product Table
            autoTable(doc, {
                startY: 70,
                head: [['Product', 'Category', 'Qty', 'Price', 'Discount', 'Total']],
                body: [[
                    sale?.product || 'Unknown Product',
                    sale?.category || 'N/A',
                    sale?.quantity || 0,
                    `Rs. ${(sale?.price || 0).toLocaleString()}`,
                    `Rs. ${(sale?.discount || 0).toLocaleString()}`,
                    `Rs. ${(sale?.amount || 0).toLocaleString()}`
                ]],
                headStyles: { fillColor: [74, 108, 247] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });

            // Use doc.lastAutoTable.finalY or fallback to a safe position
            const finalY = (doc.lastAutoTable?.finalY || 100) + 15;

            doc.setFontSize(12);
            doc.text(`Payment Mode: ${sale?.method || 'N/A'}`, 20, finalY);
            doc.setFontSize(16);
            doc.text(`Grand Total: Rs. ${(sale?.amount || 0).toLocaleString()}`, 190, finalY, { align: 'right' });

            if (sale?.notes) {
                doc.setFontSize(10);
                doc.text("Notes:", 20, finalY + 15);
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(sale.notes, 20, finalY + 22);
            }

            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Thank you for your purchase!", 105, 280, { align: "center" });

            doc.save(`Receipt_${sale?.sale_id || 'sale'}.pdf`);
        } catch (err) {
            console.error("PDF Generation failed", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    const handleDownloadReturnReceipt = (refund) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(251, 146, 60); // Orange for returns
            doc.text("SMART CART", 105, 20, { align: "center" });

            doc.setFontSize(14);
            doc.setTextColor(100);
            doc.text("REFUND / RETURN RECEIPT", 105, 30, { align: "center" });

            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Details
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Original Sale ID: ${refund?.sale_id || 'N/A'}`, 20, 45);
            doc.text(`Return Date: ${refund?.return_date || refund?.date || 'N/A'}`, 20, 52);
            doc.text(`Staff: ${refund?.staff_name || 'N/A'}`, 20, 59);

            // Refund Table
            autoTable(doc, {
                startY: 70,
                head: [['Product', 'Qty Returned', 'Refund Amount', 'Reason']],
                body: [[
                    refund?.product_name || 'Unknown',
                    refund?.quantity_returned || 0,
                    `Rs. ${(refund?.refund_amount || 0).toLocaleString()}`,
                    refund?.return_reason || 'N/A'
                ]],
                headStyles: { fillColor: [251, 146, 60] },
            });

            const finalY = (doc.lastAutoTable?.finalY || 100) + 15;

            doc.setFontSize(16);
            doc.text(`Total Refund: Rs. ${(refund?.refund_amount || 0).toLocaleString()}`, 190, finalY, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("This is an official refund confirmation.", 105, 280, { align: "center" });

            doc.save(`Refund_${refund?.sale_id || 'return'}.pdf`);
        } catch (err) {
            console.error("PDF Generation failed", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, GIF, WEBP)' });
            return;
        }

        const formData = new FormData();
        formData.append('files[]', file);

        try {
            setSubmitting(true);
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.urls && res.data.urls.length > 0) {
                const newPhotoUrl = res.data.urls[0];
                setProfile({ ...profile, profile_pic: newPhotoUrl });
                // Automatically save profile update
                await api.patch('/auth/profile', { ...profile, profile_pic: newPhotoUrl });
                setMessage({ type: 'success', text: '✅ Profile photo updated!' });

                // Refresh leaderboard to show new photo
                const lbRes = await api.get('/offline/leaderboard');
                setLeaderboard(lbRes.data);
            }
        } catch (err) {
            console.error("Upload failed", err);
            setMessage({ type: 'error', text: 'Photo upload failed. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setSelectedFile(file);
            setMessage(null);
        } else {
            setMessage({ type: 'error', text: 'Please select a valid CSV file' });
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage({ type: 'error', text: 'No file selected' });
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setUploading(true);
            const res = await api.post('/offline/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: res.data.msg || 'Upload successful!' });
            setSelectedFile(null);
            // Reset file input
            const fileInput = document.getElementById('bulk-csv');
            if (fileInput) fileInput.value = '';

            // Refresh stats/history
            setActiveTab('dashboard');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    // Dynamic Chart Data Calculations
    const getChartData = () => {
        // Line Data from Analysis
        const dSales = analysis?.daily_sales || [];
        const displayDates = dSales.length > 0 ? dSales.map(d => d.date) : ['No Data'];
        const displayAmounts = dSales.length > 0 ? dSales.map(d => d.amount) : [0];

        const lineData = {
            labels: displayDates,
            datasets: [
                {
                    label: 'Offline Sales',
                    data: displayAmounts,
                    borderColor: '#4a6cf7',
                    backgroundColor: 'rgba(74, 108, 247, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2,
                }
            ],
        };

        // Bar Data (Staff Performance or Daily Bar)
        const sPerf = analysis?.staff_perf || [];
        // If global and has staff perf, show it. Otherwise show daily volume.
        const useStaffPerf = isGlobal && sPerf.length > 0;
        const barLabels = useStaffPerf ? sPerf.map(s => s.name) : displayDates;
        const barAmounts = useStaffPerf ? sPerf.map(s => s.value) : displayAmounts;

        const barData = {
            labels: barLabels,
            datasets: [{
                label: useStaffPerf ? 'Sales by Staff' : 'Daily Sales Volume',
                data: barAmounts,
                backgroundColor: '#4a6cf7',
                borderRadius: 6,
            }]
        };

        // Pie Data (Category Split)
        const cSplit = analysis?.category_split || [];
        const pieLabels = cSplit.length > 0 ? cSplit.map(c => c.name) : ['Default'];
        const pieAmounts = cSplit.length > 0 ? cSplit.map(c => c.value) : [100];

        const pieData = {
            labels: pieLabels,
            datasets: [{
                data: pieAmounts,
                backgroundColor: ['#4a6cf7', '#fb923c', '#ef4444', '#10b981', '#8b5cf6'],
                borderWidth: 0,
            }]
        };

        // Payment Data (NEW)
        const pSplit = (analysis?.payment_split || []);
        const payLabels = pSplit.length > 0 ? pSplit.map(p => p.name) : ['UPI', 'Cash', 'Credit Card', 'Debit Card'];
        const payAmounts = pSplit.length > 0 ? pSplit.map(p => p.value) : [0, 0, 0, 0];

        const paymentData = {
            labels: payLabels,
            datasets: [{
                data: payAmounts,
                backgroundColor: ['#4a6cf7', '#fb923c', '#10b981', '#f59e0b', '#8b5cf6'],
                borderWidth: 0,
            }]
        };

        return { lineData, barData, pieData, paymentData };
    };

    const { lineData, barData, pieData, paymentData } = getChartData();

    // Derived filtered history for the History tab - FAST NUMERIC FILTERING
    const filteredHistory = useMemo(() => {
        if (!history) return [];

        // Pre-parse filter date once outside the loop
        const filterTs = historyFilters.startDate ? new Date(historyFilters.startDate).getTime() : null;

        return history.filter(item => {
            const matchesStaff = !historyFilters.staffName ||
                (item.staff && item.staff.toLowerCase().includes(historyFilters.staffName.toLowerCase()));
            const matchesBuyer = !historyFilters.buyerName ||
                (item.customer_name && item.customer_name.toLowerCase().includes(historyFilters.buyerName.toLowerCase()));
            const matchesProduct = !historyFilters.productName ||
                (item.product && item.product.toLowerCase().includes(historyFilters.productName.toLowerCase()));
            const matchesMethod = !historyFilters.paymentMethod ||
                item.method === historyFilters.paymentMethod;

            // Date filtering using numeric timestamps (blazing fast)
            if (!filterTs) return matchesStaff && matchesBuyer && matchesProduct && matchesMethod;

            return item._ts >= filterTs && matchesStaff && matchesBuyer && matchesProduct && matchesMethod;
        });
    }, [history, historyFilters]);

    // Enhanced metrics for the filtered result
    const filteredMetrics = useMemo(() => {
        const revenue = filteredHistory.reduce((sum, s) => sum + (s.amount || 0), 0);
        const discount = filteredHistory.reduce((sum, s) => sum + (s.discount || 0), 0);
        const count = filteredHistory.length;
        const avgValue = count > 0 ? revenue / count : 0;

        // Find top product
        const productStats = filteredHistory.reduce((acc, s) => {
            acc[s.product] = (acc[s.product] || 0) + (s.quantity || 0);
            return acc;
        }, {});
        const topProduct = Object.entries(productStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return { revenue, discount, count, avgValue, topProduct };
    }, [filteredHistory]);

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock > 0 && p.stock < 15);
    }, [products]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.patch('/auth/profile', profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Refresh leaderboard to reflect any name/photo changes
            const lbRes = await api.get('/offline/leaderboard');
            setLeaderboard(lbRes.data);

            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error("Update failed", err);
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update profile' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleNotifyAdmin = async (p) => {
        try {
            setSubmitting(true);
            await api.post('/offline/staff-alert', {
                product_id: p.id,
                product_name: p.name,
                stock_count: p.stock
            });
            alert(`Admin has been notified about ${p.name}'s stock levels.`);
        } catch (err) {
            console.error("Failed to notify admin", err);
            alert("Failed to send notification. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="loading-screen" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4a6cf7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className={`staff-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            {/* Sidebar */}
            <aside className={`staff-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="logo-section">
                    <div className="logo-icon">🛒</div>
                    <h2>Smart Cart</h2>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
                            <LayoutDashboard size={20} /> <span>Dashboard</span>
                        </li>
                        <li className={activeTab === 'entry' ? 'active' : ''} onClick={() => setActiveTab('entry')}>
                            <PlusCircle size={20} /> <span>Sales Entry</span>
                        </li>
                        <li className={activeTab === 'returns' ? 'active' : ''} onClick={() => setActiveTab('returns')}>
                            <RotateCcw size={20} /> <span>Returns</span>
                        </li>
                        <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
                            <FileText size={20} /> <span>History</span>
                        </li>
                        <li className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
                            <Package size={20} /> <span>Inventory</span>
                        </li>
                        <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                            <ShoppingCart size={20} /> <span>Orders</span>
                        </li>
                        <li className={activeTab === 'tickets' ? 'active' : ''} onClick={() => setActiveTab('tickets')}>
                            <MessageSquare size={20} /> <span>Tickets</span>
                        </li>
                        <li className={activeTab === 'upload' ? 'active' : ''} onClick={() => setActiveTab('upload')}>
                            <Upload size={20} /> <span>CSV Upload</span>
                        </li>
                        <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                            <UserCircle size={20} /> <span>Profile</span>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="settings-btn logout-btn" onClick={logout}>
                        <LogOut size={20} /> <span>Logout</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="staff-main">
                {/* Header */}
                <header className="staff-header">
                    <div className="header-left">
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <div className="flex items-center gap-4">
                            <h1>Staff Dashboard</h1>
                        </div>
                        <p className="breadcrumb">Smart Cart Analytics - <span>Staff Dashboard</span></p>
                    </div>
                    <div className="header-right">
                        <div className="user-profile" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
                            <img src={profile?.profile_pic || "https://i.pravatar.cc/100?img=12"} alt="User" className="avatar" />
                            <div className="user-info">
                                <span className="user-name">{profile?.username || user?.username || 'Staff'}</span>
                                <span className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Staff Member'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="content-scrollable">
                    {activeTab === 'dashboard' && (
                        <div className="dashboard-view animate-in">
                            {/* Target Progress Card */}
                            {user && (
                                <div className="mb-6 bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm flex items-center gap-6 animate-in zoom-in">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                        <Target size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 leading-none">Your Monthly Target</h3>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Revenue Goal Achievement</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-indigo-600">₹{(personalStats?.total_revenue || 0).toLocaleString()}</span>
                                                <span className="text-slate-300 mx-2 text-xl">/</span>
                                                <span className="text-lg font-bold text-slate-500">₹{(getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                                                style={{ width: `${Math.min(((personalStats?.total_revenue || 0) / (getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) > 0
                                                    ? `${Math.round(((personalStats?.total_revenue || 0) / (getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) || 1)) * 100)}% Reached`
                                                    : 'No target set by admin'}
                                            </span>
                                            {getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) > 0 && (personalStats?.total_revenue || 0) >= getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) && (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 animate-bounce">
                                                    <CheckCircle2 size={12} /> Target Achieved! 🎊
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CONGRATULATIONS OVERLAY - PREMIUM STYLE */}
                            {user && getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) > 0 && (personalStats?.total_revenue || 0) >= getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear()) && (
                                <div className="mb-6 bg-emerald-50 border border-emerald-200 p-6 rounded-[32px] animate-in slide-in-from-top flex items-center gap-6 shadow-sm border-b-4 border-b-emerald-500">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-bounce">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-emerald-900 leading-none">Target Achievements Unlocked!</h4>
                                        <p className="text-sm font-bold text-emerald-600 mt-2">
                                            Congratulations <span className="text-emerald-800 font-black underline decoration-emerald-300 decoration-2">{user?.username}</span>! You've officially reached your monthly revenue goal. 🎊
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-sm">Goal Smashed</span>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight italic">Performance: {Math.round(((personalStats?.total_revenue || 0) / getTargetForUser(user.username, new Date().getMonth() + 1, new Date().getFullYear())) * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Dashboard Filters Row */}
                            <div className="dashboard-filters-row mb-6 flex gap-4 items-center flex-wrap" style={{ background: 'white', padding: '12px 20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Year:</span>
                                    <select
                                        value={filterYear}
                                        onChange={e => setFilterYear(e.target.value)}
                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        <option value="">All</option>
                                        <option value="2026">2026</option>
                                        <option value="2025">2025</option>
                                        <option value="2024">2024</option>
                                        <option value="2023">2023</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Month:</span>
                                    <select
                                        value={filterMonth}
                                        onChange={e => setFilterMonth(e.target.value)}
                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        <option value="">All</option>
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Day:</span>
                                    <select
                                        value={filterDay}
                                        onChange={e => setFilterDay(e.target.value)}
                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        <option value="">All</option>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                {(filterYear || filterMonth || filterDay) && (
                                    <button
                                        onClick={() => { setFilterYear(''); setFilterMonth(''); setFilterDay(''); }}
                                        style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>

                            {/* Summary Cards */}
                            {/* Summary Cards - Modern Rectangle Row */}
                            <div className="metrics-summary-row mb-8">
                                <div className="summary-metric-card">
                                    <div className="metric-icon-bg bg-blue-50 text-blue-600">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className="metric-details">
                                        <span className="metric-label">Today's Sales</span>
                                        <span className="metric-value">₹{(stats?.today_sales || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="summary-metric-card">
                                    <div className="metric-icon-bg bg-emerald-50 text-emerald-600">
                                        <IndianRupee size={18} />
                                    </div>
                                    <div className="metric-details">
                                        <span className="metric-label">Revenue</span>
                                        <span className="metric-value">₹{(stats?.total_revenue || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="summary-metric-card">
                                    <div className="metric-icon-bg bg-amber-50 text-amber-600">
                                        <BarChart3 size={18} />
                                    </div>
                                    <div className="metric-details">
                                        <span className="metric-label">Avg Order</span>
                                        <span className="metric-value">₹{(stats?.avg_transaction_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>

                                <div className="summary-metric-card">
                                    <div className="metric-icon-bg bg-rose-50 text-rose-600">
                                        <RotateCcw size={18} />
                                    </div>
                                    <div className="metric-details">
                                        <span className="metric-label">Returns</span>
                                        <span className="metric-value">₹{returnsHistory.reduce((s, r) => s + (r.refund_amount || 0), 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Statistics Grid */}
                            <div className="stats-grid">
                                {/* Sales Overview Chart */}
                                <div className="grid-box chart-wide">
                                    <div className="box-header">
                                        <h3>Sales Overview</h3>
                                        <div className="chart-legend" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                                                <span className="dot blue" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4a6cf7', display: 'inline-block' }}></span> Offline Sales Volume
                                            </span>
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }} />
                                    </div>
                                </div>

                                {/* Top Staff List */}
                                <div className="grid-box top-staff">
                                    <div className="box-header">
                                        <h3>Leaderboard</h3>
                                        <Users size={18} className="text-blue-500" />
                                    </div>
                                    <div className="staff-list">
                                        {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((staff, i) => {
                                            const colors = ['#4a6cf7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
                                            const colorIdx = staff.staff_name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
                                            const initials = staff.staff_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                                            return (
                                                <div key={i} className="staff-item">
                                                    <div className={`staff-rank ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}>{i + 1}</div>
                                                    {staff.profile_pic ? (
                                                        <img src={staff.profile_pic} alt={staff.staff_name} className="mini-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                    ) : (
                                                        <div className="mini-avatar" style={{ background: colors[colorIdx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'white', borderRadius: '50%', width: '36px', height: '36px', flexShrink: 0 }}>
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div className="staff-details">
                                                        <p className="staff-name">{staff.staff_name}</p>
                                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: '#64748b' }}>
                                                            <span>{staff.sales_count} Sales</span>
                                                            <span>₹{staff.revenue.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="staff-score">{Math.round(staff.score)}%</div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="empty-state">No sales data yet</div>
                                        )}
                                    </div>
                                </div>

                                {/* Low Stock Alert */}
                                <div className="grid-box low-stock">
                                    <div className="box-header">
                                        <h3>Low Stock Alerts</h3>
                                        <Package size={18} className="text-red-500" />
                                    </div>
                                    <div className="alert-list">
                                        {lowStockProducts.length > 0 ? lowStockProducts.slice(0, 5).map((p, i) => (
                                            <div key={i} className="alert-item" style={{ borderLeft: p.stock < 5 ? '4px solid #ef4444' : '4px solid #f59e0b' }}>
                                                <div className="p-icon" style={{ fontSize: '1.2rem' }}>{p.stock < 5 ? '🚨' : '📦'}</div>
                                                <div className="p-info">
                                                    <p className="p-name" style={{ fontWeight: 700 }}>{p.name}</p>
                                                    <span className="p-stock" style={{ color: p.stock < 5 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                                        {p.stock < 5 ? 'Critical:' : 'Limited:'} {p.stock} units left
                                                    </span>
                                                </div>
                                                <button className="notify-btn" onClick={() => handleNotifyAdmin(p)} disabled={submitting}>Notify Admin</button>
                                            </div>
                                        )) : (
                                            <div className="empty-state">
                                                <CheckCircle2 size={32} />
                                                <p>All stock levels healthy</p>
                                            </div>
                                        )}
                                    </div>
                                    {lowStockProducts.length > 5 && (
                                        <button className="view-all-link" onClick={() => setActiveTab('inventory')}>
                                            View all low stock
                                        </button>
                                    )}
                                </div>


                                {/* Recent Entries Table */}
                                <div className="grid-box recent-entries">
                                    <div className="box-header">
                                        <h3>Recent Entries</h3>
                                        <button className="more-btn"><MoreHorizontal size={16} /></button>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sale ID</th>
                                                <th>Staff Name</th>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.slice(0, 5).map((sale, i) => (
                                                <tr key={i}>
                                                    <td className="mono">{sale.sale_id}</td>
                                                    <td className="bold">{sale.staff}</td>
                                                    <td>{sale.product}</td>
                                                    <td>{sale.quantity}</td>
                                                    <td className="bold">₹{sale.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {history.length === 0 && (
                                                <>
                                                    <tr><td className="mono">OFF-20240318-A1B2</td><td className="bold">Rahul Sharma</td><td>MacBook Air M2</td><td>1</td><td className="bold">₹1,14,900</td></tr>
                                                    <tr><td className="mono">OFF-20240318-C3D4</td><td className="bold">Ananya Verma</td><td>Logitech G502</td><td>2</td><td className="bold">₹9,998</td></tr>
                                                    <tr><td className="mono">OFF-20240318-E5F6</td><td className="bold">Vikram Singh</td><td>Samsung 980 Pro 1TB</td><td>3</td><td className="bold">₹24,000</td></tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>


                                {/* Bottom Visualization Charts */}
                                <div className="grid-box">
                                    <div className="box-header"><h3>Sales By Staff</h3></div>
                                    <div className="chart-container-sm">
                                        <Bar data={barData} options={{ maintainAspectRatio: false, indexAxis: 'x', plugins: { legend: { display: false } } }} />
                                    </div>
                                </div>

                                <div className="grid-box">
                                    <div className="box-header"><h3>Payment Methods</h3></div>
                                    <div className="chart-container-row">
                                        <div className="mini-chart"><Doughnut data={paymentData} options={{ cutout: '60%', plugins: { legend: { display: false } } }} /></div>
                                        <div className="chart-bars custom-scrollbar" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                            {paymentData.labels.map((label, idx) => {
                                                const total = paymentData.datasets[0].data.reduce((a, b) => a + b, 0) || 1;
                                                const val = paymentData.datasets[0].data[idx];
                                                const pct = (val / total) * 100;
                                                const colors = paymentData.datasets[0].backgroundColor;
                                                return (
                                                    <div key={idx} className="mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                                            <span className="text-[10px] font-black text-slate-700">₹{Number(val || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'entry' && (
                        <div className="form-view animate-in">
                            <div className="premium-form-card">
                                <div className="form-head" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <PlusCircle size={24} className="text-blue" />
                                        <h3>Record New Offline Sale</h3>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsBuildMode(!isBuildMode);
                                            }}
                                            style={{
                                                background: isBuildMode ? '#8b5cf6' : '#f1f5f9',
                                                color: isBuildMode ? 'white' : '#64748b',
                                                padding: '8px 20px',
                                                borderRadius: '30px',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: isBuildMode ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                                            }}
                                        >
                                            <Package size={16} />
                                            {isBuildMode ? 'PC BUILD MODE' : 'STANDARD SALE'}
                                        </button>
                                        {isBuildMode && (
                                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', width: '10px', height: '10px', borderRadius: '50%', boxShadow: '0 0 0 4px white' }}></div>
                                        )}
                                    </div>
                                </div>
                                <form onSubmit={handleSaleSubmit} className="premium-form">
                                    {/* Section 1: Staff & Transaction Metadata */}
                                    <div className="form-section-label">Staff & Transaction</div>
                                    <div className="form-row">
                                        <div className="form-group relative">
                                            <label>Staff Name <span className="auto-label">(Lookup or Edit)</span></label>
                                            <div className="search-box">
                                                <User size={16} className="search-icon" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={staffSearchTerm}
                                                    onChange={e => {
                                                        setStaffSearchTerm(e.target.value);
                                                        setShowStaffResults(true);
                                                        setFormData({ ...formData, staff_name: e.target.value });
                                                    }}
                                                    onFocus={() => setShowStaffResults(true)}
                                                    placeholder="Search staff name..."
                                                />
                                            </div>
                                            {showStaffResults && staffSearchTerm && (
                                                <div className="lookup-results absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {filteredStaff.length > 0 ? (
                                                        filteredStaff.map(s => (
                                                            <div
                                                                key={s.id}
                                                                className="lookup-item p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                                onClick={() => handleStaffSelect(s)}
                                                            >
                                                                <div className="font-bold text-sm text-slate-800">{s.username}</div>
                                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                                    ID: EMP-{s.id}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-sm text-slate-400 italic">No staff found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label>Staff ID <span className="auto-label">(Auto)</span></label>
                                            <input type="text" value={formData.staff_unique_id} onChange={e => setFormData({ ...formData, staff_unique_id: e.target.value })} placeholder="EMP-001" className="bg-slate-50" />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Sale ID <span className="auto-label">(Auto-gen)</span></label>
                                            <input type="text" readOnly value={formData.sale_id} className="bg-slate-50 cursor-not-allowed font-mono text-xs" />
                                        </div>
                                    </div>

                                    <div className="divider-line"></div>

                                    {/* Section 1.5: Customer Information */}
                                    <div className="form-section-label">Customer Information</div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Customer Name</label>
                                            <input type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                                        </div>
                                        <div className="form-group">
                                            <label>Customer Phone</label>
                                            <input type="text" value={formData.customer_phone} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} placeholder="e.g. 9876543210" />
                                        </div>
                                    </div>

                                    <div className="divider-line"></div>

                                    <div className="dynamic-section-wrapper" style={{ minHeight: '200px' }}>
                                        {isBuildMode ? (
                                            <div className="pc-build-section animate-in" style={{ border: '2px solid #e0e7ff', padding: '20px', borderRadius: '20px', background: '#fcfdff', marginBottom: '24px' }}>
                                                <div className="form-section-label" style={{ color: '#8b5cf6', marginTop: 0 }}>Build Components & Pricing</div>
                                                <div className="form-group mb-6">
                                                    <label>Custom PC Build Title</label>
                                                    <input
                                                        type="text"
                                                        value={buildTitle}
                                                        onChange={e => setBuildTitle(e.target.value)}
                                                        placeholder="e.g. Extreme 4K Gaming Rig"
                                                        style={{ borderLeft: '4px solid #8b5cf6', fontSize: '1rem', fontWeight: 700 }}
                                                    />
                                                </div>
                                                <div className="components-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                                    {buildComponents.map((comp, idx) => (
                                                        <div key={comp.id} className="component-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #eef2f6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f5f3ff', color: '#8b5cf6', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{idx + 1}</div>
                                                            <input
                                                                type="text"
                                                                placeholder="Component Name..."
                                                                style={{ flex: 2, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                                                                value={comp.name}
                                                                onChange={e => updateComponent(comp.id, 'name', e.target.value)}
                                                            />
                                                            <div className="input-with-symbol" style={{ flex: 1 }}>
                                                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>₹</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Price"
                                                                    style={{ width: '100%', padding: '10px 10px 10px 28px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700 }}
                                                                    value={comp.price}
                                                                    onChange={e => updateComponent(comp.id, 'price', e.target.value)}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeComponentRow(comp.id)}
                                                                style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addComponentRow}
                                                    style={{ width: '100%', padding: '12px', background: 'white', border: '2px dashed #e2e8f0', borderRadius: '14px', color: '#4a6cf7', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#4a6cf7'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                                >
                                                    <PlusCircle size={16} /> Add Another Component
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="standard-section animate-in">
                                                {/* Section 2: Product & Category */}
                                                <div className="form-section-label" style={{ marginTop: 0 }}>Product Selection</div>
                                                <div className="form-row">
                                                    <div className="form-group relative">
                                                        <label>Product Lookup</label>
                                                        <div className="search-box">
                                                            <Search size={16} className="search-icon" />
                                                            <input
                                                                type="text"
                                                                value={searchTerm}
                                                                onChange={e => {
                                                                    setSearchTerm(e.target.value);
                                                                    setShowResults(true);
                                                                }}
                                                                onFocus={() => setShowResults(true)}
                                                                placeholder="Search product..."
                                                            />
                                                        </div>
                                                        {((showResults && searchTerm) || (showResults && formData.category && !formData.product_name)) && (
                                                            <div className="lookup-results absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                                {filteredProducts.length > 0 ? (
                                                                    filteredProducts.slice(0, 12).map(p => (
                                                                        <div
                                                                            key={p.id}
                                                                            className="lookup-item p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                                            onClick={() => handleProductSelect(p)}
                                                                        >
                                                                            <div className="font-bold text-sm text-slate-800">{p.name}</div>
                                                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                                                {p.sku ? `${p.sku} • ` : ''}{p.category}{p.sub_category ? ` / ${p.sub_category}` : ''}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-3 text-sm text-slate-400 italic">
                                                                        {formData.category ? `No products in "${formData.category}"` : 'No products found'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Product ID <span className="auto-label">(Auto)</span></label>
                                                        <input type="text" readOnly value={formData.product_id ? `ID: ${formData.product_id}` : ''} className="bg-slate-50 cursor-not-allowed" placeholder="Not Selected" />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Category <span className="auto-label">(from products)</span></label>
                                                        <select
                                                            value={formData.category}
                                                            onChange={e => {
                                                                setFormData({ ...formData, category: e.target.value, sub_category: '', product_id: '', product_name: '' });
                                                                setSearchTerm('');
                                                                setShowResults(true);
                                                            }}
                                                        >
                                                            <option value="">-- Select Category --</option>
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Sub Category <span className="auto-label">(from products)</span></label>
                                                        <select
                                                            value={formData.sub_category}
                                                            onChange={e => {
                                                                setFormData({ ...formData, sub_category: e.target.value, product_id: '', product_name: '' });
                                                                setSearchTerm('');
                                                                setShowResults(true);
                                                            }}
                                                            disabled={!formData.category}
                                                        >
                                                            <option value="">{formData.category ? '-- Select Sub Category --' : '-- Select Category First --'}</option>
                                                            {subCategoriesForSelected.map(sub => (
                                                                <option key={sub.id} value={sub.name}>{sub.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="divider-line"></div>

                                    {/* Section 3: Financials & Quantity */}
                                    <div className="form-section-label">Pricing & Transaction</div>
                                    {!isBuildMode && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Price per Unit</label>
                                                <div className="input-with-symbol">
                                                    <span>₹</span>
                                                    <input type="number" required step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Quantity</label>
                                                <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                                            </div>
                                        </div>
                                    )}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Offline Discount (₹)</label>
                                            <div className="input-with-symbol discount-input">
                                                <span>₹</span>
                                                <input type="number" min="0" value={formData.offline_discount} onChange={e => setFormData({ ...formData, offline_discount: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Payment Method</label>
                                            <select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                                <option>UPI</option>
                                                <option>Cash</option>
                                                <option>Card</option>
                                                <option>Finance</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="divider-line"></div>

                                    {/* Section 4: Notes */}
                                    <div className="form-section-label">Additional Details</div>
                                    <div className="form-group mb-6">
                                        <label>Product Notes / Information</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Enter any additional details, warranty info, or customer requests..."
                                            rows={2}
                                        ></textarea>
                                    </div>

                                    <div className="form-total-breakdown">
                                        <div className="math-row">
                                            {isBuildMode ? (
                                                <span>Sum of {buildComponents.length} components - ₹{formData.offline_discount} discount</span>
                                            ) : (
                                                <span>(₹{parseFloat(formData.price) || 0} - ₹{parseFloat(formData.offline_discount) || 0}) × {formData.quantity}</span>
                                            )}
                                        </div>
                                        <div className="total-row">
                                            <p>Total Amount (Inc. Discount)</p>
                                            <h2>₹{(isBuildMode
                                                ? (calculateBuildTotal() - (parseFloat(formData.offline_discount) || 0))
                                                : (formData.quantity * ((parseFloat(formData.price) || 0) - (parseFloat(formData.offline_discount) || 0)))
                                            ).toLocaleString()}</h2>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="submit" disabled={submitting} className="submit-btn shadow-blue-btn flex-1" style={{ opacity: submitting ? 0.7 : 1 }}>
                                            {submitting ? 'Processing...' : 'Complete Transaction'}
                                        </button>
                                        <button type="button" onClick={handleFormReset} className="reset-btn text-slate-400 hover:text-slate-600 transition-colors">
                                            <RotateCcw size={20} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'returns' && (
                        <div className="dashboard-view animate-in" style={{ padding: '32px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Process Return</h2>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>Authorize a refund and track all return history</p>
                            </div>

                            {/* Return Form */}
                            <div className="returns-form-layout">
                                <div className="premium-form-card" style={{ padding: '24px' }}>
                                    <div className="form-head">
                                        <RotateCcw size={22} className="text-orange" />
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>New Return</h3>
                                    </div>
                                    {message && (
                                        <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '0.8rem', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
                                            {message.text}
                                        </div>
                                    )}
                                    <form onSubmit={handleReturn} className="premium-form">
                                        <div className="form-group">
                                            <label>Sale ID</label>
                                            <input type="text" value={returnId} onChange={e => setReturnId(e.target.value)} placeholder="OFF-20260318-0001" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Quantity to Return</label>
                                            <input type="number" value={returnQty} onChange={e => setReturnQty(e.target.value)} min="1" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Reason for Return</label>
                                            <textarea placeholder="e.g. Defective item, Wrong product..." rows={3}></textarea>
                                        </div>
                                        <button type="submit" className="submit-btn orange shadow-orange-btn" style={{ width: '100%' }}>Authorize Refund</button>
                                    </form>
                                </div>

                                {/* Returns Analysis Cards */}
                                <div className="returns-stats-grid">
                                    <div className="metrics-card" style={{ padding: '20px' }}>
                                        <div className="metrics-info">
                                            <h3>Total Returns</h3>
                                            <h2>{returnsHistory.length}</h2>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>All time</p>
                                        </div>
                                    </div>
                                    <div className="metrics-card" style={{ padding: '20px' }}>
                                        <div className="metrics-info">
                                            <h3>Total Refunded</h3>
                                            <h2 style={{ color: '#ef4444' }}>₹{returnsHistory.reduce((s, r) => s + (r.refund_amount || 0), 0).toLocaleString()}</h2>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>All time</p>
                                        </div>
                                    </div>
                                    <div className="metrics-card" style={{ padding: '20px' }}>
                                        <div className="metrics-info">
                                            <h3>Units Returned</h3>
                                            <h2>{returnsHistory.reduce((s, r) => s + (r.quantity_returned || 0), 0)}</h2>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>All time</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Returns History Table */}
                            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Returns History</h3>
                                    <div className="search-box" style={{ maxWidth: '280px', flex: 1 }}>
                                        <Search size={14} className="search-icon" style={{ left: '10px' }} />
                                        <input
                                            type="text"
                                            placeholder="Search product or sale ID..."
                                            style={{ padding: '10px 10px 10px 32px', fontSize: '0.8rem' }}
                                            value={returnsFilter}
                                            onChange={e => setReturnsFilter(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sale ID</th>
                                                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                                                <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                                                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Refunded</th>
                                                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</th>
                                                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                                <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnsHistory
                                                .filter(r =>
                                                    !returnsFilter ||
                                                    r.product_name?.toLowerCase().includes(returnsFilter.toLowerCase()) ||
                                                    r.sale_id?.toLowerCase().includes(returnsFilter.toLowerCase())
                                                )
                                                .map((r, i) => (
                                                    <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? 'white' : '#fafbff', transition: 'background 0.15s' }}>
                                                        <td style={{ padding: '12px', fontWeight: 700, color: '#4a6cf7', fontFamily: 'monospace' }}>{r.sale_id}</td>
                                                        <td style={{ padding: '12px', color: '#1e293b', fontWeight: 600 }}>{r.product_name}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>{r.quantity_returned}</span></td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>₹{r.refund_amount?.toLocaleString()}</td>
                                                        <td style={{ padding: '12px', color: '#64748b' }}>{r.return_reason}</td>
                                                        <td style={{ padding: '12px', color: '#64748b' }}>{r.return_date || r.date}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => handleDownloadReturnReceipt(r)}
                                                                className="hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
                                                                style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                                title="Download Receipt"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {returnsHistory.length === 0 && (
                                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No returns recorded yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="form-view animate-in">
                            <div className="premium-form-card centered">
                                <Upload size={64} className={`mx-auto mb-4 ${uploading ? 'animate-bounce text-blue' : 'text-blue'}`} />
                                <h3>Bulk CSV Upload</h3>
                                <p className="text-center text-slate-500 mb-8">Export your offline inventory and sales reports directly.</p>
                                <div className={`dropzone ${selectedFile ? 'has-file' : ''}`}>
                                    <input
                                        type="file"
                                        id="bulk-csv"
                                        className="hidden-input"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="bulk-csv" className="drop-label">
                                        {selectedFile ? (
                                            <span className="file-name text-blue font-bold">{selectedFile.name}</span>
                                        ) : (
                                            <>Drag & Drop files here or <span>Browse</span></>
                                        )}
                                    </label>
                                </div>

                                {selectedFile && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="submit-btn shadow-blue-btn mt-6"
                                    >
                                        {uploading ? 'Uploading...' : 'Start Upload'}
                                    </button>
                                )}

                                <a href="/offline_sales_sample.csv" download className="sample-link mt-6">Download Sample CSV</a>

                                <div className="csv-help mt-8 text-left p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-sm mb-2">Required Columns:</h4>
                                    <ul className="text-xs text-slate-600 grid grid-cols-2 gap-2">
                                        <li>• Sale ID (Mandatory)</li>
                                        <li>• Staff ID (Mandatory)</li>
                                        <li>• Staff Name</li>
                                        <li>• Product ID</li>
                                        <li>• Product Name</li>
                                        <li>• Category</li>
                                        <li>• Sub Category</li>
                                        <li>• Quantity</li>
                                        <li>• Price</li>
                                        <li>• Cost Price</li>
                                        <li>• Offline Discount</li>
                                        <li>• Payment Method</li>
                                        <li>• Date (YYYY-MM-DD)</li>
                                        <li>• Customer Name</li>
                                        <li>• Customer Phone</li>
                                        <li>• Notes</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="dashboard-view animate-in" style={{ padding: '32px', overflowY: 'auto' }}>
                            {/* History Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Sales History</h2>
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
                                        Detailed list of all your offline sales transactions
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setShowAnalysis(!showAnalysis)}
                                        style={{
                                            background: showAnalysis ? '#4a6cf7' : 'white',
                                            color: showAnalysis ? 'white' : '#4a6cf7',
                                            border: '1.5px solid #4a6cf7',
                                            borderRadius: '12px',
                                            padding: '8px 16px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <BarChart3 size={16} /> {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
                                    </button>
                                    <div style={{ background: '#f0f4ff', border: '1.5px solid #e0e7ff', borderRadius: '12px', padding: '8px 20px', fontWeight: 800, color: '#4a6cf7', fontSize: '0.85rem' }}>
                                        ₹{filteredMetrics.revenue.toLocaleString()} Total
                                    </div>
                                    <div style={{ background: '#f0fdf4', border: '1.5px solid #dcfce7', borderRadius: '12px', padding: '8px 20px', fontWeight: 800, color: '#16a34a', fontSize: '0.85rem' }}>
                                        {filteredHistory.length} Matches
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Dashboard (Conditional) */}
                            {showAnalysis && (
                                <div className="animate-in" style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div className="metrics-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #4a6cf7 0%, #3352d5 100%)', color: 'white' }}>
                                        <div className="metrics-info">
                                            <h3 style={{ color: 'rgba(255,255,255,0.7)' }}>Net Revenue</h3>
                                            <h2 style={{ margin: '5px 0' }}>₹{filteredMetrics.revenue.toLocaleString()}</h2>
                                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>Based on applied filters</p>
                                        </div>
                                    </div>
                                    <div className="metrics-card" style={{ padding: '20px' }}>
                                        <div className="metrics-info">
                                            <h3>Best Selling Product</h3>
                                            <h2 style={{ fontSize: '1.2rem', margin: '10px 0' }}>{filteredMetrics.topProduct}</h2>
                                            <div className="progress-mini"><div className="progress-bar blue" style={{ width: '100%' }}></div></div>
                                        </div>
                                    </div>
                                    <div className="metrics-card" style={{ padding: '20px' }}>
                                        <div className="metrics-info">
                                            <h3>Avg. Transaction</h3>
                                            <h2>₹{Math.round(filteredMetrics.avgValue).toLocaleString()}</h2>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{filteredMetrics.count} Sales</p>
                                        </div>
                                    </div>
                                    <div className="metrics-card" style={{ padding: '20px' }}>
                                        <div className="metrics-info">
                                            <h3>Total Discounts</h3>
                                            <h2 style={{ color: '#ef4444' }}>₹{filteredMetrics.discount.toLocaleString()}</h2>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Savings given</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Advanced Filters */}
                            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ fontSize: '0.65rem', marginBottom: '8px', display: 'block' }}>Start Date</label>
                                    <input
                                        type="date"
                                        style={{ padding: '10px 14px', fontSize: '0.8rem' }}
                                        value={historyFilters.startDate}
                                        onChange={e => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1.5, minWidth: '180px' }}>
                                    <label style={{ fontSize: '0.65rem', marginBottom: '8px', display: 'block' }}>Search Buyer</label>
                                    <div className="search-box">
                                        <Users size={14} className="search-icon" style={{ left: '10px' }} />
                                        <input
                                            type="text"
                                            placeholder="Buyer name..."
                                            style={{ padding: '10px 10px 10px 32px', fontSize: '0.8rem' }}
                                            value={historyFilters.buyerName}
                                            onChange={e => setHistoryFilters({ ...historyFilters, buyerName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1.5, minWidth: '180px' }}>
                                    <label style={{ fontSize: '0.65rem', marginBottom: '8px', display: 'block' }}>Search Staff</label>
                                    <div className="search-box">
                                        <User size={14} className="search-icon" style={{ left: '10px' }} />
                                        <input
                                            type="text"
                                            placeholder="Staff name..."
                                            style={{ padding: '10px 10px 10px 32px', fontSize: '0.8rem' }}
                                            value={historyFilters.staffName}
                                            onChange={e => setHistoryFilters({ ...historyFilters, staffName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1.5, minWidth: '180px' }}>
                                    <label style={{ fontSize: '0.65rem', marginBottom: '8px', display: 'block' }}>Search Product</label>
                                    <div className="search-box">
                                        <Search size={14} className="search-icon" style={{ left: '10px' }} />
                                        <input
                                            type="text"
                                            placeholder="Product name..."
                                            style={{ padding: '10px 10px 10px 32px', fontSize: '0.8rem' }}
                                            value={historyFilters.productName}
                                            onChange={e => setHistoryFilters({ ...historyFilters, productName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '120px' }}>
                                    <label style={{ fontSize: '0.65rem', marginBottom: '8px', display: 'block' }}>Method</label>
                                    <select
                                        style={{ padding: '10px 14px', fontSize: '0.8rem' }}
                                        value={historyFilters.paymentMethod}
                                        onChange={e => setHistoryFilters({ ...historyFilters, paymentMethod: e.target.value })}
                                    >
                                        <option value="">All Methods</option>
                                        <option>UPI</option>
                                        <option>Cash</option>
                                        <option>Card</option>
                                        <option>Finance</option>
                                    </select>
                                </div>
                                <div style={{ paddingBottom: '2px' }}>
                                    <button
                                        onClick={() => setHistoryFilters({ startDate: '', buyerName: '', staffName: '', productName: '', paymentMethod: '' })}
                                        style={{
                                            background: '#f1f5f9',
                                            color: '#64748b',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '10px 15px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <RotateCcw size={14} /> Reset
                                    </button>
                                </div>
                            </div>

                            {/* History Table */}
                            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                                <div className="table-container">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Sale ID</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Date & Time</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em' }}>Staff</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em' }}>Product</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em' }}>Qty</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Amount</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em' }}>Method</th>
                                                <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.07em' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.length > 0 ? filteredHistory.slice(0, visibleHistoryCount).map((s, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                >
                                                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#4a6cf7', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {s.sale_id}
                                                        {!!s.is_returned && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                                                                <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 900, boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}>R</span>
                                                                <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.02em' }}>RETURNED</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>{s.date}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '0.70rem' }}>{s.created_at || '—'}</div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.staff}</div>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#1e293b', maxWidth: '180px' }}>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.product}</div>
                                                        {s.category && <div style={{ fontSize: '0.65rem', color: '#4a6cf7', fontWeight: 700 }}>{s.category}</div>}
                                                    </td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{s.quantity}</td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>₹{(s.amount || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                        <span style={{
                                                            background: s.method === 'UPI' ? '#f0fdf4' : s.method === 'Cash' ? '#fefce8' : s.method === 'Card' ? '#eff6ff' : '#fdf4ff',
                                                            color: s.method === 'UPI' ? '#16a34a' : s.method === 'Cash' ? '#ca8a04' : s.method === 'Card' ? '#2563eb' : '#7c3aed',
                                                            padding: '3px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800
                                                        }}>{s.method}</span>
                                                    </td>
                                                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => { setSelectedSale(s); setIsModalOpen(true); }}
                                                                className="hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                                style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {!s.is_returned && (
                                                                <button
                                                                    onClick={() => { setReturnId(s.sale_id); setReturnQty(s.quantity); setActiveTab('returns'); }}
                                                                    className="hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                                                    style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                                    title="Return Products"
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDownloadReceipt(s)}
                                                                className="hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                                                                style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                                title="Download Receipt"
                                                            >
                                                                    <Download size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                                        {history.length === 0 ? "No sales recorded yet. Start by adding a sale in the Sales Entry tab." : "No sales match your search filters."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredHistory.length > visibleHistoryCount && (
                                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                        <button
                                            onClick={() => setVisibleHistoryCount(prev => prev + 50)}
                                            style={{
                                                padding: '8px 24px',
                                                background: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                color: '#4a6cf7',
                                                fontWeight: 800,
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#4a6cf7'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                        >
                                            Load More Transactions ({filteredHistory.length - visibleHistoryCount} remaining)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="inventory-view animate-in p-6">
                            <div className="section-header mb-6">
                                <h1 className="text-2xl font-bold text-slate-800">Inventory Status</h1>
                                <p className="text-slate-500">Live monitoring of product stock levels</p>
                            </div>

                            <div className="inventory-grid">
                                <div className="inventory-card full-width">
                                    <div className="table-container shadow-sm rounded-xl overflow-hidden border border-slate-200">
                                        <table className="inventory-table">
                                            <thead>
                                                <tr>
                                                    <th>Product Name</th>
                                                    <th>Category</th>
                                                    <th>Current Stock</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...products]
                                                    .sort((a, b) => {
                                                        const aLimited = a.stock < 15;
                                                        const bLimited = b.stock < 15;
                                                        if (aLimited && !bLimited) return -1;
                                                        if (!aLimited && bLimited) return 1;
                                                        return a.stock - b.stock; // Secondary sort by actual stock level
                                                    })
                                                    .map((p, i) => (
                                                        <tr key={i}>
                                                            <td className="font-bold text-slate-700">{p.name}</td>
                                                            <td><span className="cat-tag">{p.category}</span></td>
                                                            <td className="font-mono">
                                                                <span style={{ fontWeight: 700 }}>{p.stock}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${p.stock < 5 ? 'critical' : p.stock < 15 ? 'warning' : 'healthy'}`}>
                                                                    {p.stock < 5 ? 'Low Stock' : p.stock < 15 ? 'Limited' : 'In Stock'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-view animate-in" style={{ height: 'calc(100vh - 80px)' }}>
                            <OrderList />
                        </div>
                    )}

                    {activeTab === 'tickets' && (
                        <div className="tickets-view animate-in" style={{ height: 'calc(100vh - 80px)' }}>
                            <TicketManager />
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="profile-view animate-in p-6">
                            <div className="profile-container-inner">
                                <div className="profile-header-premium">
                                    <div className="profile-cover"></div>
                                    <div className="profile-main-info">
                                        <div className="avatar-wrapper">
                                            <img src={profile?.profile_pic || "https://i.pravatar.cc/150?img=12"} alt="Profile" className="profile-large-avatar" />
                                            <input
                                                type="file"
                                                id="profile-photo-input"
                                                hidden
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                            />
                                            {profile?.profile_pic ? (
                                                <button
                                                    type="button"
                                                    className="edit-avatar-btn"
                                                    title="Remove photo"
                                                    style={{ background: '#ef4444' }}
                                                    onClick={async () => {
                                                        const newProfile = { ...profile, profile_pic: '' };
                                                        setProfile(newProfile);
                                                        await api.patch('/auth/profile', newProfile);
                                                        setMessage({ type: 'success', text: 'Photo removed' });
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="edit-avatar-btn"
                                                    title="Upload photo"
                                                    onClick={() => document.getElementById('profile-photo-input').click()}
                                                >
                                                    <PlusCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-info">
                                            <h1>{profile?.username}</h1>
                                            <p style={{ opacity: 0.8 }}>{user?.role === 'admin' ? 'Administrator' : 'Sales Professional'}</p>
                                            {profile?.id && <p style={{ fontSize: '0.8rem', opacity: 0.7, fontFamily: 'monospace', marginTop: '4px' }}>EMP-{profile.id}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-content-grid">
                                    <div className="profile-form-box">
                                        <div className="box-title">Edit Personal Details</div>
                                        {message && <div className={`message ${message.type}`} style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>{message.text}</div>}
                                        <form onSubmit={handleUpdateProfile} className="profile-form">
                                            {/* Read-only Staff ID */}
                                            <div className="form-group">
                                                <label>Staff ID <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4a6cf7', padding: '2px 8px', borderRadius: '20px', marginLeft: '6px', fontWeight: 700 }}>Read Only</span></label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={profile?.id ? `EMP-${profile.id}` : '—'}
                                                    style={{ background: '#f8fafc', cursor: 'not-allowed', color: '#64748b', fontFamily: 'monospace', fontWeight: 700 }}
                                                />
                                            </div>
                                            <div className="form-group-row">
                                                <div className="form-group">
                                                    <label>Username</label>
                                                    <input
                                                        type="text"
                                                        value={profile?.username || ''}
                                                        onChange={e => setProfile({ ...profile, username: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Email Address</label>
                                                    <input
                                                        type="email"
                                                        value={profile?.email || ''}
                                                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Short Bio</label>
                                                <textarea
                                                    rows="4"
                                                    placeholder="Tell us about yourself..."
                                                    value={profile?.bio || ''}
                                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <button type="submit" className="save-profile-btn" disabled={submitting}>
                                                {submitting ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </form>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            {/* Details Modal */}
            {isModalOpen && selectedSale && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ background: '#f8fafc', padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Sale Details</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{selectedSale?.sale_id}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'all 0.2s', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 800 }}>Transaction Info</h4>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Date</span><strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{selectedSale?.created_at || selectedSale?.date || 'N/A'}</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Staff</span><strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{selectedSale?.staff || 'N/A'}</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Method</span><strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{selectedSale?.method || 'N/A'}</strong></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 800 }}>Customer Info</h4>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Customer Name</span><strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{selectedSale?.customer_name || 'Not Provided'}</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.85rem' }}>Phone Number</span><strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{selectedSale?.customer_phone || 'Not Provided'}</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 800 }}>Product Summary</h4>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Item</th>
                                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Qty</th>
                                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '16px', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{selectedSale?.product}<br /><span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{selectedSale?.category || ''}</span></td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{selectedSale?.quantity}</td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>₹{(selectedSale?.price || (selectedSale?.amount / selectedSale?.quantity) || 0).toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {selectedSale?.notes && (
                                <div style={{ marginBottom: '32px' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 800 }}>Notes</h4>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', color: '#334155', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                        {selectedSale?.notes}
                                    </div>
                                </div>
                            )}

                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ display: 'block', color: '#16a34a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: '4px' }}>Total Amount</span>
                                    {selectedSale?.discount > 0 && <span style={{ color: '#047857', fontSize: '0.85rem' }}>Includes ₹{(selectedSale?.discount || 0).toLocaleString()} discount</span>}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>
                                    ₹{(selectedSale?.amount || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#475569', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>Close</button>
                            <button onClick={() => handleDownloadReceipt(selectedSale)} style={{ padding: '12px 24px', background: '#4a6cf7', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(74,108,247,0.3)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <Download size={18} /> Download Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Styled CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

                .staff-container {
                    display: flex;
                    height: 100vh;
                    background: #f4f6f9;
                    font-family: 'Poppins', sans-serif;
                    overflow: hidden;
                    color: #1e293b;
                }

                /* SIDEBAR */
                .staff-sidebar {
                    width: 260px;
                    background: white;
                    border-right: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    box-shadow: 10px 0 30px rgba(0,0,0,0.02);
                }

                .logo-section {
                    padding: 30px 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-icon {
                    width: 38px;
                    height: 38px;
                    background: #4a6cf7;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 20px;
                }

                .logo-section h2 {
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.5px;
                }

                .sidebar-nav {
                    padding: 10px 16px;
                    flex: 1;
                }

                .sidebar-nav ul {
                    list-style: none;
                }

                .sidebar-nav li {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px 20px;
                    margin-bottom: 6px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    color: #64748b;
                    font-weight: 500;
                }

                .sidebar-nav li:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                    transform: translateX(4px);
                }

                .sidebar-nav li.active {
                    background: #4a6cf7;
                    color: white;
                    box-shadow: 0 10px 20px rgba(74, 108, 247, 0.2);
                }

                .sidebar-footer {
                    padding: 24px;
                    border-top: 1px solid #f1f5f9;
                }

                .settings-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #64748b;
                    font-size: 0.9rem;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    color: #ef4444;
                    background: #fef2f2;
                }

                /* MAIN AREA */
                .staff-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .staff-header {
                    padding: 20px 40px;
                    background: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #e2e8f0;
                }

                .header-left h1 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: #0f172a;
                }

                .breadcrumb {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 2px;
                }

                .breadcrumb span {
                    color: #4a6cf7;
                    font-weight: 600;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 30px;
                }

                .header-icons {
                    display: flex;
                    gap: 10px;
                }

                .icon-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: 1px solid #f1f5f9;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: #fff;
                    color: #4a6cf7;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 12px;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 14px;
                    cursor: pointer;
                }

                .avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    object-fit: cover;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .user-role {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                /* CONTENT SCROLLABLE */
                .content-scrollable {
                    flex: 1;
                    padding: 30px 40px;
                    overflow-y: auto;
                }

                .metrics-summary-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .summary-metric-card {
                    background: white;
                    padding: 16px;
                    border-radius: 18px;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                    transition: transform 0.2s;
                }
                .summary-metric-card:hover { transform: translateY(-2px); border-color: #4a6cf7; }
                .metric-icon-bg {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .metric-details { display: flex; flex-direction: column; }
                .metric-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
                .metric-value { font-size: 1rem; font-weight: 800; color: #1e293b; }

                /* GRID BOXES */
                .stats-grid {
                    display: grid;
                    grid-template-columns: 2.2fr 1fr;
                    gap: 25px;
                }

                .grid-box {
                    background: white;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.03);
                }

                .box-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .box-header h3 {
                    font-size: 1rem;
                    font-weight: 700;
                }

                .chart-legend {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #94a3b8;
                }

                .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
                .dot.blue { background: #4a6cf7; }
                .dot.orange { background: #fb923c; }

                .chart-controls {
                    display: flex;
                    gap: 8px;
                    margin-left: 10px;
                }

                .chart-container { height: 300px; }
                .chart-container-sm { height: 200px; }

                .staff-list {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .staff-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 10px;
                    border-radius: 16px;
                    background: #f8fafc;
                    position: relative;
                }

                .staff-rank {
                    width: 24px;
                    height: 24px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #4a6cf7;
                    position: absolute;
                    left: -8px;
                    top: -8px;
                }

                .mini-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    object-fit: cover;
                }

                .staff-details {
                    flex: 1;
                }

                .staff-name {
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin: 0;
                }

                .staff-revenue {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #1e293b;
                    float: right;
                }

                /* TABLE */
                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th {
                    text-align: left;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    letter-spacing: 1px;
                    font-weight: 700;
                    padding: 15px 10px;
                    border-bottom: 1px solid #f1f5f9;
                }

                td {
                    padding: 15px 10px;
                    font-size: 0.85rem;
                    border-bottom: 1px solid #f8fafc;
                }

                .mono { font-family: monospace; font-size: 0.75rem; color: #94a3b8; }
                .bold { font-weight: 700; }

                /* ALERTS */
                .alert-item {
                    display: flex;
                    gap: 15px;
                    padding: 18px;
                    border-radius: 18px;
                    margin-bottom: 15px;
                }

                .alert-item.warn { background: #fffbeb; border: 1px solid #fde68a; }
                .alert-item.error { background: #fef2f2; border: 1px solid #fee2e2; }

                .alert-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .warn .alert-icon { background: #fbbf24; color: white; }
                .error .alert-icon { background: #ef4444; color: white; }

                .alert-text h4 { font-size: 0.85rem; font-weight: 700; color: #92400e; margin-bottom: 2px; }
                .warn .alert-text h4 { color: #92400e; }
                .error .alert-text h4 { color: #991b1b; }
                .alert-text p { font-size: 0.75rem; color: #64748b; font-weight: 500; }
                .red-bold { color: #ef4444; font-weight: 800; }

                /* BOTTOM CHARTS */
                .chart-container-row {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .mini-chart { width: 120px; height: 120px; }

                .chart-bars { flex: 1; }
                .mini-bar-row {
                    height: 8px;
                    background: #f1f5f9;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    position: relative;
                }

                .mini-bar-row .bar { height: 100%; border-radius: 10px; }
                .mini-bar-row .bar.blue { background: #4a6cf7; }
                .mini-bar-row .bar.orange { background: #fb923c; }
                .mini-bar-row .bar.red { background: #ef4444; }

                /* FORMS */
                .form-view {
                    display: flex;
                    justify-content: center;
                    padding: 20px 0;
                }

                .premium-form-card {
                    background: white;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 30px;
                    padding: 40px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.05);
                    border: 1px solid #f1f5f9;
                }

                .form-head {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 35px;
                }

                .form-head h3 { font-size: 1.25rem; font-weight: 800; }

                .premium-form {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .form-section-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #4a6cf7;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 12px;
                    margin-top: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .form-section-label::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #f1f5f9;
                }
                .auto-label {
                    font-size: 0.6rem;
                    color: #94a3b8;
                    font-weight: 500;
                    margin-left: 4px;
                }
                .divider-line {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 10px 0;
                }
                .form-total-breakdown {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px 0;
                    border: 1px solid #f1f5f9;
                }
                .math-row {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-bottom: 5px;
                    font-family: monospace;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .total-row p {
                    margin: 0;
                    font-weight: 600;
                    color: #1e293b;
                }
                .total-row h2 {
                    margin: 0;
                    color: #4a6cf7;
                    font-size: 1.5rem;
                    font-weight: 800;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .search-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .search-box .search-icon {
                    position: absolute;
                    left: 12px;
                    color: #94a3b8;
                }
                .search-box input {
                    padding-left: 36px !important; /* Changed from '! from base;' to '!important;' for valid CSS */
                }
                .lookup-results {
                    max-height: 250px;
                    overflow-y: auto;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                }
                .lookup-item:hover {
                    background: #f8fafc;
                }
                .discount-input input {
                    color: #ef4444;
                    font-weight: 700;
                }
                .total-preview {
                    display: flex;
                    flex-direction: column;
                }

                label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                input, select, textarea {
                    padding: 14px 20px;
                    border-radius: 14px;
                    border: 1.5px solid #f1f5f9;
                    background: #f8fafc;
                    font-family: inherit;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    color: #1e293b;
                    width: 100%;
                    box-sizing: border-box;
                    display: block;
                }

                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #4a6cf7;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.05);
                }

                .input-with-symbol {
                    position: relative;
                    display: block;
                }

                .input-with-symbol span {
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-weight: 700;
                    z-index: 1;
                    pointer-events: none;
                }

                .input-with-symbol input {
                    padding-left: 35px;
                    width: 100%;
                    box-sizing: border-box;
                    display: block;
                }

                .form-total {
                    background: #f1f5f9;
                    border-radius: 20px;
                    padding: 20px;
                    margin: 10px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .form-total p {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                }

                .form-total h2 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #4a6cf7;
                }

                .flex { display: flex; }
                .gap-4 { gap: 16px; }
                .flex-1 { flex: 1; }
                .reset-btn {
                    background: #f8fafc;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 14px;
                    padding: 0 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .reset-btn:hover {
                    background: #f1f5f9;
                    border-color: #e2e8f0;
                    color: #ef4444 !important;
                }

                .submit-btn {
                    padding: 16px;
                    border-radius: 16px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    font-weight: 800;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(74, 108, 247, 0.3);
                }

                .submit-btn.orange { background: #fb923c; }
                .submit-btn.orange:hover { box-shadow: 0 15px 30px rgba(251, 146, 60, 0.3); }

                /* HELPERS */
                .text-blue { color: #4a6cf7; }
                .text-orange { color: #fb923c; }
                .centered { text-align: center; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .mb-4 { margin-bottom: 20px; }
                .mb-8 { margin-bottom: 30px; }

                .dropzone {
                    border: 3px dashed #e2e8f0;
                    border-radius: 24px;
                    padding: 60px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .dropzone:hover { border-color: #4a6cf7; background: #f8fafc; }

                .drop-label { font-size: 0.9rem; color: #94a3b8; cursor: pointer; }
                .drop-label span { color: #4a6cf7; font-weight: 700; text-decoration: underline; }

                .sample-link {
                    display: block;
                    font-size: 0.85rem;
                    color: #64748b;
                    text-decoration: underline;
                    font-weight: 600;
                }

                /* ANIMATION */
                .animate-in {
                    animation: fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }

                /* Leaderboard & Alerts */
                .rank-gold { background: #ffd700; color: #856404; font-weight: 800; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
                .rank-silver { background: #c0c0c0; color: #4b4b4b; font-weight: 800; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
                .rank-bronze { background: #cd7f32; color: #5d3a1a; font-weight: 800; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
                .staff-score { font-weight: 800; color: #4a6cf7; font-size: 0.85rem; }
                
                .alert-list { padding: 10px 0; }
                .alert-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: #fff1f2; margin-bottom: 12px; border: 1px solid #ffe4e6; transition: 0.2s; }
                .alert-item:hover { transform: translateX(5px); background: #fee2e2; }
                .p-icon { font-size: 1.2rem; }
                .p-info { flex: 1; }
                .p-name { font-weight: 700; font-size: 0.85rem; margin: 0; color: #1e293b; }
                .p-stock { font-size: 0.7rem; color: #e11d48; font-weight: 600; }
                .p-status.urgent { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; background: #e11d48; color: white; padding: 2px 6px; border-radius: 4px; }
                
                .empty-state-success { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #16a34a; gap: 12px; text-align: center; }
                .empty-state-success p { font-weight: 600; font-size: 0.9rem; margin: 0; }
                
                .view-all-link { width: 100%; padding: 10px; background: transparent; border: 1px dashed #cbd5e1; border-radius: 10px; color: #64748b; font-size: 0.8rem; font-weight: 600; cursor: pointer; margin-top: 10px; transition: 0.2s; }
                .view-all-link:hover { background: #f8fafc; color: #4a6cf7; border-color: #4a6cf7; }
                
                /* Inventory View */
                .inventory-table { width: 100%; border-collapse: collapse; }
                .inventory-table th { text-align: left; padding: 15px 20px; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; }
                .inventory-table td { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                .cat-tag { background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
                
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .status-badge.healthy { background: #f0fdf4; color: #16a34a; }
                .status-badge.warning { background: #fffbeb; color: #d97706; }
                .status-badge.critical { background: #fef2f2; color: #dc2626; border: 1.5px solid #fee2e2; }

                /* Profile View */
                .profile-container-inner { max-width: 900px; margin: 0 auto; }
                .profile-header-premium { position: relative; background: white; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 30px; border: 1px solid #f1f5f9; }
                .profile-cover { height: 160px; background: linear-gradient(135deg, #4a6cf7 0%, #7c3aed 100%); position: relative; }
                .profile-cover::after { content: ""; position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.1; }
                .profile-main-info { padding: 0 40px 30px; display: flex; align-items: flex-end; gap: 30px; margin-top: -60px; position: relative; z-index: 2; }
                .avatar-wrapper { position: relative; }
                .profile-large-avatar { width: 140px; height: 140px; border-radius: 35px; border: 6px solid white; object-fit: cover; box-shadow: 0 15px 35px rgba(0,0,0,0.1); background: white; }
                .edit-avatar-btn { position: absolute; bottom: 5px; right: 5px; width: 36px; height: 36px; background: #4a6cf7; border: 4px solid white; border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
                .edit-avatar-btn:hover { transform: scale(1.1); }
                .profile-main-info h1 { margin: 0; font-size: 2rem; font-weight: 800; color: #1e293b; letter-spacing: -1px; }
                .profile-main-info p { margin: 5px 0 0; color: #64748b; font-weight: 600; font-size: 1rem; }
                
                .profile-content-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 30px; }
                .profile-form-box, .profile-stats-box { background: white; border-radius: 25px; padding: 30px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
                .box-title { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }
                .box-title::before { content: ""; width: 4px; height: 18px; background: #4a6cf7; border-radius: 10px; }
                
                .profile-form { display: flex; flex-direction: column; gap: 20px; }
                .form-group-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .save-profile-btn { margin-top: 10px; background: #4a6cf7; color: white; border: none; padding: 15px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .save-profile-btn:hover { background: #3b5bdb; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(74, 108, 247, 0.2); }
                .save-profile-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
                
                .mini-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
                .m-stat { background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; text-align: center; transition: 0.3s; }
                .m-stat:hover { background: #f1f5f9; transform: translateY(-3px); }
                .m-label { display: block; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
                .m-value { font-size: 1.2rem; font-weight: 800; color: #1e293b; }
                
                .preview-label { font-size: 0.75rem; color: #94a3b8; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; }
                .preview-content { background: #fdf4ff; color: #7c3aed; padding: 15px; border-radius: 15px; font-size: 0.85rem; line-height: 1.6; font-style: italic; border: 1px dashed #e9d5ff; }

                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

                /* MOBILE RESPONSIVE OVERRIDES */
                @media (max-width: 1024px) {
                    .staff-sidebar {
                        position: fixed;
                        left: -280px;
                        top: 0;
                        bottom: 0;
                        z-index: 1000;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 20px 0 50px rgba(0,0,0,0.1);
                    }

                    .staff-sidebar.open {
                        left: 0;
                    }

                    .staff-main {
                        margin-left: 0;
                        width: 100%;
                    }

                    .staff-header {
                        padding: 15px 20px;
                    }

                    .mobile-menu-toggle {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 40px;
                        height: 40px;
                        background: #f1f5f9;
                        border: none;
                        border-radius: 10px;
                        margin-right: 15px;
                        color: #4a6cf7;
                    }

                    .metrics-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .chart-wide {
                        grid-column: span 1;
                    }

                    .profile-content-grid {
                        grid-template-columns: 1fr;
                    }

                    .profile-main-info {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        padding: 0 20px 30px;
                    }

                    .profile-large-avatar {
                        width: 120px;
                        height: 120px;
                    }

                    .form-group-row {
                        grid-template-columns: 1fr;
                    }

                    .returns-form-layout {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        margin-bottom: 24px;
                    }

                    .returns-stats-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 12px !important;
                    }

                    .profile-form-box {
                        padding: 20px;
                    }
                }

                @media (min-width: 1025px) {
                    .returns-form-layout {
                        display: grid;
                        grid-template-columns: 1fr 2fr;
                        gap: 24px;
                        margin-bottom: 32px;
                        align-items: start;
                    }

                    .returns-stats-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }
                }

                @media (min-width: 1025px) {
                    .mobile-menu-toggle {
                        display: none;
                    }
                }

                .mobile-menu-toggle {
                    display: none;
                }
            ` }} />
            <FloatingChatbot />
            
            {showSuccessPopup && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <CheckCircle2 size={20} />
                    <span style={{ fontWeight: 600 }}>Record Saved</span>
                    <button 
                        onClick={() => setShowSuccessPopup(false)}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'white', 
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            marginLeft: '4px',
                            opacity: 0.8
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default StaffPortal;
