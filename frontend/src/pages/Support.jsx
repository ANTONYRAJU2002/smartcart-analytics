import { useState, useEffect } from 'react';
import api from '../services/api';
import './support.css';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);

    // New Form Fields
    const [inquiryType, setInquiryType] = useState('General Question');
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');

    const [loading, setLoading] = useState(true);

    const fetchTicketsAndOrders = async () => {
        try {
            const [ticketsRes, ordersRes] = await Promise.all([
                api.get('/support'),
                api.get('/orders/my')
            ]);
            setTickets(ticketsRes.data);
            setOrders(ordersRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load support data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketsAndOrders();
    }, []);

    const handleTicketClick = async (id) => {
        try {
            const res = await api.get(`/support/${id}`);
            setSelectedTicket({ ...res.data, id });
            setMessages(res.data.messages);
            setShowNewTicketForm(false);
        } catch (err) {
            console.error("Failed to load ticket details");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/support/${selectedTicket.id}/message`, { message: newMessage });
            setNewMessage('');
            const res = await api.get(`/support/${selectedTicket.id}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to send message");
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();

        if ((inquiryType === 'Refund Request' || inquiryType === 'Complaint') && !selectedOrderId) {
            alert(`Please select an order for your ${inquiryType.toLowerCase()}.`);
            return;
        }

        try {
            if (inquiryType === 'Refund Request') {
                const res = await api.post(`/orders/${selectedOrderId}/refund`, { reason: newTicketMessage });
                handleTicketClick(res.data.ticket_id);
            } else {
                const res = await api.post('/support', {
                    inquiry_type: inquiryType,
                    order_id: selectedOrderId || null,
                    message: newTicketMessage
                });
                handleTicketClick(res.data.ticket_id);
            }
            setShowNewTicketForm(false);
            setInquiryType('General Question');
            setSelectedOrderId('');
            setNewTicketMessage('');
            fetchTicketsAndOrders();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to create ticket');
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '40px', fontFamily: 'Arial'}}>Loading Support...</div>;

    return (
        <div className="support-container">
            {/* Header */}
            {!selectedTicket && (
                <div className="support-header">
                    <h1>Support Tickets</h1>
                    <p>Your inquiry history</p>
                </div>
            )}

            {!selectedTicket ? (
                <>
                    {/* Tickets List or Empty State */}
                    {tickets.length === 0 ? (
                        <div className="ticket-card">
                            <div className="ticket-icon">📦</div>
                            <h3>No Support Tickets</h3>
                            <p>You don't have any active inquiries at the moment.</p>
                            <button className="primary-btn" onClick={() => setShowNewTicketForm(true)}>
                                + Create New Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="form-card" style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '15px', marginBottom: '15px' }}>
                                <h2 style={{ margin: 0 }}>Your Tickets</h2>
                                <button className="primary-btn" style={{ marginTop: 0 }} onClick={() => setShowNewTicketForm(true)}>
                                    + New Ticket
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {tickets.map(t => (
                                    <div key={t.id} onClick={() => handleTicketClick(t.id)} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>REQ-{t.id} - {t.subject}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {t.admin_unread_count > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        <span style={{ marginRight: '4px' }}>🔔</span>
                                                        {t.admin_unread_count} New
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '12px', background: t.status === 'open' ? '#d1fae5' : '#f1f5f9', color: t.status === 'open' ? '#065f46' : '#64748b' }}>
                                                    {t.status}
                                                </span>
                                            </div>
                                        </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Inquiry */}
                    {(showNewTicketForm || tickets.length === 0) && (
                        <div className="form-card">
                            <h2>Create New Inquiry</h2>
                            <p>We're here to help. Fill out the form below and our support team will get back to you shortly.</p>

                            <form onSubmit={handleCreateTicket}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Inquiry Type</label>
                                        <select value={inquiryType} onChange={(e) => setInquiryType(e.target.value)} required>
                                            <option value="General Question">General Question</option>
                                            <option value="Complaint">Complaint</option>
                                            <option value="Refund Request">Refund Request</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Select Order</label>
                                        <select 
                                            value={selectedOrderId} 
                                            onChange={(e) => setSelectedOrderId(e.target.value)} 
                                            required={inquiryType === 'Refund Request' || inquiryType === 'Complaint'}
                                        >
                                            <option value="">
                                                {inquiryType === 'Refund Request' || inquiryType === 'Complaint' ? 'Choose an order...' : 'None / Not related to a specific order'}
                                            </option>
                                            {orders && orders.length > 0 && orders.map((order) => {
                                                const productNames = order.items && order.items.length > 0 
                                                    ? order.items.map(i => i.name || `Product #${i.product_id}`).join(', ') 
                                                    : 'Unknown Product';
                                                return (
                                                    <option key={order.id} value={order.id}>
                                                        Order #{order.id} - {productNames} ({new Date(order.date).toLocaleDateString()})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>How can we help you?</label>
                                    <textarea 
                                        value={newTicketMessage} 
                                        onChange={(e) => setNewTicketMessage(e.target.value)}
                                        placeholder="Please provide details about your issue, error messages, or questions..." 
                                        required
                                    />
                                </div>

                                <button type="submit" className="primary-btn">
                                    Submit Ticket
                                </button>
                            </form>
                        </div>
                    )}
                </>
            ) : (
                <div className="form-card" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ddd', paddingBottom: '15px', marginBottom: '15px' }}>
                        <div>
                            <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, marginBottom: '10px', fontSize: '14px' }}>&larr; Back to tickets</button>
                            <h2 style={{ margin: 0 }}>{selectedTicket.subject}</h2>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>REQ-{selectedTicket.id} • {selectedTicket.status.toUpperCase()}</div>
                        </div>
                        <button 
                            onClick={() => setSelectedTicket(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#999',
                                cursor: 'pointer',
                                fontSize: '24px',
                                padding: '0 5px',
                                lineHeight: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Close Chat"
                        >
                            &times;
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {messages.map((m, index) => {
                            const isStaff = m.sender === 'staff' || m.sender_id !== selectedTicket.user_id;
                            const isSystem = m.message.startsWith('[SYSTEM]');
                            
                            if (isSystem) {
                                return (
                                    <div key={m.id || index} style={{ textAlign: 'center', margin: '10px 0' }}>
                                        <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                            {m.message.replace('[SYSTEM]', '').trim()}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div key={m.id || index} style={{ alignSelf: isStaff ? 'flex-start' : 'flex-end', maxWidth: '75%' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: isStaff ? 'left' : 'right' }}>
                                        {isStaff ? 'Support Team' : 'You'} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div style={{ 
                                        background: isStaff ? '#f8fafc' : '#4f46e5', 
                                        color: isStaff ? '#333' : 'white', 
                                        padding: '12px 16px', 
                                        borderRadius: '12px', 
                                        borderTopLeftRadius: isStaff ? '4px' : '12px',
                                        borderTopRightRadius: isStaff ? '12px' : '4px',
                                        fontSize: '14px',
                                        border: isStaff ? '1px solid #e2e8f0' : 'none'
                                    }}>
                                        {m.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginTop: '15px' }}>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                value={newMessage} 
                                onChange={(e) => setNewMessage(e.target.value)} 
                                placeholder="Type your message here..." 
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            />
                            <button type="submit" disabled={!newMessage.trim()} className="primary-btn" style={{ margin: 0 }}>Send</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
