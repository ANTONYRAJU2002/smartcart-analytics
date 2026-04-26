import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Calendar,
    User,
    IndianRupee,
    TrendingUp,
    ChevronRight,
    History,
    FileText,
    Upload,
    Download,
    Filter,
    X,
    Search,
    FileCode
} from 'lucide-react';

const OfflineSalesList = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter States
    const [filterDate, setFilterDate] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const months = [
        { val: '1', label: 'Jan' }, { val: '2', label: 'Feb' }, { val: '3', label: 'Mar' },
        { val: '4', label: 'Apr' }, { val: '5', label: 'May' }, { val: '6', label: 'Jun' },
        { val: '7', label: 'Jul' }, { val: '8', label: 'Aug' }, { val: '9', label: 'Sep' },
        { val: '10', label: 'Oct' }, { val: '11', label: 'Nov' }, { val: '12', label: 'Dec' }
    ];
    const years = ['2023', '2024', '2025', '2026'];

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/offline');
            setSales(res.data);
        } catch (err) {
            console.error("Failed to fetch offline sales", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    // Filtering & Limiting Logic
    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const filteredSales = sortedSales.filter(sale => {
        const dObj = new Date(sale.date);
        const y = dObj.getFullYear().toString();
        const m = (dObj.getMonth() + 1).toString();
        const dStr = sale.date; // Usually YYYY-MM-DD from API

        const matchesYear = !filterYear || y === filterYear;
        const matchesMonth = !filterMonth || m === filterMonth;
        const matchesDate = !filterDate || dStr === filterDate;
        
        const searchLow = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            (sale.staff || '').toLowerCase().includes(searchLow) || 
            (sale.product || '').toLowerCase().includes(searchLow) ||
            (sale.sale_id || '').toLowerCase().includes(searchLow);

        return matchesYear && matchesMonth && matchesDate && matchesSearch;
    });

    const isFiltered = filterYear || filterMonth || filterDate || searchTerm;
    const displaySales = isFiltered ? filteredSales : filteredSales.slice(0, 30);

    const exportToXML = (dataToExport) => {
        if (!dataToExport || dataToExport.length === 0) {
            alert("No data available to export.");
            return;
        }

        let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n<OfflineSales>\n';
        
        dataToExport.forEach(sale => {
            xmlString += '  <Sale>\n';
            xmlString += `    <SaleID>${sale.sale_id || 'N/A'}</SaleID>\n`;
            xmlString += `    <Date>${sale.date}</Date>\n`;
            xmlString += `    <Staff>${sale.staff}</Staff>\n`;
            xmlString += `    <Product>${(sale.product || 'General Sale').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Product>\n`;
            xmlString += `    <Revenue>${sale.amount}</Revenue>\n`;
            xmlString += `    <Profit>${sale.profit}</Profit>\n`;
            xmlString += `    <Method>${sale.method || 'Cash'}</Method>\n`;
            xmlString += '  </Sale>\n';
        });

        xmlString += '</OfflineSales>';

        const blob = new Blob([xmlString], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `offline_sales_report_${new Date().toISOString().split('T')[0]}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <History size={28} />
                        </div>
                        Offline Sales
                    </h1>
                    <p className="text-slate-500 mt-1 ml-15">Showing {isFiltered ? 'Filtered Results' : 'Last 30 Sales'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => exportToXML(filteredSales)}
                        className="spacer-btn-primary flex items-center gap-2 py-3 px-6 text-sm shadow-blue-500/20"
                    >
                        <FileCode size={18} /> Export XML Report
                    </button>

                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-3">
                        <FileText size={18} className="text-blue-400" />
                        <span className="text-slate-400 font-medium">Total:</span> {sales.length}
                    </div>
                </div>
            </div>

            {/* 🎯 FILTER HUB */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Staff / Product..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                </div>

                <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-600"
                    />
                </div>

                <div className="relative">
                    <select 
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-600 appearance-none cursor-pointer"
                    >
                        <option value="">All Months</option>
                        {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Filter size={14} />
                    </div>
                </div>

                <div className="relative">
                    <select 
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-600 appearance-none cursor-pointer"
                    >
                        <option value="">All Years</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <TrendingUp size={14} />
                    </div>
                </div>

                <button 
                    onClick={() => { setFilterDate(''); setFilterMonth(''); setFilterYear(''); setSearchTerm(''); }}
                    className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-slate-200 border-dashed"
                >
                    <X size={16} /> Reset
                </button>
            </div>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Sale ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Staff</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Profit</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Method</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20 text-slate-400 italic font-medium anim-pulse">
                                        Retrieving historical data...
                                    </td>
                                </tr>
                            ) : displaySales.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <TrendingUp size={48} opacity={0.3} />
                                            <p className="font-medium italic">No sales logs match your current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displaySales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-6 py-6">
                                            <span className="font-mono text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                {sale.sale_id || 'Legacy'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-700 whitespace-nowrap">
                                                    {new Date(sale.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shadow-sm ring-4 ring-white">
                                                    {sale.staff.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-600 group-hover:text-blue-700 transition-colors uppercase tracking-tight text-xs whitespace-nowrap">
                                                    {sale.staff}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="max-w-[150px] truncate font-bold text-slate-800" title={sale.product}>
                                                {sale.product || 'General Sale'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-black text-emerald-600">
                                            {formatCurrency(sale.amount)}
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-xs border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                                                {formatCurrency(sale.profit)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                {sale.method || 'Cash'}
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
    );
};

export default OfflineSalesList;
