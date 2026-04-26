import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Server, HardDrive, Box, Fan, Monitor, Keyboard, Mouse, X, CheckCircle, AlertTriangle, Loader2, Sparkles, Plus, RefreshCw, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatImageUrl, handleImageError } from '../utils/imageUtils';
import './CustomPC.css';

const PC_CATEGORIES = [
    { id: 'processor', name: 'Processor (CPU)', icon: <Cpu />, subcats: ['Processors (CPUs)', 'Processor (CPU)', 'CPU', 'Processors'] },
    { id: 'motherboard', name: 'Motherboard', icon: <Server />, subcats: ['Motherboards', 'Motherboard', 'Mainboard'] },
    { id: 'ram', name: 'RAM (Memory)', icon: <Server />, subcats: ['RAM (Memory)', 'RAM', 'Memory'] },
    { id: 'storage1', name: 'Storage Slot 1 (SSD/HDD)', icon: <HardDrive />, subcats: ['Internal SSDs', 'NVMe SSDs', 'Solid State Drives', 'Hard Drives', 'SSD', 'HDD', 'Storage (SSD/HDD)', 'Storage (SSD/HDD) '] },
    { id: 'storage2', name: 'Storage Slot 2 (SSD/HDD)', icon: <HardDrive />, subcats: ['Internal SSDs', 'NVMe SSDs', 'Solid State Drives', 'Hard Drives', 'SSD', 'HDD', 'Storage (SSD/HDD)', 'Storage (SSD/HDD) '] },
    { id: 'gpu', name: 'Graphics Card (GPU)', icon: <Monitor />, subcats: ['Graphics Cards (GPUs)', 'Graphics Card (GPU)', 'GPU', 'Graphics Card'] },
    { id: 'psu', name: 'Power Supply (PSU)', icon: <Fan />, subcats: ['Power Supplies (PSUs)', 'Power Supply (PSU)', 'PSU', 'Power Supply', 'Power Supply (SMPS)', 'SMPS'] },
    { id: 'cabinet', name: 'Cabinet (Case)', icon: <Box />, subcats: ['Cabinets', 'Cabinet', 'PC Case', 'Case', 'Cabinet (PC Case)', 'Cabinet (Case)'] },
    { id: 'cooling', name: 'Cooling', icon: <Fan />, subcats: ['Cooler', 'CPU Cooler', 'AIO Cooler', 'Liquid Cooling', 'Fans', 'Cooling'] },
    { id: 'monitor', name: 'Monitor', icon: <Monitor />, subcats: ['Gaming Monitors', '4K UHD Monitors', 'Curved Displays', 'Monitor', 'Monitors'] },
    { id: 'keyboard', name: 'Keyboard', icon: <Keyboard />, subcats: ['Gaming Keyboards', 'Keyboard', 'Keyboards', 'Mechanical Keyboards'] },
    { id: 'mouse', name: 'Mouse', icon: <Mouse />, subcats: ['Optical Mouse', 'Mouse', 'Mice', 'Gaming Mouse'] },
];

const CustomPC = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    
    const [selectedParts, setSelectedParts] = useState({});
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    // Total Price calculation
    const totalPrice = Object.values(selectedParts).reduce((sum, item) => sum + (item?.price || 0), 0);
    
    const fetchProductsForCategory = async (categoryObj) => {
        setLoadingProducts(true);
        try {
            // Fetch all products first then filter on frontend to avoid complex backend queries if not natively supported
            const res = await api.get('/products');
            const allProducts = res.data.products || res.data;
            
            // Filter products that match mapping
            const filtered = allProducts.filter(p => categoryObj.subcats.includes(p.sub_category));
            setProducts(filtered);
        } catch (error) {
            console.error("Failed to fetch products for compatibility maker", error);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSelectClick = (category) => {
        setCurrentCategory(category);
        setIsModalOpen(true);
        fetchProductsForCategory(category);
    };

    const handleSelectProduct = (product) => {
        setSelectedParts(prev => ({
            ...prev,
            [currentCategory.id]: product
        }));
        setIsModalOpen(false);
    };

    const handleRemoveProduct = (categoryId) => {
        setSelectedParts(prev => {
            const next = { ...prev };
            delete next[categoryId];
            return next;
        });
    };

    const handleAddToCart = (showToast = true) => {
        const parts = Object.values(selectedParts).filter(Boolean);
        if (parts.length === 0) {
            alert('Please select at least one component!');
            return false;
        }

        const buildId = `build_${Date.now()}`;
        const ai = getAiAnalysis();

        // 1. Add Build Header
        const buildHeader = {
            id: `header_${buildId}`,
            name: "Dream PC Build",
            category: "Custom Build",
            price: 0, // Individual components carry the price
            quantity: 1,
            image_url: getPreviewImage(),
            is_build_header: true,
            build_id: buildId,
            build_metadata: {
                ai: ai,
                parts_count: parts.length,
                total_price: totalPrice
            }
        };
        addToCart(buildHeader, 1);
        
        // 2. Add Components
        parts.forEach(part => {
             addToCart({ ...part, quantity: 1, build_id: buildId, is_build_header: false }, 1);
        });
        
        if (showToast) alert(`Added your Dream PC configuration to the cart!`);
        return true;
    };

    const handleBuyNow = () => {
        if (handleAddToCart(false)) {
            navigate('/checkout');
        }
    };

    const saveBuild = () => {
        if (Object.keys(selectedParts).length === 0) return;
        const savedBuilds = JSON.parse(localStorage.getItem('saved_pc_builds') || '[]');
        const newBuild = {
            id: Date.now(),
            name: `Custom Build ${new Date().toLocaleDateString()}`,
            parts: selectedParts,
            total: totalPrice
        };
        localStorage.setItem('saved_pc_builds', JSON.stringify([...savedBuilds, newBuild]));
        alert("Build saved to your profile (locally)!");
    };

    const downloadPDF = () => {
        const partsCount = Object.keys(selectedParts).length;
        if (partsCount === 0) {
            alert('Please select at least one component before downloading!');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const aiAnalysis = getAiAnalysis();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246); // Blue accent
        doc.text('SmartCart Dream PC', 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.text('Your custom configuration summary', 14, 33);
        
        // Horizontal Line
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 38, pageWidth - 14, 38);

        // Components Table
        const tableData = PC_CATEGORIES.map(cat => {
            const part = selectedParts[cat.id];
            return [
                cat.name,
                part ? part.name : 'Not Selected',
                part ? `INR ${part.price.toLocaleString('en-IN')}` : '-'
            ];
        });

        autoTable(doc, {
            startY: 45,
            head: [['Component Type', 'Selected Item', 'Price']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        const finalY = doc.lastAutoTable.finalY + 10;

        // Total
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Build Price: INR ${totalPrice.toLocaleString('en-IN')}`, pageWidth - 14, finalY, { align: 'right' });

        // AI Analysis Section
        const boxY = finalY + 15;
        doc.setDrawColor(59, 130, 246);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, boxY, pageWidth - 28, 40, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246);
        doc.text('SmartCart AI Performance Analysis', 20, boxY + 10);
        
        doc.setFontSize(18);
        doc.text(`${aiAnalysis.score} / 10`, 20, boxY + 22);
        
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(aiAnalysis.text, pageWidth - 40);
        doc.text(splitText, 20, boxY + 30);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('This is a computer-generated configuration. Prices and availability are subject to change.', 14, doc.internal.pageSize.getHeight() - 10);

        doc.save(`SmartCart_PC_Build_${Date.now()}.pdf`);
    };

    // --- Smart AI Logic (Mock Evaluator) ---
    const getAiAnalysis = () => {
        const partsCount = Object.keys(selectedParts).length;
        if (partsCount === 0) return { score: 0, text: "Select components to see your build's potential.", type: "neutral", analysis: {} };
        
        let score = 5.0;
        let text = "Good start!";
        let type = "warning";
        
        // Core components check
        const hasCore = ['processor', 'motherboard', 'ram'].every(c => selectedParts[c]);
        
        if (hasCore) {
            score += 2.0;
            text = "Solid core foundation detected.";
            type = "success";
            
            // PSU Check (Simple heuristic)
            const isHighEndGpu = selectedParts.gpu && selectedParts.gpu.price > 60000;
            const hasWeakPsu = selectedParts.psu && selectedParts.psu.price < 5000;
            
            if (isHighEndGpu && hasWeakPsu) {
                text = "Warning: High-end GPU requires a more robust PSU (at least 750W-850W) for stability.";
                type = "error";
                score -= 1.5;
            } else if (isHighEndGpu && selectedParts.processor && selectedParts.processor.price < 30000) {
                text = "Bottleneck detected: Your GPU is much faster than your CPU. Consider a Ryzen 7 or i7 for optimal 1440p gaming.";
                type = "warning";
                score -= 1.0;
            } else if (Object.keys(selectedParts).length > 8) {
                score = Math.min(9.8, score + 1.5);
                text = "Excellent balance! This rig will dominate any modern title at 4K Ultra settings.";
                type = "success";
            }
        } else {
            text = "Complete the core (CPU + Mobo + RAM) for a detailed compatibility score.";
        }
        
        // Give 10/10 for full builds
        if (partsCount === PC_CATEGORIES.length) {
            score = 10.0;
            text = "Masterpiece! This configuration is perfectly balanced for maximum performance.";
            type = "success";
        }

        // Detailed analysis breakdown for UI/PDF
        const analysis = {
            'CPU Power': selectedParts.processor ? (selectedParts.processor.price > 40000 ? 'Extreme' : 'Balanced') : 'N/A',
            'GPU Power': selectedParts.gpu ? (selectedParts.gpu.price > 60000 ? 'Ultra' : 'High') : 'N/A',
            'Memory': selectedParts.ram ? 'High Speed' : 'N/A',
            'Storage': selectedParts.storage1 ? 'Fast NVMe' : 'N/A',
            'Thermals': selectedParts.cooling ? 'Optimal' : 'Standard',
            'Keyboard': selectedParts.keyboard ? (selectedParts.keyboard.price > 5000 ? 'Premium' : 'Standard') : 'N/A'
        };

        return { score: score.toFixed(1), text, type, analysis };
    };
    
    // Check compatibility errors (Red flags)
    const getCompatibilityErrors = () => {
        const errors = [];
        const { processor, motherboard } = selectedParts;
        
        // Very basic mock heuristic: AMD string matching
        if (processor && motherboard) {
             const isAmdCpu = processor.name.toLowerCase().includes('ryzen');
             const isAmdMob = motherboard.name.toLowerCase().includes('x670') || motherboard.name.toLowerCase().includes('b550');
             const isIntelCpu = processor.name.toLowerCase().includes('intel');
             const isIntelMob = motherboard.name.toLowerCase().includes('z790') || motherboard.name.toLowerCase().includes('b760');
             
             if (isAmdCpu && isIntelMob) errors.push("Incompatible: AMD Ryzen CPU selected with an Intel Motherboard.");
             if (isIntelCpu && isAmdMob) errors.push("Incompatible: Intel CPU selected with an AMD Motherboard.");
        }
        
        if (errors.length === 0 && Object.keys(selectedParts).length > 2) {
             return [{ type: 'success', msg: 'All selected components appear compatible.' }];
        } else if (errors.length > 0) {
             return errors.map(e => ({ type: 'error', msg: e }));
        }
        return [];
    };

    const ai = getAiAnalysis();
    const compatibility = getCompatibilityErrors();
    
    // Dynamic preview image
    const getPreviewImage = () => {
        if (selectedParts.cabinet) return formatImageUrl(selectedParts.cabinet.image_url);
        if (selectedParts.gpu) return formatImageUrl(selectedParts.gpu.image_url);
        if (selectedParts.processor) return formatImageUrl(selectedParts.processor.image_url);
        return "/custom-pc-placeholder.png"; // Fallback if no images
    };

    return (
        <div className="custom-pc-container animate-fade-in">
            {/* Left Column - Parts List */}
            <div className="pc-builder-main">
                <div className="custom-pc-header">
                    <h1>Dream PC Builder</h1>
                    <p>Select components step-by-step. Our AI checks compatibility instantly.</p>
                </div>
                
                <div className="component-list">
                    {PC_CATEGORIES.map(category => {
                        const selected = selectedParts[category.id];
                        
                        return (
                            <div key={category.id} className="component-card">
                                <div className="component-info">
                                    <div className="component-icon">
                                        {category.icon}
                                    </div>
                                    <div className="component-details">
                                        <h3>{category.name}</h3>
                                        {selected ? (
                                            <div className="component-selected">
                                                <img 
                                                    src={formatImageUrl(selected.image_url)} 
                                                    alt={selected.name} 
                                                    onError={handleImageError}
                                                />
                                                <div>
                                                    <div className="component-selected-name" title={selected.name}>
                                                        {selected.name}
                                                    </div>
                                                    <div className="component-selected-price">
                                                        ₹{selected.price.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>None Selected</div>
                                        )}
                                    </div>
                                </div>
                                <div className="component-action">
                                    {selected ? (
                                        <div style={{display: 'flex', gap: '0.5rem'}}>
                                             <button className="btn-change" onClick={() => handleSelectClick(category)}>Change</button>
                                             <button className="btn-change" style={{color: '#ef4444', background: '#fef2f2'}} onClick={() => handleRemoveProduct(category.id)}>
                                                 <X size={16} />
                                             </button>
                                        </div>
                                    ) : (
                                        <button className="btn-select" onClick={() => handleSelectClick(category)}>
                                            <Plus size={16} style={{display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}} /> Select
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{marginTop: '2rem'}}>
                    <button className="btn-change" onClick={() => setSelectedParts({})}>
                        <RefreshCw size={14} style={{marginRight: '6px'}}/> Reset Build
                    </button>
                </div>
            </div>

            {/* Right Column - Summary & Preview */}
            <div className="summary-panel-wrapper">
                <div className="summary-panel">
                    
                    <div className="preview-visual">
                        <div className="preview-glow"></div>
                        {Object.keys(selectedParts).length > 0 ? (
                           <div className="build-gallery">
                               {PC_CATEGORIES.map(cat => {
                                   const part = selectedParts[cat.id];
                                   if (!part) return null;
                                   return (
                                       <div key={cat.id} className="gallery-item animate-pop-in">
                                           <img 
                                                src={formatImageUrl(part.image_url)} 
                                                alt={part.name} 
                                                title={part.name} 
                                                onError={handleImageError}
                                           />
                                           <div className="gallery-item-label">{cat.name.split(' ')[0]}</div>
                                       </div>
                                   );
                               })}
                           </div>
                        ) : (
                           <div style={{color: '#94a3b8', textAlign: 'center', zIndex: 10}}>
                               <Server size={48} style={{margin: '0 auto', opacity: 0.5}} />
                               <p style={{marginTop: '0.5rem'}}>Select parts to preview</p>
                           </div>
                        )}
                    </div>
                    
                    {/* Compatibility Flags */}
                    {compatibility.length > 0 && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                            {compatibility.map((c, idx) => (
                                <div key={idx} className={`compatibility-badge ${c.type}`}>
                                    {c.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                    {c.msg}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* AI Analysis Widget */}
                    <div className="ai-analysis">
                        <div className="ai-header">
                            <Sparkles size={18} className="text-blue-500" /> SmartCart AI Analysis
                        </div>
                        <div className="ai-rating">
                            {ai.score} <span>/ 10</span>
                        </div>
                        <div className="ai-tip">
                            {ai.type === 'warning' ? <AlertTriangle size={14} style={{marginTop: '2px', color: '#b45309'}}/> : <CheckCircle size={14} style={{marginTop: '2px', color: '#166534'}} />}
                            <span>{ai.text}</span>
                        </div>

                        {/* Analysis Breakdown */}
                        {ai.analysis && Object.keys(ai.analysis).length > 0 && (
                            <div className="ai-breakdown" style={{ marginTop: '1rem', borderTop: '1px solid rgba(59, 130, 246, 0.1)', paddingTop: '0.8rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {Object.entries(ai.analysis).map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', paddingBottom: '4px', borderBottom: '1px solid #f8fafc' }}>
                                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{key}</span>
                                            <span style={{ color: '#4a6cf7', fontWeight: 800 }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Pricing */}
                    <div className="price-summary">
                        <div className="price-row">
                            <span>Components Selected:</span>
                            <span>{Object.keys(selectedParts).length} / {PC_CATEGORIES.length}</span>
                        </div>
                        <div className="price-row">
                            <span>Assembly Fee:</span>
                            <span style={{color: '#16a34a'}}>FREE</span>
                        </div>
                        <div className="price-total">
                            <span>Total Build Price</span>
                            <span>₹{totalPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    
                    <div className="action-buttons">
                        <button className="btn-full btn-primary" onClick={handleBuyNow}>
                             Buy Now
                        </button>
                        <button className="btn-full btn-secondary" onClick={() => handleAddToCart(true)}>
                            <ShoppingCart size={18} /> Add to Cart
                        </button>
                    </div>
                    <button className="btn-change mt-2" style={{width: '100%'}} onClick={saveBuild}>
                        Save Configuration
                    </button>
                    <button className="btn-change mt-2" style={{width: '100%', background: '#3b82f6', color: 'white'}} onClick={downloadPDF}>
                        Download Configuration (PDF)
                    </button>
                </div>
            </div>

            {/* Selection Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="build-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Select {currentCategory?.name}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {loadingProducts ? (
                                <div className="modal-loading">
                                    <Loader2 className="spinner" size={32} />
                                    Loading components...
                                </div>
                            ) : products.length === 0 ? (
                                <div className="modal-loading">
                                    <Box size={48} style={{opacity: 0.3}} />
                                    No components found for this category.
                                </div>
                            ) : (
                                <div className="product-grid">
                                    {products.map(p => (
                                        <div key={p.id} className="product-select-card" onClick={() => handleSelectProduct(p)}>
                                            <img 
                                                src={formatImageUrl(p.image_url)} 
                                                alt={p.name} 
                                                className="product-select-img" 
                                                onError={handleImageError}
                                            />
                                            <div className="product-select-info">
                                                <h4>{p.name}</h4>
                                                <BadgeSpecs specs={p.specifications} />
                                                <div className="product-select-price mt-2">
                                                    ₹{p.price.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component to render a few key specs in the modal cards
const BadgeSpecs = ({ specs }) => {
    if (!specs) return null;
    const keys = Object.keys(specs).slice(0, 2); // Show top 2 specs
    return (
        <div style={{display:'flex', gap:'0.25rem', flexWrap:'wrap', marginTop:'0.25rem'}}>
            {keys.map(k => (
                <span key={k} style={{fontSize:'0.75rem', background:'#f1f5f9', color:'#475569', padding:'2px 6px', borderRadius:'4px'}}>
                    {specs[k]}
                </span>
            ))}
        </div>
    );
};

export default CustomPC;
