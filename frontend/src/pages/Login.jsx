import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, X, AlertCircle, Eye, EyeOff, ShoppingCart } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await login(email, password);
            if (data.role === 'admin') {
                navigate('/admin');
            } else if (data.role === 'staff') {
                navigate('/staff');
            } else if (data.role === 'delivery_agent') {
                navigate('/delivery');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        navigate('/');
    };

    return (
        <div className="spacer-auth-page">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <clipPath id="wavy-mask" clipPathUnits="objectBoundingBox">
                        <path d="M0,0 C0,0 0.8,0.15 0.8,0.31 C0.8,0.47 0.2,0.6 0.2,0.75 C0.2,0.9 1,1 1,1 H0 V0 Z" />
                    </clipPath>
                </defs>
            </svg>

            <div className="spacer-auth-card">
                <div className="spacer-close-btn" onClick={handleClose}>
                    <X size={24} />
                </div>

                <div className="spacer-sidebar">
                    <div className="spacer-brand-icon">
                        <ShoppingCart size={44} strokeWidth={2.5} />
                    </div>
                    <h2>Welcome to</h2>
                    <h2 className="-mt-3 mb-6">SmartCart</h2>
                    <p className="text-blue-100/80">
                        The ultimate destination for premium computing and professional hardware.
                    </p>

                </div>

                <div className="spacer-sidebar-wave"></div>

                <div className="spacer-form-area">
                    <div className="spacer-form-header">
                        <h3>Sign In</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 mb-8 flex items-center gap-3 text-sm animate-shake">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div className="spacer-input-group">
                            <label className="spacer-input-label">E-mail Address</label>
                            <div className="spacer-input-wrapper">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Mail className="spacer-input-decorator" size={20} />
                            </div>
                        </div>

                        <div className="spacer-input-group">
                            <label className="spacer-input-label">Password</label>
                            <div className="spacer-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div
                                    className="spacer-input-decorator cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </div>
                            </div>
                        </div>

                        <div className="spacer-actions-row mt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="spacer-btn-primary"
                            >
                                {isLoading ? 'Verifying...' : 'Sign In'}
                            </button>

                            <Link to="/register" className="spacer-btn-outline">
                                Sign Up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
