import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Shield } from 'lucide-react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, amount, onPaymentSuccess, title, subtitle, initialMethod }) => {
    const [step, setStep] = useState('selection'); // selection, processing, success
    const [selectedMethod, setSelectedMethod] = useState(initialMethod || null);

    useEffect(() => {
        if (isOpen) {
            if (initialMethod) {
                setStep('processing');
                // Auto-advance for digital payments already selected
                const timer = setTimeout(() => {
                    setStep('success');
                    const successTimer = setTimeout(() => {
                        onPaymentSuccess();
                    }, 2000);
                    return () => clearTimeout(successTimer);
                }, 3000);
                return () => clearTimeout(timer);
            } else {
                setStep('selection');
                setSelectedMethod(null);
            }
        }
    }, [isOpen, initialMethod, onPaymentSuccess]);

    const handlePay = () => {
        if (!selectedMethod) return;
        setStep('processing');
        // Advance logic
        const processTimer = setTimeout(() => {
            setStep('success');
            const successTimer = setTimeout(() => {
                onPaymentSuccess();
            }, 2000);
            return () => clearTimeout(successTimer);
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="rzp-overlay">
            <div className="rzp-modal animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="rzp-header">
                    <div className="rzp-header-left">
                        <div className="rzp-merchant-logo">S</div>
                        <div className="rzp-merchant-info">
                            <span className="rzp-merchant-name">{title || 'SmartCart Checkout'}</span>
                            <span className="rzp-order-id">{subtitle || 'Secure Transaction'}</span>
                        </div>
                    </div>
                    <div className="rzp-header-right">
                        <span className="rzp-amount">₹{amount?.toLocaleString('en-IN')}</span>
                        <X size={20} className="rzp-close" onClick={onClose} />
                    </div>
                </div>

                {/* Content */}
                <div className="rzp-content">
                    {step === 'selection' ? (
                        <div className="rzp-selection-container">
                            <h4 className="rzp-step-title">Select Payment Method</h4>
                            <div className="rzp-methods-list">
                                <div 
                                    className={`rzp-method-item ${selectedMethod === 'upi' ? 'selected' : ''}`}
                                    onClick={() => setSelectedMethod('upi')}
                                >
                                    <div className="rzp-method-icon"><Smartphone size={20} /></div>
                                    <div className="rzp-method-info">
                                        <span className="rzp-method-name">UPI / Google Pay</span>
                                        <span className="rzp-method-desc">Pay via your UPI ID</span>
                                    </div>
                                    <div className="rzp-radio"></div>
                                </div>

                                <div 
                                    className={`rzp-method-item ${selectedMethod === 'card' ? 'selected' : ''}`}
                                    onClick={() => setSelectedMethod('card')}
                                >
                                    <div className="rzp-method-icon"><CreditCard size={20} /></div>
                                    <div className="rzp-method-info">
                                        <span className="rzp-method-name">Credit / Debit Card</span>
                                        <span className="rzp-method-desc">Visa, Mastercard, RuPay</span>
                                    </div>
                                    <div className="rzp-radio"></div>
                                </div>
                            </div>

                            {selectedMethod && (
                                <div className="rzp-method-details">
                                    {selectedMethod === 'upi' ? (
                                        <div className="rzp-input-group">
                                            <label>Enter UPI ID</label>
                                            <input type="text" placeholder="e.g. mobile@upi" className="rzp-field" />
                                        </div>
                                    ) : (
                                        <div className="rzp-card-group">
                                            <div className="rzp-input-group">
                                                <label>Card Details</label>
                                                <input type="text" placeholder="Card Number" className="rzp-field" />
                                            </div>
                                            <div className="rzp-field-row">
                                                <input type="text" placeholder="MM/YY" className="rzp-field" />
                                                <input type="password" placeholder="CVV" className="rzp-field" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                className={`rzp-pay-btn ${selectedMethod ? 'ready' : ''}`}
                                disabled={!selectedMethod}
                                onClick={handlePay}
                            >
                                Pay ₹{amount?.toLocaleString('en-IN')}
                            </button>
                        </div>
                    ) : step === 'processing' ? (
                        <div className="rzp-processing-container">
                            <div className="rzp-loading-wrapper">
                                <div className="rzp-coin-spinner">
                                    <div className="rzp-coin-side"></div>
                                </div>
                                <div className="rzp-ring-spinner"></div>
                            </div>
                            <h3>Processing Payment</h3>
                            <p>Communicating with bank... Please wait</p>
                        </div>
                    ) : (
                        <div className="rzp-success-container">
                            <div className="rzp-success-circle">
                                <ShieldCheck size={48} />
                            </div>
                            <h3>Payment Successful</h3>
                            <p>Your order is being finalized</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="rzp-footer">
                    <div className="rzp-footer-badge">
                        <ShieldCheck size={14} />
                        <span>Trusted by 50L+ businesses</span>
                    </div>
                    <div className="rzp-footer-secured">
                        <span>RAZORPAY SECURE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
