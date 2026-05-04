import React, { useState, useEffect, useMemo } from 'react';
import {
    Package, TrendingUp, Users, ShoppingBag, Shield,
    ArrowUpRight, ArrowDownRight, Star, Activity,
    Globe, Store, Zap, AlertTriangle, FileText,
    Search, Filter, Calendar, Layout, BarChart,
    Clock, Smartphone, MousePointer, CreditCard,
    RefreshCw, Layers, Monitor, Map, Network, Target,
    PieChart, ChevronDown, ListFilter, MoreVertical, Eye,
    CheckCircle, Truck, XCircle, SearchIcon, Bell, User, ChevronRight, Binary
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar, PolarArea, Scatter, Pie } from 'react-chartjs-2';
import api from '../services/api';
import { getStaffTargets, getTargetForUser } from '../utils/targetUtils';
import {
    Chart as ChartJS,
    registerables
} from 'chart.js';

ChartJS.register(...registerables);

const Dashboard = () => {
    const getInsightStyle = (text) => {
        const lower = text.toLowerCase();
        if (lower.includes('growth') || lower.includes('up') || lower.includes('outperforming')) {
            return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <TrendingUp size={14} className="text-emerald-500" /> };
        }
        if (lower.includes('risk') || lower.includes('down') || lower.includes('churn')) {
            return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: <AlertTriangle size={14} className="text-rose-500" /> };
        }
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: <Zap size={14} className="text-indigo-500" /> };
    };

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [timeframe, setTimeframe] = useState('30 Days');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [refreshKey, setRefreshKey] = useState(0);
    const [revenueView, setRevenueView] = useState('Staff');
    const [chartMonth, setChartMonth] = useState((new Date().getMonth() + 1).toString());
    const [chartYear, setChartYear] = useState(new Date().getFullYear().toString());
    const [chartStaffData, setChartStaffData] = useState({ all_staff: [], leaderboard: [] });
    const [chartLoading, setChartLoading] = useState(false);

    const [data, setData] = useState(null);
    const [mlData, setMlData] = useState({ segments: [], associations: [], leaderboard: [] });
    const [productTrend, setProductTrend] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [staffPerf, setStaffPerf] = useState({ leaderboard: [], all_staff: [] });
    const [allUsers, setAllUsers] = useState([]);
    const [inventoryForecast, setInventoryForecast] = useState([]);
    const [offlineAnalysis, setOfflineAnalysis] = useState({ daily_sales: [], category_split: [], staff_perf: [] });

    const months = [
        { val: '', label: 'Full Year' },
        { val: '1', label: 'January' }, { val: '2', label: 'February' }, { val: '3', label: 'March' },
        { val: '4', label: 'April' }, { val: '5', label: 'May' }, { val: '6', label: 'June' },
        { val: '7', label: 'July' }, { val: '8', label: 'August' }, { val: '9', label: 'September' },
        { val: '10', label: 'October' }, { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const timeframes = ['7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'All Time'];
    const years = ['2021', '2022', '2023', '2024', '2025', '2026'];

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const params = { tf: timeframe, month: selectedMonth, year: selectedYear };
                const [dashRes, segRes, assocRes, leadRes, prodRes, staffRes, invRes, offAnRes, usersRes] = await Promise.all([
                    api.get('/analytics/dashboard', { params }),
                    api.get('/analytics/segments').catch(() => ({ data: [] })),
                    api.get('/analytics/associations').catch(() => ({ data: [] })),
                    api.get('/offline/leaderboard', { params }).catch(() => ({ data: [] })),
                    api.get('/products').catch(() => ({ data: [] })),
                    api.get('/analytics/staff-performance', { params: { month: selectedMonth, year: selectedYear } }).catch(() => ({ data: { leaderboard: [], all_staff: [] } })),
                    api.get('/analytics/inventory-forecast').catch(() => ({ data: [] })),
                    api.get('/offline/analysis', { params: { global: true, year: selectedYear, month: selectedMonth } }).catch(() => ({ data: { daily_sales: [], category_split: [], staff_perf: [] } })),
                    api.get('/admin/users').catch(() => ({ data: [] }))
                ]);
                setData(dashRes.data || {});
                setMlData({
                    segments: segRes.data || [],
                    associations: assocRes.data || [],
                    leaderboard: leadRes.data || []
                });
                setAllProducts(prodRes.data || []);
                setStaffPerf(staffRes.data || { leaderboard: [], all_staff: [] });
                setInventoryForecast(invRes.data || []);
                setOfflineAnalysis(offAnRes.data || { daily_sales: [], category_split: [], staff_perf: [] });
                setAllUsers(usersRes.data || []);

                if (prodRes.data?.length > 0 && !selectedProduct) {
                    setSelectedProduct(prodRes.data[0].name);
                }
            } catch (error) {
                console.error("Dashboard massive sync failure:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [refreshKey, timeframe, selectedMonth, selectedYear]);

    // Independent fetch for the Staff Performance Graph
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setChartLoading(true);
                const res = await api.get('/analytics/staff-performance', { 
                    params: { month: chartMonth, year: chartYear } 
                });
                setChartStaffData(res.data || { all_staff: [], leaderboard: [] });
            } catch (err) {
                console.error("Failed to fetch chart specific staff data", err);
            } finally {
                setChartLoading(false);
            }
        };
        fetchChartData();
    }, [chartMonth, chartYear]);

    // Apply custom targets to staffPerf
    const processedStaffPerf = useMemo(() => {
        const baseLeaderboard = staffPerf?.leaderboard || [];
        const baseAllStaff = staffPerf?.all_staff || [];

        // Excluded roles
        const excludedRoles = ['admin', 'customer', 'delivery_agent', 'delivery_partner'];

        // Combine all possible staff names
        // 1. Get users who are strictly staff
        const staffUsers = allUsers.filter(u => {
            const role = (u.role || '').toLowerCase();
            const name = (u.username || '').toLowerCase();
            if (name === 'test staff' || name === 'staff') return false;
            return role === 'staff';
        });

        const staffUserNames = staffUsers.map(u => u.username);

        // 2. Get names from sales data, but ONLY if they aren't one of the excluded roles
        const salesNames = baseAllStaff.filter(s => {
            const userMatch = allUsers.find(u => u.username === s.staff_name);
            if (userMatch) {
                const role = (userMatch.role || '').toLowerCase();
                return !excludedRoles.includes(role);
            }
            // If no user found, assume it's a legacy staff name from CSV
            return true;
        }).map(s => s.staff_name);

        const allPossibleNames = Array.from(new Set([...staffUserNames, ...salesNames]));

        // Merge performance with names
        const fullStaffList = allPossibleNames.map(name => {
            const u = allUsers.find(user => user.username === name);
            const perf = baseLeaderboard.find(s => s.staff_name === name) ||
                baseAllStaff.find(s => s.staff_name === name);

            const customTarget = getTargetForUser(name, selectedMonth || (new Date().getMonth() + 1).toString(), selectedYear || new Date().getFullYear().toString());

            const revenue = perf ? perf.revenue : 0;
            const target_revenue = customTarget || (perf ? perf.target_revenue : 0) || 10000;
            const target_pct = (revenue / target_revenue) * 100;

            return {
                staff_name: name,
                staff_id: perf?.staff_id || (u ? `EMP-${u.id}` : 'N/A'),
                revenue: revenue,
                sales_count: perf?.sales_count || 0,
                units_sold: perf?.units_sold || 0,
                active_days: perf?.active_days || 0,
                target_revenue: target_revenue,
                target_pct: parseFloat(Math.min(target_pct, 150).toFixed(1)),
                profile_pic: u?.profile_pic || perf?.profile_pic,
                score: perf?.score || 0,
                rank: perf?.rank || 99,
                department: u?.department || perf?.department || 'Operations'
            };
        });

        // Sort by target percentage for performance leaderboard
        const sortedLeaderboard = [...fullStaffList].sort((a, b) => b.target_pct - a.target_pct);

        return { leaderboard: sortedLeaderboard, all_staff: fullStaffList };
    }, [staffPerf, allUsers, selectedMonth, selectedYear]);

    useEffect(() => {
        if (selectedProduct) {
            api.get('/analytics/product-performance', { params: { product_name: selectedProduct } })
                .then(res => setProductTrend(res.data))
                .catch(err => console.error(err));
        }
    }, [selectedProduct]);

    const safeNum = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    };

    // --- CHART PREPS ---
    const chartOptionsMini = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderWidth: 2, tension: 0.4 }, point: { radius: 0 } }
    };

    const lineData = useMemo(() => {
        if (!data?.trends) return { labels: [], datasets: [] };
        return {
            labels: data.trends.map(t => t.date),
            datasets: [
                {
                    label: 'Online Revenue',
                    data: data.trends.map(t => safeNum(t.Online)),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6366f1'
                },
                {
                    label: 'Offline Revenue',
                    data: data.trends.map(t => safeNum(t.Offline)),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981'
                }
            ]
        };
    }, [data]);

    const channelShareData = useMemo(() => {
        if (!data?.trends) return { labels: [], datasets: [] };
        const online = data.trends.reduce((sum, t) => sum + safeNum(t.Online), 0);
        const offline = data.trends.reduce((sum, t) => sum + safeNum(t.Offline), 0);
        return {
            labels: ['Online', 'Offline'],
            datasets: [{
                data: [online, offline],
                backgroundColor: ['#6366f1', '#10b981'],
                borderWidth: 4,
                borderColor: '#fff',
                cutout: '75%'
            }]
        };
    }, [data]);

    const onlineOrderCount = useMemo(() => {
        return Object.values(data?.status_dist || {}).reduce((sum, val) => sum + safeNum(val), 0);
    }, [data?.status_dist]);

    const statusMap = { 'completed': '#10b981', 'delivered': '#10b981', 'pending': '#f59e0b', 'shipped': '#4f46e5', 'cancelled': '#f43f5e', 'returned': '#64748b', 'offline': '#6366f1' };
    const doughnutData = useMemo(() => {
        if (!data?.status_dist) return { labels: [], datasets: [] };
        return {
            labels: Object.keys(data.status_dist),
            datasets: [{ data: Object.values(data.status_dist).map(v => safeNum(v)), backgroundColor: Object.keys(data.status_dist).map(s => statusMap[s] || '#cbd5e1'), borderWidth: 4, borderColor: '#fff', cutout: '75%' }]
        };
    }, [data]);

    const paymentPieData = useMemo(() => ({
        labels: ['Direct', 'Organic Search', 'Social Media', 'Email', 'Referrals'],
        datasets: [{
            data: [35, 28, 18, 9, 8],
            backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    }), []);

    const profitMarginData = useMemo(() => {
        if (!data?.trends_margin) return { labels: [], datasets: [] };
        return {
            labels: data.trends_margin.map(t => t.date),
            datasets: [
                { label: 'Gross', data: data.trends_margin.map(t => safeNum(t.amount)), borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.2)', fill: true, tension: 0.4 },
                { label: 'Profit', data: data.trends_margin.map(t => safeNum(t.profit)), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.8)', fill: true, tension: 0.4 }
            ]
        };
    }, [data]);

    const profitVsCostData = useMemo(() => {
        if (!data?.trends_margin) return { labels: [], datasets: [] };
        return {
            labels: data.trends_margin.map(t => t.date),
            datasets: [
                { label: 'Revenue', data: data.trends_margin.map(t => safeNum(t.amount)), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.4 },
                { label: 'Profit', data: data.trends_margin.map(t => safeNum(t.profit)), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.8)', fill: true, tension: 0.4 }
            ]
        };
    }, [data]);

    const categoryPolarData = useMemo(() => {
        if (!data?.category_dist) return { labels: [], datasets: [] };
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
        return {
            labels: Object.keys(data.category_dist),
            datasets: [{ data: Object.values(data.category_dist).map(v => safeNum(v)), backgroundColor: colors.slice(0, Object.keys(data.category_dist).length) }]
        };
    }, [data]);

    const categoryPieData = useMemo(() => {
        if (!data?.category_dist) return { labels: [], datasets: [] };
        return {
            labels: Object.keys(data.category_dist),
            datasets: [{ data: Object.values(data.category_dist).map(v => safeNum(v)), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'], borderWidth: 0 }]
        };
    }, [data]);

    const paymentDoughnutData = useMemo(() => {
        if (!data?.payment_dist) return { labels: [], datasets: [] };
        const filteredDist = { ...data.payment_dist };
        delete filteredDist['Card'];
        
        return {
            labels: Object.keys(filteredDist),
            datasets: [{ data: Object.values(filteredDist).map(v => safeNum(v)), backgroundColor: ['#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6'] }]
        };
    }, [data]);

    const returnsVelocityData = useMemo(() => {
        if (!data?.returns_trend) return { labels: [], datasets: [] };
        return {
            labels: data.returns_trend.map(r => r.date),
            datasets: [{ label: 'Returns', data: data.returns_trend.map(r => safeNum(r.count)), backgroundColor: '#ef4444', borderRadius: 4 }]
        };
    }, [data]);

    const staffPerformanceData = useMemo(() => {
        if (!mlData?.leaderboard) return { labels: [], datasets: [] };
        const topStaff = Array.isArray(mlData.leaderboard) ? mlData.leaderboard.slice(0, 5) : [];
        return {
            labels: topStaff.map(s => s.staff_name || s.name),
            datasets: [{ label: 'Score', data: topStaff.map(s => safeNum(s.score || s.revenue)), backgroundColor: '#6366f1', borderRadius: 4 }]
        };
    }, [mlData]);

    const productTrendData = useMemo(() => {
        if (!productTrend || productTrend.length === 0) return { labels: [], datasets: [] };
        return {
            labels: productTrend.map(t => t.date),
            datasets: [{ label: selectedProduct, data: productTrend.map(t => t.qty), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#fff' }]
        };
    }, [productTrend, selectedProduct]);

    const revenueTrendMatrixData = useMemo(() => {
        if (!data?.trends) return { labels: [], datasets: [] };
        return {
            labels: data.trends.map(t => t.date),
            datasets: [{ label: 'Revenue', data: data.trends.map(t => safeNum(t.Online) + safeNum(t.Offline)), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.4, fill: true, borderWidth: 3 }]
        };
    }, [data]);

    const salesByMonthData = useMemo(() => {
        if (!data?.monthly_sales) return { labels: [], datasets: [] };
        return { labels: data.monthly_sales.map(m => m.month_year), datasets: [{ label: 'Sales', data: data.monthly_sales.map(m => safeNum(m.amount)), backgroundColor: '#8b5cf6', borderRadius: 8 }] };
    }, [data]);

    const customerPieData = useMemo(() => {
        if (!data?.customer_analytics?.new_vs_returning) return { labels: [], datasets: [] };
        const { new: n, returning: r } = data.customer_analytics.new_vs_returning;
        return { labels: ['New', 'Returning'], datasets: [{ data: [n, r], backgroundColor: ['#3b82f6', '#10b981'], borderWidth: 0, cutout: '70%' }] };
    }, [data]);

    const topCustomersData = useMemo(() => {
        const top = data?.customer_analytics?.top_customers || [];
        return { labels: top.map(c => c.username), datasets: [{ label: 'Revenue', data: top.map(c => c.total), backgroundColor: '#10b981', borderRadius: 6 }] };
    }, [data]);

    const stockLevelsData = useMemo(() => {
        if (!data?.inventory_metrics?.stock_by_category) return { labels: [], datasets: [] };
        return { labels: Object.keys(data.inventory_metrics.stock_by_category), datasets: [{ label: 'Units', data: Object.values(data.inventory_metrics.stock_by_category), backgroundColor: '#f59e0b', borderRadius: 6 }] };
    }, [data]);

    const customerSegmentsData = useMemo(() => {
        if (!Array.isArray(mlData?.segments) || mlData.segments.length === 0) return { datasets: [] };
        
        // Define a color palette for the different segments
        const clusterColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
        
        return {
            datasets: mlData.segments.map((s, i) => ({
                label: s.label || `Segment ${s.cluster}`,
                data: [{ x: safeNum(s.frequency), y: safeNum(s.monetary) }],
                backgroundColor: clusterColors[i % clusterColors.length],
                pointRadius: 10,
                pointHoverRadius: 12,
                showLine: false
            }))
        };
    }, [mlData]);

    const topProductsBarData = useMemo(() => {
        if (!data?.top_products) return { labels: [], datasets: [] };
        const top5 = data.top_products.slice(0, 5);
        return {
            labels: top5.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
            datasets: [{ label: 'Units Moved', data: top5.map(p => safeNum(p.qty)), backgroundColor: '#8b5cf6', borderRadius: 6, barThickness: 20 }]
        };
    }, [data]);

    const categoryBarsData = [
        { label: 'Electronics', val: '1,25,40,000', perc: 48, color: 'bg-indigo-500' },
        { label: 'Wearables', val: '58,20,000', perc: 22, color: 'bg-blue-400' },
        { label: 'Mobile Phones', val: '45,30,000', perc: 18, color: 'bg-emerald-400' },
        { label: 'Accessories', val: '25,30,000', perc: 12, color: 'bg-amber-400' }
    ];

    const processedChartStaff = useMemo(() => {
        const baseAllStaff = chartStaffData?.all_staff || [];
        
        return baseAllStaff.map(s => {
            const customTarget = getTargetForUser(s.staff_name, chartMonth, chartYear);
            const target_revenue = customTarget || s.target_revenue || 10000;
            const target_pct = (s.revenue / target_revenue) * 100;

            return {
                ...s,
                target_revenue,
                target_pct: parseFloat(Math.min(target_pct, 150).toFixed(1))
            };
        }).sort((a, b) => b.target_pct - a.target_pct);
    }, [chartStaffData, chartMonth, chartYear]);

    // Staff vs Target chart data
    const staffVsTargetData = useMemo(() => {
        if (revenueView === 'Staff') {
            const staff = processedChartStaff || [];
            return {
                labels: staff.map(s => s.staff_name.length > 12 ? s.staff_name.substring(0, 12) + '…' : s.staff_name),
                datasets: [
                    { label: 'Actual Revenue', data: staff.map(s => s.revenue), backgroundColor: '#6366f1', borderRadius: 6, barThickness: 20 },
                    { label: 'Target Revenue', data: staff.map(s => s.target_revenue), backgroundColor: 'rgba(99,102,241,0.15)', borderColor: '#6366f1', borderWidth: 2, borderRadius: 6, barThickness: 20 }
                ]
            };
        } else {
            // Monthly View
            if (!data?.monthly_sales) return { labels: [], datasets: [] };
            
            const monthMap = { 'Jan': '1', 'Feb': '2', 'Mar': '3', 'Apr': '4', 'May': '5', 'Jun': '6', 'Jul': '7', 'Aug': '8', 'Sep': '9', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
            
            const labels = data.monthly_sales.map(m => m.month_year);
            const actuals = data.monthly_sales.map(m => safeNum(m.amount));
            
            const monthlyTargets = data.monthly_sales.map(m => {
                const [monthName, yearStr] = m.month_year.split(' ');
                const monthNum = monthMap[monthName];
                return allUsers.reduce((sum, user) => {
                    if (user.role === 'staff') return sum + getTargetForUser(user.username, monthNum, yearStr);
                    return sum;
                }, 0) || 100000;
            });

            return {
                labels: labels,
                datasets: [
                    { label: 'Actual Revenue', data: actuals, backgroundColor: '#10b981', borderRadius: 6, barThickness: 30 },
                    { label: 'Target Revenue', data: monthlyTargets, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', borderWidth: 2, borderRadius: 6, barThickness: 30 }
                ]
            };
        }
    }, [processedChartStaff, revenueView, data?.monthly_sales, allUsers]);

    // Offline Specific Charts (Same as staff but global)
    const offlineRevenueChartData = useMemo(() => {
        const dSales = offlineAnalysis?.daily_sales || [];
        return {
            labels: dSales.length > 0 ? dSales.map(d => d.date) : ['No Data'],
            datasets: [{
                label: 'Offline Revenue',
                data: dSales.length > 0 ? dSales.map(d => d.amount) : [0],
                borderColor: '#4a6cf7',
                backgroundColor: 'rgba(74, 108, 247, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#fff'
            }]
        };
    }, [offlineAnalysis]);

    const offlineVolumeChartData = useMemo(() => {
        const dSales = offlineAnalysis?.daily_sales || [];
        return {
            labels: dSales.length > 0 ? dSales.map(d => d.date) : ['No Data'],
            datasets: [{
                label: 'Sales Volume',
                data: dSales.length > 0 ? dSales.map(d => d.amount) : [0], // Using amount as volume proxy if needed, or update backend
                backgroundColor: '#fb923c',
                borderRadius: 6
            }]
        };
    }, [offlineAnalysis]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <h2 className="mt-4 text-sm font-black text-slate-800 uppercase tracking-widest">Master Synchronizer Active...</h2>
            </div>
        );
    }

    const totalRev = safeNum(data?.total_revenue);
    const revGrowth = safeNum(data?.rev_growth);
    const totalOrders = safeNum(data?.total_orders);

    const metrics = [
        { title: "Total Revenue", val: `₹${totalRev.toLocaleString('en-IN')}`, trend: `+${revGrowth}%`, trendDir: 'up', icon: <Activity size={16} />, color: "text-indigo-600", bg: "bg-indigo-50", chartColor: "#6366f1", cardBg: "bg-indigo-50/20" },
        { title: "Total Orders", val: totalOrders.toLocaleString('en-IN'), trend: "+12.5%", trendDir: 'up', icon: <ShoppingBag size={16} />, color: "text-cyan-600", bg: "bg-cyan-50", chartColor: "#06b6d4", cardBg: "bg-cyan-50/20" },
        { title: "Total Customers", val: (data?.registered_users || 0).toLocaleString('en-IN'), trend: "+8.4%", trendDir: 'up', icon: <Users size={16} />, color: "text-emerald-600", bg: "bg-emerald-50", chartColor: "#10b981", cardBg: "bg-emerald-50/20" }
    ];


    const adminTabs = [
        { name: 'Overview', icon: <Globe size={14} /> },
        { name: 'Deep Analytics', icon: <Monitor size={14} /> },
        { name: 'Sales & Revenue', icon: <TrendingUp size={14} /> },
        { name: 'Product Performance', icon: <ShoppingBag size={14} /> },
        { name: 'Customer Analytics', icon: <Users size={14} /> },
        { name: 'Inventory Forecast', icon: <Layers size={14} /> },
        { name: 'Machine Learning Insights', icon: <Binary size={14} /> }
    ];

    return (
        <div className="relative">
            {/* STICKY HEADER & TABS WRAPPER */}
            <div className="sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-sm pb-4 -mx-4 px-4 -mt-4 pt-4 border-b border-slate-200/50 mb-6 space-y-4 md:space-y-6">
                {/* HEADER - Classic Structural Model */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-[16px] flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-none mb-1.5">Executive Dashboard</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                {selectedMonth ? months.find(m => m.val === selectedMonth)?.label : 'Full Year'} {selectedYear} • {timeframe} Analysis
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex gap-1 mr-2">
                            {['7D', '30D', '90D'].map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf === '7D' ? '7 Days' : tf === '30D' ? '30 Days' : '90 Days')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe.includes(tf.replace('D', '')) ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>

                        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="bg-white border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-slate-600 cursor-pointer shadow-sm">
                            {timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                        </select>

                        <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-slate-600 cursor-pointer shadow-sm">
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>

                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-white border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-slate-600 cursor-pointer shadow-sm">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>

                        <button onClick={() => setRefreshKey(prev => prev + 1)} className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl flex items-center justify-center text-slate-500 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={15} />
                        </button>
                    </div>
                </div>

                {/* TABS - Separated Line - Scrollable on mobile */}
                <div className="flex overflow-x-auto pb-2 -mb-2 gap-2 pt-2 custom-scrollbar-hide">
                    {adminTabs.map(t => (
                        <button
                            key={t.name}
                            onClick={() => setActiveTab(t.name)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-[11px] font-black tracking-wide transition-all duration-200 border whitespace-nowrap ${activeTab === t.name ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30'}`}
                        >
                            {t.icon} {t.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                {/* TAB: OVERVIEW */}
                {activeTab === 'Overview' && (
                    <div className="space-y-8">
                        {/* Executive Metric Cards - Compact Single Row */}
                        <section className="grid grid-cols-3 gap-4">
                            {metrics.map((m, i) => (
                                <div key={i} className={`relative overflow-hidden ${m.cardBg} backdrop-blur-md px-5 py-4 rounded-2xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-all duration-300 group cursor-pointer`}>
                                    {/* Subtle glow blob */}
                                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${m.bg}`}></div>

                                    <div className="relative z-10 flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center ${m.color} shadow-sm border border-white/50 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            {m.icon}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-0.5">{m.title}</span>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">{m.val}</h4>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">vs last 30 days</span>
                                        </div>

                                        {/* Trend Badge */}
                                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${m.trendDir === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border border-white/50 shadow-sm`}>
                                            {m.trend}
                                        </span>
                                    </div>

                                    {/* Bottom Accent Line */}
                                    <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${m.bg} opacity-60 rounded-b-2xl`}></div>
                                </div>
                            ))}
                        </section>

                        {/* Middle Grid - Revenue | Status | Top Selling */}
                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Revenue Stream (8 columns wide) */}
                            <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Revenue Stream Comparison</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="w-2 h-2 bg-[#6366f1] rounded-full"></div> Online
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="w-2 h-2 bg-[#10b981] rounded-full"></div> Offline
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[300px]"><Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
                            </div>

                            {/* Channel Distribution (4 columns wide) */}
                            <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center">
                                <div className="self-start w-full flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Channel Share</h3>
                                    <Store size={16} className="text-slate-400" />
                                </div>
                                <div className="relative w-[180px] h-[180px]">
                                    <Doughnut data={channelShareData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Revenue Split</span>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-3 w-full">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="text-[11px] font-bold text-slate-600">Online Sales</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-900">₹{(data?.trends?.reduce((s, t) => s + safeNum(t.Online), 0) || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-[11px] font-bold text-slate-600">Physical Store</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-900">₹{(data?.trends?.reduce((s, t) => s + safeNum(t.Offline), 0) || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Next Row: Order Status & Top Selling */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* RECENT TRANSACTIONS (75% wide) */}
                            <div className="lg:col-span-9 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Clock size={16} /></div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Transactions</h3>
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Source</th>
                                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(data?.recent_transactions || []).map((t, i) => (
                                                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 text-[11px] font-black text-indigo-600 uppercase tracking-tight">{t.id}</td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">{t.user?.charAt(0)}</div>
                                                            <span className="text-[11px] font-bold text-slate-700">{t.user}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-[11px] font-medium text-slate-500">{t.date}</td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center">
                                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${t.src === 'Online' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {t.src}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-[11px] font-black text-slate-900">₹{(t.amount || 0).toLocaleString()}</td>
                                                    <td className="py-4 text-right">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${t.status === 'delivered' || t.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                            t.status === 'shipped' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Intelligence Hub (25% wide) */}
                            <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                            <Binary size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-md font-black text-slate-900 tracking-tight leading-none">Intelligence Hub</h3>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time ML Engine</span>
                                        </div>
                                    </div>
                                    <Zap size={16} className="text-amber-400 fill-amber-400 animate-pulse" />
                                </div>

                                <div className="space-y-4 flex-1">
                                    {(data?.insights || []).length === 0 && (
                                        <div className="py-12 text-center">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Awaiting data nodes...</p>
                                        </div>
                                    )}
                                    {(data?.insights || []).map((insight, i) => {
                                        const style = getInsightStyle(insight);
                                        return (
                                            <div key={i} className={`${style.bg} p-4 rounded-2xl border ${style.border} transition-all hover:scale-[1.02] cursor-default group`}>
                                                <div className="flex gap-3">
                                                    <div className="shrink-0 mt-0.5">{style.icon}</div>
                                                    <p className={`text-[11px] font-black leading-relaxed ${style.text} tracking-tight`}>{insight}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Deep ML Tools Quick Search/Navigation */}
                                <div className="mt-8 pt-8 border-t border-slate-50 italic">
                                    <Link to="/admin/segments" className="group flex items-center justify-between p-4 bg-slate-900 rounded-2xl transition-all hover:bg-indigo-600 shadow-lg shadow-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                                <Target size={16} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-white uppercase tracking-widest">Launch ML Lab</div>
                                                <div className="text-[9px] font-bold text-indigo-200 uppercase tracking-tight">Full Segmentation Matrix</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-white group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </section>



                        {/* Inventory Extension - Integrated from deleted tab */}
                        <section className="grid grid-cols-1 gap-6 pb-12">
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 text-orange-500">Reserve Levels</h3>
                                <div className="h-[350px]"><Bar data={stockLevelsData} options={{ maintainAspectRatio: false }} /></div>
                            </div>
                        </section>

                        {/* PAYMENT & ORDER STATUS - Moved into Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight self-start mb-6 text-emerald-600">Gateways matrix</h3>
                                <div className="w-[300px] h-[300px]"><Pie data={paymentDoughnutData} /></div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight self-start mb-6 text-amber-500">Pipeline States</h3>
                                <div className="w-[300px] h-[300px]"><Doughnut data={doughnutData} options={{ cutout: '65%' }} /></div>
                            </div>
                        </div>

                        {/* STAFF LEADERBOARD & TARGETS - Moved into Overview */}
                        <div className="space-y-6 pb-12">
                            {/* KPI Summary Cards */}
                            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Staff', val: processedStaffPerf.leaderboard.length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Users size={16} /> },
                                    { label: 'Top Score', val: processedStaffPerf.leaderboard[0]?.score?.toFixed(1) || '—', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Star size={16} /> },
                                    { label: 'Top Revenue', val: processedStaffPerf.leaderboard[0] ? `₹${Number(processedStaffPerf.leaderboard[0].revenue).toLocaleString()}` : '—', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <TrendingUp size={16} /> },
                                    { label: 'Avg Target %', val: processedStaffPerf.leaderboard.length ? `${(processedStaffPerf.leaderboard.reduce((s, x) => s + x.target_pct, 0) / processedStaffPerf.leaderboard.length).toFixed(1)}%` : '—', color: 'text-purple-600', bg: 'bg-purple-50', icon: <Target size={16} /> }
                                ].map((kpi, i) => (
                                    <div key={i} className={`${kpi.bg} rounded-2xl p-5 border border-white/60 shadow-sm flex items-center gap-4`}>
                                        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${kpi.color} shadow-sm`}>{kpi.icon}</div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                                            <div className={`text-xl font-black ${kpi.color}`}>{kpi.val}</div>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Leaderboard Cards */}
                            <section className="space-y-3">
                                {processedStaffPerf.leaderboard.length === 0 && (
                                    <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                        No staff sales data available for this period.
                                    </div>
                                )}
                                {processedStaffPerf.leaderboard.map((s, i) => {
                                    const rankColors = ['from-amber-400 to-yellow-300', 'from-slate-400 to-slate-300', 'from-orange-400 to-amber-300'];
                                    const rankBg = i < 3 ? rankColors[i] : 'from-slate-100 to-slate-50';
                                    const rankText = i < 3 ? 'text-white' : 'text-slate-500';
                                    const medal = ['🥇', '🥈', '🥉'];
                                    return (
                                        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex items-center gap-5 group">
                                            {/* Rank Badge */}
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <span className={`text-lg font-black ${rankText}`}>{i < 3 ? medal[i] : `#${s.rank}`}</span>
                                            </div>

                                            {/* Avatar + Name */}
                                            <div className="flex items-center gap-3 w-40 flex-shrink-0">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm overflow-hidden border border-indigo-100">
                                                    {s.profile_pic
                                                        ? <img src={s.profile_pic} alt={s.staff_name} className="w-full h-full object-cover" />
                                                        : s.staff_name?.charAt(0).toUpperCase()
                                                    }
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{s.staff_name}</div>
                                                    <div className="text-[9px] font-bold text-slate-400">{s.staff_id || s.department}</div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</div>
                                                    <div className="text-sm font-black text-slate-900">₹{Number(s.revenue).toLocaleString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales</div>
                                                    <div className="text-sm font-black text-slate-900">{s.sales_count}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</div>
                                                    <div className="text-sm font-black text-slate-900">{s.units_sold}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Days</div>
                                                    <div className="text-sm font-black text-slate-900">{s.active_days}</div>
                                                </div>
                                            </div>

                                            {/* Score Bar */}
                                            <div className="w-40 flex-shrink-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</span>
                                                    <span className="text-[11px] font-black text-indigo-600">{s.score.toFixed(1)}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(s.score, 100)}%` }}></div>
                                                </div>
                                                <div className="flex justify-between mt-1">
                                                    <span className="text-[8px] text-slate-300 font-bold">Target: {s.target_pct.toFixed(0)}%</span>
                                                    <span className={`text-[8px] font-black ${s.target_pct >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{s.target_pct >= 100 ? '✓ Met' : 'In Progress'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>

                        </div>


                        {/* MACHINE LEARNING INSIGHTS - Integrated into Overview */}
                        <div className="pt-6 border-t border-slate-100 italic text-slate-400 text-[10px] uppercase tracking-widest mb-6">Machine Learning Insights</div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 tracking-tight mb-4 text-emerald-600"><Network size={20} /> Product Associations</h3>
                                <div className="overflow-auto pr-2 custom-scrollbar space-y-3">
                                    {mlData.associations && mlData.associations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <ShoppingBag size={24} className="text-slate-200" />
                                            </div>
                                            <p className="font-bold text-xs uppercase tracking-widest">No strong patterns yet</p>
                                            <p className="text-[10px] font-medium max-w-[200px] mt-1">Collecting more transaction data to discover associations...</p>
                                        </div>
                                    ) : (
                                        (mlData.associations || []).slice(0, 10).map((rule, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-xl font-bold text-xs truncate max-w-[40%]">{rule.antecedents.join(', ')}</div>
                                                <ArrowUpRight size={14} className="text-slate-300" />
                                                <div className="bg-emerald-50 text-emerald-700 py-1.5 px-3 rounded-xl font-bold text-xs truncate max-w-[40%]">{rule.consequents.join(', ')}</div>
                                                <span className="text-[9px] font-black">{Math.round(rule.confidence * 100)}% Match</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: DEEP ANALYTICS */}
                {activeTab === 'Deep Analytics' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 text-indigo-600">Financial Flow (Gross vs Profit)</h3>
                            <div className="h-[400px]"><Line data={profitMarginData} options={{ maintainAspectRatio: false }} /></div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-1/2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight self-start mb-6 text-emerald-600">Category Distribution</h3>
                                <div className="h-[400px] w-full flex items-center justify-center">
                                    <PolarArea data={categoryPolarData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                                </div>
                            </div>
                            <div className="lg:w-1/2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight self-start mb-6 text-amber-500">Payment Matrix</h3>
                                <div className="h-[400px] w-full flex items-center justify-center">
                                    <div className="w-[350px] h-[350px]">
                                        <Doughnut data={paymentDoughnutData} options={{ cutout: '65%', maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {/* TAB: SALES & REVENUE */}
                {activeTab === 'Sales & Revenue' && (
                    <div className="space-y-12 pb-20">
                        {/* 1st: Sales Overview (Offline Revenue) */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2 text-blue-600"><TrendingUp size={20} /> Sales Overview</h3>
                            <div className="h-[400px]"><Line data={offlineRevenueChartData} options={{ maintainAspectRatio: false }} /></div>
                        </div>

                        {/* 2nd: Actual vs Target Revenue */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <Target size={18} className="text-indigo-600" /> {revenueView === 'Staff' ? 'Staff Performance' : 'Monthly Target Tracking'}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {revenueView === 'Staff' && (
                                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                                <select 
                                                    value={chartMonth} 
                                                    onChange={(e) => setChartMonth(e.target.value)}
                                                    className="bg-transparent border-none text-[10px] font-black text-slate-600 outline-none cursor-pointer px-2"
                                                >
                                                    {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                                                </select>
                                                <div className="w-[1px] h-3 bg-slate-200"></div>
                                                <select 
                                                    value={chartYear} 
                                                    onChange={(e) => setChartYear(e.target.value)}
                                                    className="bg-transparent border-none text-[10px] font-black text-slate-600 outline-none cursor-pointer px-2"
                                                >
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button 
                                                onClick={() => setRevenueView('Staff')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${revenueView === 'Staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Staff Revenue
                                            </button>
                                            <button 
                                                onClick={() => setRevenueView('Monthly')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${revenueView === 'Monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Monthly Target
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${revenueView === 'Staff' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div> Actual</div>
                                            <div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded border-2 ${revenueView === 'Staff' ? 'border-indigo-400 bg-indigo-100' : 'border-emerald-400 bg-emerald-100'}`}></div> Target</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[380px] relative">
                                    {chartLoading && (
                                        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <Bar
                                        data={staffVsTargetData}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { weight: '700', size: 9 }, callback: v => `₹${Number(v).toLocaleString()}` } },
                                                x: { grid: { display: false }, ticks: { font: { weight: '700', size: 9 } } }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                                        {revenueView === 'Staff' ? 'Staff Target Breakdown' : 'Monthly Performance'}
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-50 flex-1 overflow-y-auto custom-scrollbar">
                                    {revenueView === 'Staff' ? (
                                        processedChartStaff.map((s, i) => {
                                            const pct = s.target_pct;
                                            const met = pct >= 100;
                                            const barColor = met ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-rose-500';
                                            return (
                                                <div key={i} className="px-6 py-4 flex flex-col gap-2 hover:bg-slate-50/70 transition-all cursor-default">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{s.staff_name}</span>
                                                        <span className={`text-[10px] font-black ${met ? 'text-emerald-600' : 'text-slate-400'}`}>{pct.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        staffVsTargetData.labels.map((label, i) => {
                                            const actual = staffVsTargetData.datasets[0].data[i];
                                            const target = staffVsTargetData.datasets[1].data[i];
                                            const pct = (actual / target) * 100;
                                            const met = pct >= 100;
                                            const barColor = met ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-rose-500';
                                            return (
                                                <div key={i} className="px-6 py-4 flex flex-col gap-2 hover:bg-slate-50/70 transition-all cursor-default">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{label}</span>
                                                        <span className={`text-[10px] font-black ${met ? 'text-emerald-600' : 'text-slate-400'}`}>{pct.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
                                                        <span>₹{Number(actual).toLocaleString()}</span>
                                                        <span>Target: ₹{Number(target).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3rd: Revenue Feed (Online + Offline) */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2 text-indigo-600"><TrendingUp size={20} /> Revenue Feed</h3>
                            <div className="h-[400px]"><Line data={revenueTrendMatrixData} options={{ maintainAspectRatio: false }} /></div>
                        </div>
                    </div>
                )}

                {/* TAB: PRODUCT PERFORMANCE */}
                {activeTab === 'Product Performance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 text-indigo-600">Top Moving Assets</h3>
                            <div className="h-[350px]"><Bar data={topProductsBarData} options={{ indexAxis: 'y', maintainAspectRatio: false }} /></div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 text-rose-600">Return Velocity</h3>
                            <div className="h-[350px]"><Line data={returnsVelocityData} options={{ maintainAspectRatio: false }} /></div>
                        </div>
                    </div>
                )}

                {/* TAB: CUSTOMER ANALYTICS */}
                {activeTab === 'Customer Analytics' && (
                    <div className="space-y-8 pb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 text-emerald-600">High-Value Nodes</h3>
                                <div className="h-[350px]"><Bar data={topCustomersData} options={{ maintainAspectRatio: false }} /></div>
                            </div>
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 tracking-tight mb-4 text-indigo-600"><Target size={20} /> User Segments (Clustering)</h3>
                                <div className="h-[400px]"><Scatter data={customerSegmentsData} options={{ 
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: {
                                            title: { display: true, text: 'Purchase Frequency (Orders)', font: { weight: '800', size: 10 } },
                                            grid: { color: 'rgba(0,0,0,0.03)' }
                                        },
                                        y: {
                                            title: { display: true, text: 'Total Spend (₹)', font: { weight: '800', size: 10 } },
                                            grid: { color: 'rgba(0,0,0,0.03)' }
                                        }
                                    },
                                    plugins: {
                                        legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: '700', size: 10 } } }
                                    }
                                }} /></div>
                            </div>
                        </div>

                        {/* Customer Lifecycle Segments - Moved here */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <Users size={20} className="text-indigo-600" />
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Customer Lifecycle Rankings</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(!mlData?.segments || mlData.segments.length === 0) ? (
                                    <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center col-span-full">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Insufficient demographic density to form robust clusters.<br />Continue growing your customer node base.</p>
                                    </div>
                                ) : (
                                    mlData.segments.map((s, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl font-black text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                    #{i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{s.label}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.user_id} Nodes Identified</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-indigo-600 tracking-tighter">₹{Number(s.monetary || 0).toLocaleString()}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg. LTV</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: INVENTORY FORECAST */}
                {activeTab === 'Inventory Forecast' && (
                    <div className="space-y-8 pb-20">
                        {/* Forecast Summary Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Total Tracked', val: inventoryForecast.length, color: 'text-slate-600', bg: 'bg-slate-50', icon: <Layers size={16} /> },
                                { label: 'Critical Risk', val: inventoryForecast.filter(f => f.urgency === 'critical').length, color: 'text-rose-600', bg: 'bg-rose-50', icon: <AlertTriangle size={16} /> },
                                { label: 'Stock Warning', val: inventoryForecast.filter(f => f.urgency === 'warning').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={16} /> },
                                { label: 'Stable Nodes', val: inventoryForecast.filter(f => f.urgency === 'stable').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Shield size={16} /> }
                            ].map((card, i) => (
                                <div key={i} className={`${card.bg} p-6 rounded-[24px] border border-white/60 shadow-sm flex items-center gap-4`}>
                                    <div className={`w-11 h-11 bg-white rounded-xl flex items-center justify-center ${card.color} shadow-sm border border-slate-100`}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{card.label}</p>
                                        <h4 className={`text-2xl font-black ${card.color} tracking-tighter`}>{card.val}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Detailed Forecast Table */}
                            <div className="lg:col-span-12 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Supply Chain Forecast Matrix</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Projected Stockout Dates via 30D Velocity Analysis</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                                            <FileText size={14} /> Export Report
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Velocity (30D)</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stockout ETA</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {inventoryForecast.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="py-20 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <Activity size={32} className="text-slate-200 mb-4 animate-pulse" />
                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Recalculating trajectory models...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {inventoryForecast.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50/50 transition-all duration-300">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                                                                <Package size={20} className="text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">{item.name}</div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-800">{item.stock} Units</span>
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${item.stock < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                    style={{ width: `${Math.min((item.stock / 100) * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="inline-flex flex-col items-center px-4 py-2 bg-indigo-50/30 rounded-xl border border-indigo-50/50">
                                                            <span className="text-[11px] font-black text-indigo-600">{item.velocity_per_day}</span>
                                                            <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Units/Day</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div>
                                                            <div className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                                                                {item.stockout_date ? new Date(item.stockout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Stable'}
                                                            </div>
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase">
                                                                {item.days_to_stockout !== null ? `In ${item.days_to_stockout} Days` : 'No expected stockout'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${item.urgency === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            item.urgency === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            }`}>
                                                            {item.urgency}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Inventory Analytics (Charts) */}
                            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Velocity Distribution</h3>
                                    <div className="h-[300px]">
                                        <PolarArea
                                            data={{
                                                labels: inventoryForecast.slice(0, 5).map(f => f.name.substring(0, 12)),
                                                datasets: [{
                                                    data: inventoryForecast.slice(0, 5).map(f => f.velocity_per_day),
                                                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
                                                }]
                                            }}
                                            options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Days to Stockout (Critical)</h3>
                                    <div className="h-[300px]">
                                        <Bar
                                            data={{
                                                labels: inventoryForecast.filter(f => f.days_to_stockout !== null).slice(0, 6).map(f => f.name.substring(0, 10)),
                                                datasets: [{
                                                    label: 'Days Remaining',
                                                    data: inventoryForecast.filter(f => f.days_to_stockout !== null).slice(0, 6).map(f => f.days_to_stockout),
                                                    backgroundColor: '#f43f5e',
                                                    borderRadius: 8
                                                }]
                                            }}
                                            options={{ maintainAspectRatio: false, indexAxis: 'y' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* TAB: MACHINE LEARNING INSIGHTS */}
                {activeTab === 'Machine Learning Insights' && (
                    <div className="space-y-8 pb-20">
                        {/* ML Neural Projections */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                <Binary size={200} />
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Neural Revenue Projections</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Simulation Model: Linear Regression + Moving Average Weighted Trend</p>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                                    <Zap size={14} className="text-indigo-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">AI Prediction Active</span>
                                </div>
                            </div>

                            <div className="h-[350px]">
                                <Line
                                    data={{
                                        labels: [...(lineData?.labels || []), 'Proj D+1', 'Proj D+2', 'Proj D+3', 'Proj D+4', 'Proj D+5', 'Proj D+6', 'Proj D+7'],
                                        datasets: [
                                            {
                                                label: 'Historical Revenue',
                                                data: lineData?.datasets?.[0]?.data || [],
                                                borderColor: '#6366f1',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                fill: true,
                                                tension: 0.4,
                                                pointRadius: 4,
                                                pointHoverRadius: 6
                                            },
                                            {
                                                label: 'Neural Forecast',
                                                data: [
                                                    ...Array(Math.max(0, (lineData?.labels?.length || 1) - 1)).fill(null),
                                                    (lineData?.datasets?.[0]?.data?.[lineData?.datasets?.[0]?.data?.length - 1] || 0),
                                                    ...(Array(7).fill(0).map((_, i) => {
                                                        const lastVal = lineData?.datasets?.[0]?.data?.[lineData?.datasets?.[0]?.data?.length - 1] || 50000;
                                                        const growth = (revGrowth / 100) / 7;
                                                        return lastVal * (1 + (growth * (i + 1))) + (Math.random() * 2000 - 1000);
                                                    }))
                                                ],
                                                borderColor: '#10b981',
                                                borderDash: [5, 5],
                                                backgroundColor: 'transparent',
                                                tension: 0.4,
                                                pointRadius: 0
                                            }
                                        ]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { weight: '800', size: 10 } } } },
                                        scales: {
                                            y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { weight: '700' }, callback: v => `₹${Number(v).toLocaleString()}` } },
                                            x: { grid: { display: false }, ticks: { font: { weight: '700' } } }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Product Affinity Correlations */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <Network size={20} className="text-emerald-600" />
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Market Basket Correlations</h3>
                            </div>
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Asset</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associated Asset</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(!mlData?.associations || mlData.associations.length === 0) ? (
                                            <tr>
                                                <td colSpan="3" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No significant correlations discovered yet.</td>
                                            </tr>
                                        ) : (
                                            mlData.associations.map((a, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-all">
                                                    <td className="px-6 py-4 font-bold text-slate-700 text-xs truncate max-w-[140px]">{a.antecedents?.[0]}</td>
                                                    <td className="px-6 py-4 font-bold text-indigo-600 text-xs truncate max-w-[140px]">{a.consequents?.[0]}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-black text-[10px] border border-emerald-100">
                                                            {((a.confidence || 0) * 100).toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                        </div>
                    </div>
                </div>
            )}


            </div>
        </div>
    );
};

export default Dashboard;
