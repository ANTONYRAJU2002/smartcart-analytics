import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users } from 'lucide-react';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/admin/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <Users size={24} />
                        </div>
                        Customer Directory
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">Comprehensive User Registry</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm">
                    <Users size={18} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-600">Total Records: <span className="text-indigo-600 font-black">{users.length}</span></span>
                </div>
            </div>

            <div className="glass-card rounded-[2rem] overflow-hidden border-white/40">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Accessing User Database...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identifier</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile Information</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Credentials</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Access Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                                ID-{user.id.toString().padStart(4, '0')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-sm font-black text-slate-600 group-hover:scale-110 transition-transform">
                                                    {user.username?.[0]?.toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-500">
                                            {user.email}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`
                                                px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm
                                                ${user.role === 'admin' 
                                                    ? 'bg-violet-50 text-violet-600 border-violet-100' 
                                                    : 'bg-sky-50 text-sky-600 border-sky-100'}
                                            `}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center font-black text-slate-400 uppercase tracking-widest">
                                            No users detected in synchronization
                                        </td>
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

export default UserList;
