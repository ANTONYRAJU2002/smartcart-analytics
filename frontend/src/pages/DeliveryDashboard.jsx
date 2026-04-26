import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { 
  Package, MapPin, Phone, Truck, CheckCircle, 
  ChevronDown, ChevronUp, Camera, IndianRupee, ShieldCheck,
  Clock, Check, Search, Filter, LogOut, RefreshCw,
  X, Box, Info, Calendar, AlertCircle, RotateCcw,
  Undo2, UserX, MapPinned, AlertTriangle
} from 'lucide-react';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
import './Cart.css'; // Reusing some base styles if needed, but will define custom ones

const DeliveryDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' (shipped), 'completed' (delivered)
  const [expandedOrders, setExpandedOrders] = useState({});
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [codAmount, setCodAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Failure Modal States
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [failAction, setFailAction] = useState('reschedule');
  const [failNotes, setFailNotes] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders/delivery');
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const filteredOrders = orders.filter(o => 
    activeTab === 'pending' ? o.status === 'shipped' : o.status === 'delivered'
  );

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // In a real app, we'd upload to a server. 
    // Here we'll simulate the upload process.
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryImages(prev => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setDeliveryImages(prev => prev.filter((_, i) => i !== index));
  };

  const openDeliverModal = (order) => {
    setSelectedOrder(order);
    setShowDeliverModal(true);
    setDeliveryImages([]);
    setCodAmount('');
  };

  const submitDelivery = async () => {
    if (deliveryImages.length === 0) {
      alert("Please upload at least one image as opened package proof.");
      return;
    }

    if (selectedOrder.payment_method === 'COD') {
      // Agent only collects the COD balance (total minus 10% advance already paid online)
      const balanceDue = selectedOrder.cod_balance > 0 ? selectedOrder.cod_balance : selectedOrder.total;
      if (!codAmount || parseFloat(codAmount) < balanceDue) {
        alert(`Please enter the correct COD balance to collect (₹${balanceDue.toLocaleString()}).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Upload images first (simulated or real depending on backend)
      const formData = new FormData();
      deliveryImages.forEach((img, index) => {
        formData.append('files[]', img.file);
      });

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrls = uploadRes.data.urls || [];

      // 2. Confirm delivery
      await api.patch(`/orders/${selectedOrder.id}/deliver`, {
        delivery_proof: imageUrls,
        collected_amount: codAmount
      });

      setShowDeliverModal(false);
      fetchOrders();
      alert("Order marked as delivered successfully!");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to submit delivery details");
    } finally {
      setSubmitting(false);
    }
  };

  const openFailModal = (order) => {
    setSelectedOrder(order);
    setShowFailModal(true);
    setFailReason('');
    setFailAction('reschedule');
    setFailNotes('');
  };

  const submitFailure = async () => {
    if (!failReason || !failAction) {
      alert("Please select both a reason and an action.");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/orders/${selectedOrder.id}/fail`, {
        reason: failReason,
        action: failAction,
        notes: failNotes
      });

      setShowFailModal(false);
      fetchOrders();
      alert("Delivery failure reported successfully.");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to report delivery failure");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="delivery-dashboard-wrapper">
      <style>{`
        .delivery-dashboard-wrapper {
          min-height: 100vh;
          background: #f7f9fc;
          font-family: 'Outfit', sans-serif;
          color: #1a1a1a;
          padding-bottom: 50px;
        }

        .delivery-header {
          background: white;
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-brand h1 {
          font-size: 28px;
          color: #2563eb;
          font-weight: 800;
          margin: 0;
        }

        .header-brand h1 span { color: #111; }

        .header-brand p {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          margin: 4px 0 0;
        }

        .header-actions { display: flex; gap: 12px; }

        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover { background: #f8fafc; color: #2563eb; border-color: #2563eb; }

        .tabs-container {
          max-width: 1280px;
          margin: 30px auto;
          padding: 0 40px;
        }

        .delivery-tabs {
          display: flex;
          gap: 16px;
        }

        .tab-btn {
          padding: 12px 24px;
          background: #e2e8f0;
          border-radius: 30px;
          font-weight: 700;
          font-size: 14px;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-btn.active {
          background: #2563eb;
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .orders-grid {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .order-card {
          background: white;
          border-radius: 24px;
          padding: 30px;
          display: grid;
          grid-template-columns: 280px 1fr 320px;
          gap: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
        }

        @media (max-width: 1100px) {
          .order-card { grid-template-columns: 1fr; gap: 30px; }
        }

        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 20px;
          display: block;
        }

        .info-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 16px;
          height: 100%;
          position: relative;
        }

        .order-id {
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 6px;
        }

        .order-date {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }

        .badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .badge-green { background: #dcfce7; color: #166534; }
        .badge-orange { background: #ffedd5; color: #9a3412; }
        .badge-blue { background: #eff6ff; color: #1e40af; }

        .items-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          font-weight: 700;
          cursor: pointer;
        }

        .status-tracker {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .status-point {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
        }

        .status-point.done { color: #16a34a; }
        .status-point.active { color: #2563eb; }
        .status-point.pending { color: #94a3b8; }

        .customer-name {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .btn-call {
          background: #dcfce7;
          color: #166534;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .address-box {
          font-size: 14px;
          color: #475569;
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .btn-map {
          background: transparent;
          color: #2563eb;
          border: 1px solid #2563eb;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .payment-row span:last-child { font-weight: 800; color: #1e293b; }

        .collect-box {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }

        .amount-collect {
          font-size: 32px;
          font-weight: 900;
          color: #ef4444;
          margin: 0;
        }

        .collect-label {
          color: #ef4444;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 4px 0 10px;
        }

        .total-label {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
        }

        .action-btns {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-deliver {
          background: #2563eb;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .btn-fail {
          background: white;
          color: #ef4444;
          border: 2px solid #ef4444;
          padding: 14px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        }

        .items-dropdown {
          grid-column: span 3;
          margin-top: 20px;
          background: #f8fafc;
          border-radius: 20px;
          padding: 20px;
        }

        @media (max-width: 1100px) {
          .items-dropdown { grid-column: span 1; }
        }

        /* ── Modal Styles ── */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(8px);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 1000;
        }
        @media (min-width: 768px) { .modal-overlay { align-items: center; } }

        .delivery-modal {
          background: white; width: 100%; max-width: 520px;
          border-radius: 32px 32px 0 0; padding: 40px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 768px) { .delivery-modal { border-radius: 32px; } }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .modal-header-sec h2 { font-size: 22px; font-weight: 900; margin: 0; }
        .modal-section { margin-top: 24px; }
        .modal-section h5 { margin: 0 0 12px; font-size: 13px; font-weight: 800; color: #475569; }

        .cod-input-wrapper { position: relative; }
        .cod-input-wrapper input {
          width: 100%; padding: 16px 16px 16px 44px;
          border-radius: 16px; border: 1px solid #e2e8f0;
          font-size: 16px; font-weight: 800; outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .cod-input-wrapper input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }

        .upload-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .upload-placeholder {
          aspect-ratio: 1; border: 2px dashed #e2e8f0; border-radius: 16px;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; color: #94a3b8; cursor: pointer;
        }
        .upload-preview { aspect-ratio: 1; border-radius: 16px; overflow: hidden; position: relative; }
        .upload-preview img { width: 100%; height: 100%; object-fit: cover; }
        .remove-img-btn {
          position: absolute; top: 4px; right: 4px;
          background: rgba(0,0,0,0.5); color: white;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .modal-submit-btn {
          width: 100%; background: #2563eb; color: white;
          border: none; padding: 18px; border-radius: 20px;
          font-weight: 900; font-size: 16px; margin-top: 32px;
          cursor: pointer; transition: all 0.2s;
        }
        .modal-submit-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
        .modal-submit-btn:hover:not(:disabled) { background: #1d4ed8; }
      `}</style>

      {/* Header */}
      <header className="delivery-header">
        <div className="header-brand">
          <h1>Delivery <span>Hub</span></h1>
          <p>Welcome back, {user?.username} (Agent ID: {user?.id})</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={fetchOrders} title="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="icon-btn" onClick={logout} title="Logout" style={{ color: '#ef4444' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="delivery-tabs">
          <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <Clock size={16} /> Active {orders.filter(o => o.status === 'shipped').length}
          </button>
          <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
            <CheckCircle size={16} /> Delivered
          </button>
        </div>
      </div>

      {/* Orders List */}
      <main className="orders-grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <RefreshCw size={36} className="animate-spin" style={{ color: '#2563eb', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontWeight: 600 }}>Loading your deliveries...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
            <Box size={48} style={{ color: '#e2e8f0', margin: '0 auto 16px' }} />
            <h3 style={{ fontWeight: 800, color: '#1e293b' }}>No Orders Found</h3>
            <p style={{ color: '#94a3b8', fontWeight: 500 }}>Your {activeTab} delivery queue is clear!</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isCOD = order.payment_method === 'COD';
            const collectAmount = isCOD ? (order.cod_balance > 0 ? order.cod_balance : order.total) : 0;
            return (
              <div key={order.id} className="order-card">

                {/* ── COLUMN 1: ORDER INFO ── */}
                <div>
                  <span className="section-title">Order Info</span>
                  <div className="info-box">
                    <p className="order-id">📦 Order #{order.id}</p>
                    <p className="order-date">{order.date}</p>

                    <div className="badge-row">
                      {isCOD && order.advance_amount > 0 && (
                        <span className="badge badge-green">✓ Advance Paid</span>
                      )}
                      {isCOD ? (
                        <span className="badge badge-orange">COD Order</span>
                      ) : (
                        <span className="badge badge-blue">Prepaid</span>
                      )}
                      {order.status === 'shipped' && order.delivery_attempts > 0 && (
                        <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Rescheduled</span>
                      )}
                    </div>

                    <div className="items-toggle" onClick={() => toggleExpand(order.id)}>
                      <span style={{ fontSize: 14 }}>📄 Items: {order.items?.length}</span>
                      {expandedOrders[order.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* ── COLUMN 2: CUSTOMER & STATUS ── */}
                <div>
                  <span className="section-title">Delivery Status</span>

                  {/* Progress Tracker */}
                  <div className="status-tracker">
                    <div className="status-point done">
                      <CheckCircle size={16} /> Picked
                    </div>
                    <div style={{ flex: 1, height: 2, background: '#2563eb', borderRadius: 2 }} />
                    <div className={`status-point ${order.status === 'shipped' ? 'active' : 'done'}`}>
                      <Truck size={16} /> Out for Delivery
                    </div>
                    <div style={{ flex: 1, height: 2, background: order.status === 'delivered' ? '#16a34a' : '#e2e8f0', borderRadius: 2 }} />
                    <div className={`status-point ${order.status === 'delivered' ? 'done' : 'pending'}`}>
                      <Check size={16} /> Done
                    </div>
                  </div>

                  {/* Customer Box */}
                  <div className="info-box">
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Customer</p>
                    <p className="customer-name">{order.customer}</p>

                    <a href={`tel:${order.phone_number}`} className="btn-call">
                      <Phone size={14} /> Call Customer
                    </a>

                    <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Address</p>
                    <p className="address-box">
                      <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: '#64748b' }} />
                      {order.shipping_address}
                    </p>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shipping_address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button className="btn-map">📍 View Map</button>
                    </a>
                  </div>
                </div>

                {/* ── COLUMN 3: PAYMENT & ACTIONS ── */}
                <div>
                  <span className="section-title">Payment Summary</span>
                  <div className="info-box">
                    {isCOD ? (
                      <>
                        <div className="payment-row">
                          <span>✓ Advance Paid</span>
                          <span>₹{(order.advance_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="payment-row">
                          <span>💳 COD Fee</span>
                          <span>₹49</span>
                        </div>
                        <div className="collect-box">
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Collect from Customer</p>
                          <p className="amount-collect">₹{collectAmount.toLocaleString()}</p>
                        </div>
                        <p className="total-label" style={{ marginTop: 10 }}>
                          Order Total (incl. handling): ₹{(order.total || 0).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="payment-row">
                          <span>Payment Method</span>
                          <span style={{ color: '#059669' }}>Prepaid ✓</span>
                        </div>
                        <div className="collect-box">
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Order Total</p>
                          <p className="amount-collect" style={{ color: '#2563eb' }}>₹{(order.total || 0).toLocaleString()}</p>
                        </div>
                      </>
                    )}

                    {activeTab === 'pending' && (
                      <div className="action-btns">
                        <button className="btn-deliver" onClick={() => openDeliverModal(order)}>
                          <CheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                          Mark Delivered
                        </button>
                        <button className="btn-fail" onClick={() => openFailModal(order)}>
                          ✖ Failed Delivery
                        </button>
                      </div>
                    )}

                    {activeTab === 'completed' && (
                      <div style={{ marginTop: 20, textAlign: 'center', color: '#16a34a', fontWeight: 800, fontSize: 14 }}>
                        <CheckCircle size={20} style={{ display: 'inline', marginRight: 6 }} />
                        DELIVERED
                      </div>
                    )}
                  </div>
                </div>

                {/* ── ITEMS DROPDOWN (spans full row) ── */}
                {expandedOrders[order.id] && (
                  <div className="items-dropdown">
                    {(() => {
                      const items = order.items || [];
                      const grouped = [];
                      const builds = {};
                      items.forEach(item => {
                        if (item.build_id) {
                          if (!builds[item.build_id]) builds[item.build_id] = { header: null, components: [] };
                          if (item.is_build_header) builds[item.build_id].header = item;
                          else builds[item.build_id].components.push(item);
                        } else {
                          grouped.push({ type: 'single', item });
                        }
                      });
                      Object.keys(builds).forEach(bid => grouped.push({ type: 'build', ...builds[bid] }));
                      return grouped.map((group, idx) => {
                        if (group.type === 'single') {
                          const { item } = group;
                          return (
                            <div key={idx} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                              <img src={formatImageUrl(item.image_url)} onError={handleImageError} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', background: '#f1f5f9' }} alt="" />
                              <div>
                                <strong style={{ fontSize: 14 }}>{item.name}</strong>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Qty: {item.qty}</p>
                                {item.color && (
                                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12 }}>
                                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: item.color, border: '1.5px solid rgba(0,0,0,0.15)' }} />
                                    <span style={{ textTransform: 'capitalize' }}>{item.color}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          const { header, components } = group;
                          return (
                            <div key={idx} style={{ background: '#f7f3ff', borderRadius: 16, marginTop: 12, padding: 16, border: '1px dashed #7c3aed' }}>
                              <div style={{ display: 'flex', gap: 16, borderBottom: 'none' }}>
                                <img src={formatImageUrl(header?.image_url)} onError={handleImageError} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', border: '2px solid #7c3aed' }} alt="" />
                                <div>
                                  <span style={{ fontSize: 10, background: '#7c3aed', color: 'white', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 4 }}>DREAM PC BUILD</span>
                                  <strong style={{ display: 'block', fontSize: 14 }}>{header?.name || 'Custom PC'}</strong>
                                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{components.length} Components included</p>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                                {components.map((c, cidx) => (
                                  <div key={cidx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <img src={formatImageUrl(c.image_url)} onError={handleImageError} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} alt="" />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{c.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                )}

              </div>
            );
          })
        )}
      </main>

      {/* Confirmation Modal */}
      {showDeliverModal && selectedOrder && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowDeliverModal(false)}>
          <div className="delivery-modal">
            <div className="modal-header-sec flex justify-between items-center">
              <h2>Confirm Delivery</h2>
              <X size={24} className="text-slate-400 cursor-pointer" onClick={() => setShowDeliverModal(false)} />
            </div>

            <div className="modal-info-bar mt-4 p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
              <Info size={18} className="text-blue-500" />
              <p className="text-[11px] font-bold text-slate-500 m-0">Confirming delivery for Order #{selectedOrder.id}</p>
            </div>

            {selectedOrder.payment_method === 'COD' && (
              <div className="modal-section">
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', fontWeight: 700, color: '#713f12' }}>
                  ℹ️ Customer already paid <strong>₹{(selectedOrder.advance_amount || 0).toLocaleString()}</strong> advance (10%) online.<br/>
                  Collect only the <strong>90% balance: ₹{(selectedOrder.cod_balance > 0 ? selectedOrder.cod_balance : selectedOrder.total).toLocaleString()}</strong>
                </div>
                <h5>Enter Amount Collected from Customer</h5>
                <div className="cod-input-wrapper">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</div>
                  <input 
                    type="number" 
                    placeholder={`Balance due: ₹${(selectedOrder.cod_balance > 0 ? selectedOrder.cod_balance : selectedOrder.total).toLocaleString()}`} 
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="modal-section">
              <h5>Package Proof (Opened Proof)</h5>
              <div className="upload-grid">
                {deliveryImages.map((img, idx) => (
                  <div key={idx} className="upload-preview">
                    <img src={img.preview} alt="" />
                    <div className="remove-img-btn" onClick={() => removeImage(idx)}><X size={12} /></div>
                  </div>
                ))}
                {deliveryImages.length < 3 && (
                  <label className="upload-placeholder">
                    <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                    <Camera size={24} />
                    <span className="text-[9px] mt-2 font-black uppercase">Add Photo</span>
                  </label>
                )}
              </div>
            </div>

            <button 
              className="modal-submit-btn" 
              onClick={submitDelivery}
              disabled={submitting}
            >
              {submitting ? 'Updating System...' : 'Complete Delivery'}
            </button>
          </div>
        </div>
      )}
      {/* Failure Modal */}
      {showFailModal && selectedOrder && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowFailModal(false)}>
          <div className="delivery-modal">
            <div className="modal-header-sec flex justify-between items-center">
              <h2 className="flex items-center gap-2">
                <AlertCircle className="text-rose-500" />
                Report Delivery Failure
              </h2>
              <X size={24} className="text-slate-400 cursor-pointer" onClick={() => setShowFailModal(false)} />
            </div>

            <div className="modal-section">
              <h5>Select Reason</h5>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'Customer not available', icon: <UserX size={16} /> },
                  { id: 'Wrong address', icon: <MapPinned size={16} /> },
                  { id: 'Refused order', icon: <Undo2 size={16} /> }
                ].map(r => (
                  <button 
                    key={r.id}
                    onClick={() => setFailReason(r.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold transition-all text-sm ${failReason === r.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                  >
                    {r.icon} {r.id}
                    {failReason === r.id && <Check size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <h5>Next Action</h5>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFailAction('reschedule')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold transition-all ${failAction === 'reschedule' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                >
                  <RotateCcw size={20} />
                  <span className="text-[10px] uppercase">Reschedule</span>
                </button>
                <button 
                  onClick={() => setFailAction('return')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold transition-all ${failAction === 'return' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                >
                  <Undo2 size={20} />
                  <span className="text-[10px] uppercase">Return to Whouse</span>
                </button>
              </div>
            </div>

            <div className="modal-section">
              <h5>Additional Notes</h5>
              <textarea 
                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-blue-500 outline-none font-medium text-sm transition-all"
                placeholder="Any extra details about the failure..."
                rows="3"
                value={failNotes}
                onChange={(e) => setFailNotes(e.target.value)}
              ></textarea>
            </div>

            <button 
              className="modal-submit-btn" 
              style={{ background: failAction === 'return' ? '#0f172a' : '#2563eb' }}
              onClick={submitFailure}
              disabled={submitting || !failReason}
            >
              {submitting ? 'Updating System...' : 'Record Failure'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
