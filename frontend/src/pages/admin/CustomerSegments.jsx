import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, DollarSign, Clock, Activity, Star, Zap } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerSegments = () => {
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSegments = async () => {
            try {
                const res = await api.get('/analytics/segments');
                setSegments(res.data);
            } catch (err) {
                console.error("Failed to load segments", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSegments();
    }, []);

    if (loading) return <div style={{ color: '#64748b', padding: '2rem', fontFamily: 'Outfit' }}>Loading Segments...</div>;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    // Prepare chart data
    const chartData = {
        labels: segments.map((s) => s.label),
        datasets: [
            {
                label: 'Avg Lifetime Value',
                data: segments.map(s => s.monetary),
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)', // VIP
                    'rgba(16, 185, 129, 0.8)', // Loyal
                    'rgba(244, 63, 94, 0.8)',  // At Risk
                    'rgba(99, 102, 241, 0.8)'  // Standard
                ],
                borderRadius: 12,
                barThickness: 40
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Monetary Value by Segment', color: '#1e293b', font: { size: 16, weight: '900', family: 'Outfit' } }
        },
        scales: {
            y: { 
                ticks: { color: '#94a3b8', font: { family: 'Outfit', weight: '600' } }, 
                grid: { color: '#f1f5f9' },
                border: { display: false }
            },
            x: { 
                ticks: { color: '#94a3b8', font: { family: 'Outfit', weight: '600' } }, 
                grid: { display: false },
                border: { display: false }
            }
        }
    };

    const getSegmentStyles = (label) => {
        switch(label) {
            case 'VIP Whales': return { 
                icon: <Star size={20} className="text-amber-600" />, 
                bg: '#fffbeb', 
                border: '#fef3c7', 
                accent: '#f59e0b', 
                title: 'text-amber-900',
                sub: 'text-amber-600'
            };
            case 'Loyal Regulars': return { 
                icon: <Activity size={20} className="text-emerald-600" />, 
                bg: '#ecfdf5', 
                border: '#d1fae5', 
                accent: '#10b981',
                title: 'text-emerald-900',
                sub: 'text-emerald-600'
            };
            case 'At Risk / Dormant': return { 
                icon: <Clock size={20} className="text-rose-600" />, 
                bg: '#fff1f2', 
                border: '#ffe4e6', 
                accent: '#f43f5e',
                title: 'text-rose-900',
                sub: 'text-rose-600'
            };
            default: return { 
                icon: <Users size={20} className="text-indigo-600" />, 
                bg: '#eef2ff', 
                border: '#e0e7ff', 
                accent: '#6366f1',
                title: 'text-indigo-900',
                sub: 'text-indigo-600'
            };
        }
    };

    const getRecommendation = (label) => {
        switch(label) {
            case 'VIP Whales': return "Priority VIP support & exclusive early access to high-end builds.";
            case 'Loyal Regulars': return "Reward with loyalty points or bundle discounts to maintain frequency.";
            case 'At Risk / Dormant': return "Urgent re-engagement campaign with a personalized 'We miss you' discount.";
            default: return "Nurture with educational content and standard promotional offers.";
        }
    };

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", color: '#1e293b' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '3rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, tracking: 'tighter', color: '#0f172a' }}>Segmentation Hub</h1>
                <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>AI-Driven Customer Lifecycle Analysis</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '3rem' }}>
                {/* Segments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {segments.map((segment, idx) => {
                        const style = getSegmentStyles(segment.label);
                        return (
                            <div key={idx} style={{ 
                                padding: '2.5rem', 
                                background: '#ffffff', 
                                borderRadius: '32px',
                                border: '1px solid #f1f5f9', 
                                position: 'relative', 
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.5rem 1rem', background: style.bg, borderRadius: '12px', fontWeight: 900, fontSize: '0.65rem', color: style.accent, textTransform: 'uppercase', border: `1px solid ${style.border}` }}>
                                    Bucket {idx + 1}
                                0px
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                                    <div style={{ padding: '0.85rem', borderRadius: '18px', background: style.bg, color: style.accent, border: `1px solid ${style.border}` }}>{style.icon}</div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>{segment.label || 'Standard Customer'}</h3>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Machine Learning Cluster</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Reach</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>{segment.user_id} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Customers</span></div>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Avg Lifetime Value</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>{formatCurrency(segment.monetary)}</div>
                                    </div>
                                </div>

                                {/* Notable Members Section */}
                                <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '20px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                        <Users size={14} /> Notable Segment Members
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {segment.top_members && segment.top_members.length > 0 ? (
                                            segment.top_members.map((name, i) => (
                                                <span key={i} style={{ background: '#fff', padding: '0.4rem 0.75rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', border: '1px solid #e2e8f0' }}>{name}</span>
                                            ))
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Analyzing patterns...</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: style.accent, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                        <Zap size={14} fill={style.accent} /> Strategy Recommendation
                                    </div>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
                                        {getRecommendation(segment.label)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Secondary Sidebar Content */}
                <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                    <div style={{ padding: '2.5rem', background: '#ffffff', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <Bar data={chartData} options={chartOptions} />
                        
                        <div style={{ marginTop: '3rem', padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-12px', left: '2rem', background: '#6366f1', padding: '0.3rem 1rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Expert Insight</div>
                            <h4 style={{ margin: '0 0 0.75rem', color: '#0f172a', fontSize: '1.1rem', fontWeight: 900 }}>RFM Methodology</h4>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 500 }}>
                                Our engine classifies users based on <strong style={{color:'#0f172a'}}>Recency</strong> (visit time), <strong style={{color:'#0f172a'}}>Frequency</strong> (order count), and <strong style={{color:'#0f172a'}}>Monetary</strong> (total spend) variables. 
                                By identifying patterns in these nodes, we can automate personalized outreach and maximize the lifetime value (LTV).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSegments;
