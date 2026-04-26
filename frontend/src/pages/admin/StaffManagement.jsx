import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    UserCheck, Trash2, Search, Filter,
    MoreVertical, Shield, ChevronDown,
    Circle, CheckCircle2, UserMinus, Activity
} from 'lucide-react';

const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApproveToggle = async (user) => {
        try {
            if (!user.is_approved) {
                await api.post(`/admin/staff/${user.id}/approve`);
            } else {
                // Assuming revoke sets is_approved to false
                // Backend might need a specific revoke route or just use status
                // For now, let's use the status toggle logic for "Revoke" if needed
                // But the image shows a "Revoke" button alongside "Access Granted" toggle.
                // Let's stick to the backend capability: approve works.
                // If they want to revoke, we might need a backend fix.
                // For now, I'll use handleStatusChange as a fallback for Revoke.
                await api.patch(`/admin/staff/${user.id}/status`, { active: false });
            }
            fetchUsers();
        } catch (err) {
            alert("Action failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently remove this staff member?")) return;
        try {
            await api.delete(`/admin/staff/${id}`);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const getAvatarColor = (id) => {
        const colors = ['yellow', 'purple', 'blue', 'emerald'];
        return colors[id % colors.length];
    };

    const filteredUsers = users.filter(u => {
        const username = u.username || '';
        const email = u.email || '';
        const matchesSearch = username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'All Status' ||
            (statusFilter === 'Pending' && !u.is_approved) ||
            (statusFilter === 'Approved' && u.is_approved);

        return (u.role === 'staff' || u.role === 'admin' || u.role === 'delivery_agent') && matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-black text-slate-900 tracking-tight">Staff Approval</h1>
                    <p className="text-[14px] font-bold text-slate-400 mt-1">Manage and approve your staff for server access</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search staff names..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/10 w-64 text-sm font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-3 mb-8">
                <div className="relative">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-600 shadow-sm outline-none cursor-pointer"
                    >
                        <option>All Roles</option>
                        <option>admin</option>
                        <option>staff</option>
                        <option>delivery_agent</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-600 shadow-sm outline-none cursor-pointer"
                    >
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Approved</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.map(user => (
                        <div key={user.id} className={`staff-card ${!user.is_approved ? 'pending' : ''}`}>
                            <div className="staff-user-info">
                                <div className={`staff-avatar ${getAvatarColor(user.id)}`}>
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="staff-details">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg">{user.username}</h3>
                                        {user.role === 'admin' && <Shield size={14} className="text-sky-500 fill-sky-50" />}
                                    </div>
                                    <p className="text-slate-400 font-bold">{user.email}</p>

                                    <div className="mt-4">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearance Status</div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${user.is_approved ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {user.is_approved ? 'Access Granted' : 'Pending Approval'}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-300">|</span>
                                            <span className="text-[11px] font-bold text-slate-400">{user.role} | {user.department || 'Operations'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="staff-actions">
                                {user.role !== 'admin' ? (
                                    <>
                                        {!user.is_approved ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApproveToggle(user)} className="btn-approve px-8 py-3 rounded-2xl shadow-lg shadow-emerald-100">
                                                    <UserCheck size={18} />
                                                    Approve
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="btn-remove bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-rose-100">
                                                    <Trash2 size={18} />
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase border border-emerald-100">
                                                        <CheckCircle2 size={16} />
                                                        Access Granted
                                                        <div className="w-10 h-5 bg-emerald-500 rounded-full relative ml-2">
                                                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => fetchUsers()} className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all">
                                                        <Activity size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApproveToggle(user)} className="btn-revoke px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50">
                                                        Revoke
                                                    </button>
                                                    <button onClick={() => handleDelete(user.id)} className="btn-remove px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-100">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="badge-root-admin">
                                            <Shield size={18} />
                                            Root Admin
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No staff members found matching your criteria</p>
                        </div>
                    )}
                </div>
            )}

            <p className="mt-8 text-center text-xs font-bold text-slate-400">Only approved staff members can access the server.</p>
        </div>
    );
};

export default StaffManagement;
