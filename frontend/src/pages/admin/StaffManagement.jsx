import { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserCheck, UserX, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';

const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            // Filter to show staff/admin, or separate lists
            // Let's show all and filter in UI or backend.
            // Requirement was "Staff Management".
            // Typically we see "pending" staff separately or flagged.
            // Let's filter client side for now as get_users returns all.
            const allUsers = res.data;
            // Sorting: Pending staff first, then by role
            allUsers.sort((a, b) => {
                if (a.role === 'staff' && !a.is_approved) return -1;
                if (b.role === 'staff' && !b.is_approved) return 1;
                return 0;
            });
            setUsers(allUsers);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/staff/${id}/approve`);
            alert("Staff approved successfully");
            fetchUsers();
        } catch (err) {
            alert("Failed to approve staff");
        }
    };

    const handleStatusChange = async (id, active) => {
        try {
            await api.patch(`/admin/staff/${id}/status`, { active });
            fetchUsers();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this user?")) return;
        try {
            await api.delete(`/admin/staff/${id}`);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    // Filter for staff only or search
    const filteredUsers = users.filter(u =>
        (u.role === 'staff' || u.role === 'admin') &&
        (u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
                    <p className="text-slate-500 text-sm">Manage team access and permissions</p>
                </div>
            </div>

            <div className="panel p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="form-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="p-8 text-center text-slate-500">Loading staff...</p>
                ) : (
                    <div className="table-container border-0 shadow-none rounded-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Approval</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div>
                                                <div className="font-medium text-slate-800">{user.username}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-neutral'} uppercase`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                                                {user.active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.role === 'staff' && (
                                                <span className={`badge ${user.is_approved ? 'badge-success' : 'badge-warning'}`}>
                                                    {user.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                            )}
                                            {user.role === 'admin' && <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="text-right">
                                            {user.role !== 'admin' && (
                                                <div className="flex justify-end gap-2">
                                                    {!user.is_approved && (
                                                        <button
                                                            onClick={() => handleApprove(user.id)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                                                            title="Approve Staff"
                                                        >
                                                            <UserCheck size={18} />
                                                        </button>
                                                    )}

                                                    {user.active ? (
                                                        <button
                                                            onClick={() => handleStatusChange(user.id, false)}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                                                            title="Disable Account"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStatusChange(user.id, true)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                                                            title="Enable Account"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-slate-500">No staff found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffManagement;
