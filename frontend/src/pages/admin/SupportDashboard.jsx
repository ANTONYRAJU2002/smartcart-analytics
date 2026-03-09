import { useState, useEffect } from 'react';
import api from '../../services/api';
import TicketDetail from './TicketDetail';
import { MessageSquare, Filter } from 'lucide-react';

const SupportDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/support/all');
            setTickets(res.data);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const getStatusBadge = (status) => {
        return status === 'open' ? 'badge-success' : 'badge-neutral';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
                    <p className="text-slate-500 text-sm">Manage customer inquiries</p>
                </div>
                {/* Filter placeholder */}
            </div>

            <div className="panel p-0 overflow-hidden">
                {loading ? (
                    <p className="p-8 text-center text-slate-500">Loading tickets...</p>
                ) : (
                    <div className="table-container border-0 shadow-none rounded-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td className="font-mono text-xs">#{ticket.id}</td>
                                        <td className="font-medium">{ticket.user}</td>
                                        <td className="text-slate-600">{ticket.subject}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(ticket.status)} capitalize`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setSelectedTicketId(ticket.id)}
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                            >
                                                <MessageSquare size={16} className="mr-1" /> Reply
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500">No tickets found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedTicketId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <TicketDetail
                        ticketId={selectedTicketId}
                        onClose={() => { setSelectedTicketId(null); fetchTickets(); }}
                    />
                </div>
            )}
        </div>
    );
};

export default SupportDashboard;
