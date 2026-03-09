import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, DollarSign, Clock, Activity } from 'lucide-react';
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

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading Segments...</div>;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    // Prepare chart data
    const chartData = {
        labels: segments.map((_, i) => `Segment ${i + 1}`),
        datasets: [
            {
                label: 'Avg Monetary Value',
                data: segments.map(s => s.monetary),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#94a3b8' } },
            title: { display: true, text: 'Segment Value Comparison', color: 'white' }
        },
        scales: {
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
    };

    const getSegmentLabel = (s) => {
        // Simple heuristic for labeling based on RFM
        // This relies on relative values, simplified here.
        if (s.monetary > 50000 && s.frequency > 5) return 'Whales (High Value)';
        if (s.frequency > 5) return 'Loyal Regulars';
        if (s.recency > 30) return 'At Risk / Churning';
        return 'Standard Customers';
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", color: 'white' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Customer Segmentation</h1>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>AI-driven clustering of your customer base using RFM analysis.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Segments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {segments.map((segment, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: '#3b82f6', borderBottomLeftRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
                                Segment {idx + 1}
                            </div>

                            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#fff' }}>{getSegmentLabel(segment)}</h3>
                            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <Users size={16} /> Count
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{segment.user_id}</div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <DollarSign size={16} /> Avg Spend
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#10b981' }}>{formatCurrency(segment.monetary)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <Activity size={16} /> Frequency
                                    </div>
                                    <div style={{ fontSize: '1rem' }}>{segment.frequency.toFixed(1)} orders</div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        <Clock size={16} /> Recency
                                    </div>
                                    <div style={{ fontSize: '1rem' }}>{segment.recency.toFixed(0)} days ago</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div>
                    <div className="glass-panel" style={{ padding: '2rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
                        <Bar data={chartData} options={chartOptions} />
                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#60a5fa' }}>Insight</h4>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                Segmenting customers allows for targeted marketing. "Loyal Regulars" should be rewarded with exclusivity, while "At Risk" customers might need re-engagement campaigns with special offers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSegments;
