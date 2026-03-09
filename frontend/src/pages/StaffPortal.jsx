import { useState } from 'react';
import api from '../services/api';
import { Calendar, IndianRupee, TrendingUp, Save, CheckCircle, AlertCircle } from 'lucide-react';

const StaffPortal = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [sales, setSales] = useState('');
    const [profit, setProfit] = useState('');
    const [message, setMessage] = useState('');
    const [statusType, setStatusType] = useState(''); // 'success' or 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/offline', {
                date,
                total_sales: parseFloat(sales),
                total_profit: parseFloat(profit)
            });
            setMessage('Entry saved successfully!');
            setStatusType('success');
            setSales('');
            setProfit('');
        } catch (err) {
            setMessage('Failed to save entry.');
            setStatusType('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-xl border border-border-color">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        Offline Sales Entry
                    </h2>
                    <p className="text-slate-500 text-sm">Daily store performance record</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-semibold ${statusType === 'success'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                        {statusType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                        <div className="relative">
                            <Calendar size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400" />
                            <input
                                type="date"
                                className="form-input pl-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Sales (₹)</label>
                        <div className="relative">
                            <IndianRupee size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400" />
                            <input
                                type="number"
                                className="form-input pl-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                value={sales}
                                onChange={(e) => setSales(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Profit (₹)</label>
                        <div className="relative">
                            <TrendingUp size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400" />
                            <input
                                type="number"
                                className="form-input pl-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                value={profit}
                                onChange={(e) => setProfit(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn bg-primary text-white hover:bg-primary-hover w-full py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold mt-4"
                    >
                        <Save size={20} /> Submit Entry
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StaffPortal;
