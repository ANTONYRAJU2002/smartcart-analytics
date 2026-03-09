import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ArrowRight, ShoppingBag, Lightbulb } from 'lucide-react';

const ProductAssociations = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const res = await api.get('/analytics/associations');
                setRules(res.data);
            } catch (err) {
                console.error("Failed to load associations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRules();
    }, []);

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading Analysis...</div>;

    const uniqueProducts = [...new Set(rules.flatMap(r => [...r.antecedents, ...r.consequents]))];

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", color: 'white' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Product Associations (Market Basket)</h1>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>Discovering purchase patterns: "People who bought X also bought Y".</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Rules List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {rules.length === 0 ? (
                        <div style={{ padding: '2rem', background: '#1e293b', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
                            No strong associations found yet. Need more transaction data.
                        </div>
                    ) : rules.map((rule, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>If they buy</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{rule.antecedents.join(', ')}</div>
                                </div>
                                <ArrowRight size={24} color="#64748b" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>They are likely to buy</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6' }}>{rule.consequents.join(', ')}</div>
                                </div>
                            </div>

                            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', marginLeft: '1.5rem', minWidth: '150px' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Confidence: </span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>{(rule.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Lift: </span>
                                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>{rule.lift.toFixed(2)}x</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(234, 179, 8, 0.2)', borderRadius: '8px', color: '#eab308' }}>
                                <Lightbulb size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Actionable Insights</h3>
                        </div>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Based on these rules, consider bundling high-lift items together or placing them adjacent in the layout to increase cross-selling.
                        </p>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Top Associated Products</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {uniqueProducts.slice(0, 8).map((p, i) => (
                                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductAssociations;
