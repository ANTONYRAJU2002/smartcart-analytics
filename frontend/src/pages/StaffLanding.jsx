import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Shield,
    X,
    User,
    AlertCircle,
    Mail,
    Eye,
    EyeOff,
    Briefcase
} from 'lucide-react';

const StaffLanding = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [credentials, setCredentials] = useState({ name: '', email: '', password: '', role: 'staff' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                const data = await login(credentials.email, credentials.password);
                if (data.role === 'admin') {
                    navigate('/admin');
                } else if (data.role === 'staff') {
                    navigate('/staff');
                } else {
                    navigate('/');
                }
            } else {
                await register(credentials.name, credentials.email, credentials.password, credentials.role);
                alert("Registration successful. Please wait for Admin approval.");
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
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

                <div className="spacer-sidebar-premium">
                    <div className="spacer-brand-icon">
                        <Shield size={44} strokeWidth={2.5} />
                    </div>
                    <h2>Welcome to</h2>
                    <h1 className="spacer-analytics-title">SMARTCART ANALYTICS</h1>
                    <div className="spacer-analytics-tagline">
                        SECURE ACCESS • AUTHORIZED PERSONNEL
                    </div>
                </div>

                <div className="spacer-sidebar-wave"></div>

                <div className="spacer-form-area">
                    <div className="spacer-form-header">
                        <h3>{isLogin ? 'Staff Login' : 'Initialize Account'}</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 mb-6 flex items-center gap-3 text-sm animate-shake">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="spacer-input-group">
                                <label className="spacer-input-label">Full Name</label>
                                <div className="spacer-input-wrapper">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Officer Name"
                                        value={credentials.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <User className="spacer-input-decorator" size={20} />
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="spacer-input-group">
                                <label className="spacer-input-label">Assigned Role</label>
                                <div className="spacer-input-wrapper">
                                    <select
                                        name="role"
                                        value={credentials.role}
                                        onChange={handleChange}
                                        className="w-full py-3 bg-transparent border-none outline-none font-medium text-slate-900"
                                    >
                                        <option value="staff">Operational Staff</option>
                                        <option value="admin">System Administrator</option>
                                    </select>
                                    <Briefcase className="spacer-input-decorator" size={20} />
                                </div>
                            </div>
                        )}

                        <div className="spacer-input-group">
                            <label className="spacer-input-label">Corporate ID</label>
                            <div className="spacer-input-wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@smartcart.internal"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                />
                                <Mail className="spacer-input-decorator" size={20} />
                            </div>
                        </div>

                        <div className="spacer-input-group">
                            <label className="spacer-input-label">Security Key</label>
                            <div className="spacer-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••••••"
                                    value={credentials.password}
                                    onChange={handleChange}
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

                        <div className="spacer-actions-row mt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="spacer-btn-primary"
                            >
                                {isLoading ? 'Authenticating...' : (isLogin ? 'Login' : 'Sign Up')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="spacer-btn-outline"
                            >
                                {isLogin ? 'Register' : 'Back to Login'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StaffLanding;
