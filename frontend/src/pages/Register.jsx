import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, X, AlertCircle, Eye, EyeOff, ShoppingCart } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await register(username, email, password);
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Please try again.');
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
                        Join our community of technology enthusiasts and enterprise professionals.
                    </p>

                </div>

                <div className="spacer-sidebar-wave"></div>

                <div className="spacer-form-area">
                    <div className="spacer-form-header">
                        <h3>Create your account</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 mb-6 flex items-center gap-3 text-sm animate-shake">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div className="spacer-input-group">
                            <label className="spacer-input-label">Name</label>
                            <div className="spacer-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <User className="spacer-input-decorator" size={20} />
                            </div>
                        </div>

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
                                    placeholder="Create a password"
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

                        <div className="spacer-actions-row">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="spacer-btn-primary"
                            >
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </button>

                            <Link to="/login" className="spacer-btn-outline">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
