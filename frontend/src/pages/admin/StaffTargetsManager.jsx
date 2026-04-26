import React, { useState, useEffect } from 'react';
import { Target, Users, Calendar, ArrowRight, CheckCircle, TrendingUp, Save, Search, Filter, ChevronLeft, ChevronRight, Layout } from 'lucide-react';
import api from '../../services/api';
import { getStaffTargets, saveStaffTarget } from '../../utils/targetUtils';

const StaffTargetsManager = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [targets, setTargets] = useState(getStaffTargets());
    const [searchTerm, setSearchTerm] = useState('');
    const [saveStatus, setSaveStatus] = useState(null);

    const months = [
        { val: '1', label: 'January' }, { val: '2', label: 'February' }, { val: '3', label: 'March' },
        { val: '4', label: 'April' }, { val: '5', label: 'May' }, { val: '6', label: 'June' },
        { val: '7', label: 'July' }, { val: '8', label: 'August' }, { val: '9', label: 'September' },
        { val: '10', label: 'October' }, { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const years = ['2024', '2025', '2026'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersRes, staffPerfRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/analytics/staff-performance', { params: { month: selectedMonth, year: selectedYear } }).catch(() => ({ data: { all_staff: [] } }))
                ]);
                
                const allUsers = usersRes.data || [];
                const salesData = staffPerfRes.data?.all_staff || [];
                const excludedRoles = ['admin', 'customer', 'delivery_agent', 'delivery_partner'];
                
                // Combine staff users and names from sales
                const staffUsers = allUsers.filter(u => {
                    const role = (u.role || '').toLowerCase();
                    const name = (u.username || '').toLowerCase();
                    if (name === 'test staff' || name === 'staff') return false;
                    return role === 'staff';
                });

                const staffUserNames = staffUsers.map(u => u.username);
                const salesNames = salesData.filter(s => {
                    const userMatch = allUsers.find(u => u.username === s.staff_name);
                    if (userMatch) {
                        const role = (userMatch.role || '').toLowerCase();
                        return !excludedRoles.includes(role);
                    }
                    return true;
                }).map(s => s.staff_name);

                const allPossibleNames = Array.from(new Set([...staffUserNames, ...salesNames]));
                
                const finalStaffList = allPossibleNames.map(name => {
                    const u = allUsers.find(user => user.username === name);
                    return {
                        id: u?.id || name,
                        username: name,
                        role: u?.role || 'Legacy Staff',
                        department: u?.department || 'Operations',
                        profile_pic: u?.profile_pic
                    };
                });

                setStaff(finalStaffList);
            } catch (err) {
                console.error("Failed to fetch staff roster", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleTargetUpdate = (username, value) => {
        const numValue = parseFloat(value) || 0;
        saveStaffTarget(username, selectedMonth, selectedYear, numValue);
        setTargets(getStaffTargets());
        
        setSaveStatus(`Saved target for ${username}`);
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const getTargetValue = (username) => {
        const key = `${selectedYear}-${selectedMonth}`;
        return (targets[username] && targets[username][key]) || '';
    };

    const filteredStaff = staff.filter(s => 
        s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Target size={24} />
                        </div>
                        Staff Revenue Targets
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Strategic Performance Management</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                        <Calendar size={16} className="text-slate-400" />
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-sm font-black text-slate-700 outline-none cursor-pointer"
                        >
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent border-none text-sm font-black text-slate-700 outline-none cursor-pointer"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or department..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all font-bold text-sm"
                    />
                </div>
                {saveStatus && (
                    <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-xs uppercase tracking-widest animate-in slide-in-from-right">
                        <CheckCircle size={16} /> {saveStatus}
                    </div>
                )}
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading staff roster...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((user) => (
                        <div key={user.id} className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-300">
                                    {user.profile_pic ? (
                                        <img src={user.profile_pic} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        user.username[0].toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none mb-1">{user.username}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md tracking-tighter">
                                            {user.role}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                            {user.department || 'Operations'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                        Monthly Revenue Target (₹)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</div>
                                        <input 
                                            type="number"
                                            value={getTargetValue(user.username)}
                                            onChange={(e) => handleTargetUpdate(user.username, e.target.value)}
                                            placeholder="Not set"
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Period</span>
                                        <span className="text-[10px] font-bold text-slate-700 uppercase">{months.find(m => m.val === selectedMonth).label} {selectedYear}</span>
                                    </div>
                                    {getTargetValue(user.username) > 0 && (
                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-100 shadow-sm animate-in zoom-in">
                                            <TrendingUp size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredStaff.length === 0 && !loading && (
                <div className="py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                    <Users className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No matching staff found</p>
                </div>
            )}
        </div>
    );
};

export default StaffTargetsManager;
