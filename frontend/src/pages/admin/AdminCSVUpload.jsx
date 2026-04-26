import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import api from '../../services/api';

const AdminCSVUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
            setMessage(null);
        } else {
            setSelectedFile(null);
            setMessage({ type: 'error', text: 'Please select a valid CSV file.' });
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await api.post('/offline/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage({ type: 'success', text: response.data.msg });
            setSelectedFile(null);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.msg || 'Error uploading file. Please check CSV format.' 
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="admin-csv-upload-container animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Upload className="text-indigo-600" size={32} />
                        Bulk Sales Data Upload
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Import historical sales data (Online & Offline) for the last 5 years into the analytics engine.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[32px] p-10 shadow-xl shadow-indigo-100/50 border border-indigo-50/50 relative overflow-hidden">
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-10"></div>
                    
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className={`
                            w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500
                            ${uploading ? 'bg-indigo-600 animate-pulse text-white shadow-2xl shadow-indigo-200' : (selectedFile ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-100' : 'bg-indigo-50 text-indigo-600')}
                        `}>
                            {uploading ? <Upload size={40} className="animate-bounce" /> : (selectedFile ? <CheckCircle size={40} /> : <FileText size={40} />)}
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-2">Upload CSV File</h3>
                        <p className="text-slate-500 text-center max-w-sm mb-10 font-medium">
                            Drag and drop your sales report or click below to browse. Supports all historical sales data.
                        </p>

                        {/* Dropzone/Input */}
                        <div className={`
                            w-full max-w-xl border-2 border-dashed rounded-[32px] p-12 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
                            ${selectedFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/30'}
                        `}
                        onClick={() => document.getElementById('csv-input').click()}>
                            <input 
                                type="file" 
                                id="csv-input" 
                                className="hidden" 
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                            
                            {selectedFile ? (
                                <div className="flex items-center gap-3">
                                    <FileText className="text-emerald-500" />
                                    <span className="text-emerald-700 font-bold text-lg">{selectedFile.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-400 font-bold group-hover:text-indigo-600 transition-colors">Click to Browse or Drag File Here</span>
                                    <span className="text-slate-300 text-sm mt-2 font-medium">Maximum file size: 10MB</span>
                                </div>
                            )}
                        </div>

                        {/* Status Message */}
                        {message && (
                            <div className={`
                                mt-8 p-5 rounded-2xl flex items-center gap-4 w-full max-w-xl animate-in slide-in-from-top-4 duration-300
                                ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-rose-50 border border-rose-100 text-rose-700'}
                            `}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span className="font-bold text-sm">{message.text}</span>
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="mt-10 flex gap-4">
                            {selectedFile && (
                                <button 
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center gap-2"
                                >
                                    {uploading ? 'Processing Data...' : 'Confirm & Upload'}
                                </button>
                            )}
                            
                            <a 
                                href="/offline_sales_sample.csv" 
                                download 
                                className="px-8 py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Download size={18} />
                                Sample Format
                            </a>
                        </div>
                    </div>

                    {/* Requirements Guide */}
                    <div className="mt-10 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-black text-slate-900 flex items-center gap-2 mb-4">
                                <Info size={18} className="text-indigo-600" />
                                CSV Requirements
                            </h4>
                            <ul className="space-y-2">
                                {['Sale ID (Mandatory)', 'Staff ID', 'Product Name', 'Quantity', 'Price', 'Cost Price', 'Date (YYYY-MM-DD)', 'Payment Method', 'Customer Name', 'Customer Phone', 'Notes'].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h4 className="font-black text-indigo-900 text-sm mb-2">Historical Analytics Tip</h4>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                For historical data spanning the last 5 years, you can include <strong>Customer Name</strong> and <strong>Phone</strong> for demographic analysis. To distinguish between <strong>Online</strong> and <strong>Offline</strong> sales, use the <strong>Payment Method</strong> or <strong>Notes</strong> field. Ensure the <strong>Date</strong> follows the <strong>YYYY-MM-DD</strong> format.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCSVUpload;
