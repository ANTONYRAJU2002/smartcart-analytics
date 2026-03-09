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
    Download
} from 'lucide-react';

const OfflineSalesList = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/offline/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(res.data.msg || "Upload successful!");
            fetchSales();
        } catch (err) {
            console.error("Upload failed", err);
            alert(err.response?.data?.msg || "Failed to upload CSV. Ensure the format is: date,sales,profit");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,date,sales,profit\n2026-02-21,15000,4500\n2026-02-20,12000,3600";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "offline_sales_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const triggerFileSelect = () => {
        document.getElementById('csv-upload-input').click();
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

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
                    <p className="text-slate-500 mt-1 ml-15">Manage and upload bulk sales data for analytics.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={downloadTemplate}
                        className="spacer-btn-outline flex items-center gap-2 py-3 px-6 text-sm"
                    >
                        <Download size={18} /> Template
                    </button>

                    <input
                        type="file"
                        id="csv-upload-input"
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={triggerFileSelect}
                        disabled={uploading}
                        className="spacer-btn-primary flex items-center gap-2 py-3 px-6 text-sm shadow-blue-500/20"
                    >
                        <Upload size={18} />
                        {uploading ? 'Processing...' : 'Bulk Upload'}
                    </button>

                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-3">
                        <FileText size={18} className="text-blue-400" />
                        <span className="text-slate-400 font-medium">Total:</span> {sales.length}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Member</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Profit</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-slate-400 italic font-medium anim-pulse">
                                        Retrieving historical data...
                                    </td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <TrendingUp size={48} opacity={0.3} />
                                            <p className="font-medium italic">No sales logs found in the archives.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                    <Calendar size={16} className="text-slate-500" />
                                                </div>
                                                <span className="font-bold text-slate-700">
                                                    {new Date(sale.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black shadow-sm ring-4 ring-white">
                                                    {sale.staff.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-600 group-hover:text-blue-700 transition-colors uppercase tracking-tight text-sm">
                                                    {sale.staff}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-emerald-600 text-lg">
                                            {formatCurrency(sale.amount)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                                                {formatCurrency(sale.profit)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all">
                                                <ChevronRight size={22} />
                                            </button>
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
