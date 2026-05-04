import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ArrowRight, ShoppingBag, Lightbulb, TrendingUp, Zap, Target, BarChart3 } from 'lucide-react';

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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: '#6366f1' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
        </div>
    );

    const uniqueProducts = [...new Set(rules.flatMap(r => [...r.antecedents, ...r.consequents]))];

    return (
        <div style={{ 
            fontFamily: "'Inter', sans-serif", 
            background: '#0f172a', // Solid dark background for maximum contrast
            color: '#f8fafc', 
            padding: '2.5rem',
            borderRadius: '24px',
            minHeight: '80vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.6s ease-out'
        }}>
            <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', padding: '0.85rem', borderRadius: '14px', boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)' }}>
                        <BarChart3 size={28} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Market Basket Intelligence
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '4px', fontWeight: 500 }}>
                            AI-Driven Purchase Pattern Analysis
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr', gap: '2.5rem' }}>
                {/* Rules List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ 
                        padding: '1.5rem 2rem', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem'
                    }}>
                        <div style={{ background: '#6366f1', padding: '0.75rem', borderRadius: '12px' }}>
                            <Lightbulb size={24} color="white" />
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.5 }}>
                            This AI analyzes your sales to find which products people love to buy together. Use these insights to suggest add-ons to your customers!
                        </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '-0.5rem', marginLeft: '0.5rem' }}>
                        Top Recommended Pairings
                    </div>

                    {rules.length === 0 ? (
                        <div style={{ padding: '5rem 2rem', background: '#1e293b', borderRadius: '20px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)' }}>
                            <ShoppingBag size={56} color="#334155" style={{ marginBottom: '1.5rem' }} />
                            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#94a3b8' }}>Establishing Patterns...</div>
                            <div style={{ color: '#475569', fontSize: '0.95rem', marginTop: '0.75rem' }}>Connect more sales data to unlock deep behavioral insights.</div>
                        </div>
                    ) : rules.map((rule, idx) => (
                        <div 
                            key={idx} 
                            className="association-card-premium"
                            style={{ 
                                padding: '2rem', 
                                background: 'rgba(30, 41, 59, 0.4)', 
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', 
                                flexDirection: 'column',
                                gap: '1.5rem',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Primary Product</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>{rule.antecedents.join(' + ')}</div>
                                </div>
                                
                                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '1rem', borderRadius: '50%', boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' }}>
                                    <Zap size={24} color="#6366f1" />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Perfect Add-on</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>{rule.consequents.join(' + ')}</div>
                                </div>

                                <div style={{ 
                                    background: '#0f172a', 
                                    padding: '1.25rem 1.5rem', 
                                    borderRadius: '20px', 
                                    minWidth: '180px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>Buying Chance</span>
                                            <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 900 }}>{(rule.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${rule.confidence * 100}%`, height: '100%', background: 'linear-gradient(to right, #10b981, #34d399)', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>Match Strength</span>
                                            <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 900 }}>
                                                {idx === 0 ? 'Exceptional' : idx < 3 ? 'Strong' : 'Good'}
                                            </span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${Math.max(20, 100 - (idx * 10))}%`, 
                                                height: '100%', 
                                                background: 'linear-gradient(to right, #fbbf24, #f59e0b)', 
                                                borderRadius: '4px' 
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ 
                                background: 'rgba(255,255,255,0.02)', 
                                padding: '1rem 1.5rem', 
                                borderRadius: '14px', 
                                border: '1px solid rgba(255,255,255,0.03)',
                                fontSize: '0.95rem',
                                color: '#cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <TrendingUp size={18} color="#10b981" />
                                <span>
                                    <strong>Recommendation:</strong> When a customer buys <strong>{rule.antecedents[0]}</strong>, they are <strong>{(rule.confidence * 100).toFixed(0)}% likely</strong> to also buy <strong>{rule.consequents[0]}</strong>. Suggest this as a bundle deal!
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ 
                        padding: '2.25rem', 
                        background: 'linear-gradient(135deg, #1e1b4b, #2e1065)', 
                        borderRadius: '32px', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.6rem', background: '#fbbf24', borderRadius: '12px', color: '#1e1b4b' }}>
                                <TrendingUp size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Business Strategy</h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', borderLeft: '4px solid #10b981' }}>
                                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                    <strong>Bundle Deals:</strong> High-match products should be grouped as special offers to increase average order value.
                                </p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', borderLeft: '4px solid #6366f1' }}>
                                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                    <strong>Shelf Placement:</strong> Keep these items near each other in your physical store for easier customer access.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        padding: '2rem', 
                        background: 'rgba(30, 41, 59, 0.3)', 
                        borderRadius: '28px', 
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Products</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {uniqueProducts.slice(0, 15).map((p, i) => (
                                <div 
                                    key={i} 
                                    style={{ 
                                        background: 'rgba(15, 23, 42, 0.6)', 
                                        padding: '0.5rem 1.1rem', 
                                        borderRadius: '14px', 
                                        fontSize: '0.85rem', 
                                        color: '#94a3b8',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                >
                                    {p}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .association-card-premium:hover {
                    transform: translateY(-4px);
                    background: rgba(30, 41, 59, 0.6) !important;
                    border-color: rgba(99, 102, 241, 0.3) !important;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
                }
            ` }} />
        </div>
    );
};

export default ProductAssociations;

