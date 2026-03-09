import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { MapPin, Plus, Trash2, Package, User, ShoppingBag, CreditCard, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip_code: '', country: '' });
    const [loading, setLoading] = useState(true);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [tempPhone, setTempPhone] = useState('');
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [profRes, addrRes] = await Promise.all([
                    api.get('/auth/profile'),
                    api.get('/user/addresses')
                ]);
                setProfile(profRes.data);
                setAddresses(addrRes.data);
            } catch (err) {
                // console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/user/addresses', newAddress);
            setAddresses([...addresses, { ...newAddress, id: res.data.id }]);
            setNewAddress({ street: '', city: '', state: '', zip_code: '', country: '' });
            setShowAddressForm(false);
            alert('Address added');
        } catch (err) {
            alert('Failed to add address');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!confirm('Delete this address?')) return;
        try {
            await api.delete(`/user/addresses/${id}`);
            setAddresses(addresses.filter(a => a.id !== id));
        } catch (err) {
            alert('Failed to delete address');
        }
    };

    const handleUpdatePhone = async () => {
        try {
            await api.patch('/auth/profile', { phone_number: tempPhone });
            setProfile({ ...profile, phone_number: tempPhone });
            setIsEditingPhone(false);
        } catch (err) {
            alert('Failed to update phone number');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    if (loading) return <div className="flex items-center justify-center min-h-screen text-text-secondary">Loading Profile...</div>;
    if (!profile) return <div className="flex items-center justify-center min-h-screen text-danger">Please login to view profile</div>;

    return (
        <div className="layout-wrapper">
            <div className="bg-bg-main border-b border-border-color py-12">
                <div className="container">
                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/25 transition-transform hover:rotate-3">
                                <User size={40} className="text-white" />
                            </div>
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl font-bold text-text-main mb-1">{profile.username}</h1>
                                <p className="text-text-secondary mb-2">{profile.email}</p>

                                <div className="flex items-center gap-3 mb-6">
                                    {isEditingPhone ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="form-input py-1 px-3 text-sm w-48"
                                                placeholder="Contact Number"
                                                value={tempPhone}
                                                onChange={(e) => setTempPhone(e.target.value)}
                                            />
                                            <button
                                                onClick={handleUpdatePhone}
                                                className="text-xs font-bold text-primary hover:underline uppercase"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setIsEditingPhone(false)}
                                                className="text-xs font-bold text-text-muted hover:underline uppercase"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <p className="text-text-muted text-sm font-medium">
                                                {profile.phone_number || 'No contact number added'}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setTempPhone(profile.phone_number || '');
                                                    setIsEditingPhone(true);
                                                }}
                                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                                            >
                                                {profile.phone_number ? 'Edit' : 'Add Contact'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-8 justify-center md:justify-start">
                                    <div>
                                        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider font-semibold mb-1">
                                            <CreditCard size={14} /> Total Spent
                                        </div>
                                        <div className="text-2xl font-bold text-success">{formatCurrency(profile.total_spent)}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider font-semibold mb-1">
                                            <ShoppingBag size={14} /> Orders
                                        </div>
                                        <div className="text-2xl font-bold text-text-main">{profile.total_orders}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            title="Logout"
                            className="group w-24 h-24 flex flex-col items-center justify-center bg-white border border-rose-100 text-rose-600 rounded-full hover:bg-rose-50 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 active:scale-95"
                        >
                            <LogOut size={28} className="group-hover:translate-x-1 transition-transform mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container py-12 space-y-12">
                {/* Address Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                            <MapPin size={24} className="text-primary" /> Saved Addresses
                        </h2>
                        <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="btn btn-secondary rounded-full px-4 py-2 text-sm flex items-center gap-2"
                        >
                            <Plus size={16} /> Add New
                        </button>
                    </div>

                    {showAddressForm && (
                        <div className="bg-white p-6 rounded-2xl border border-border-color shadow-sm mb-6 max-w-2xl">
                            <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="Street Address"
                                    className="col-span-1 md:col-span-2 form-input"
                                    value={newAddress.street}
                                    onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="City"
                                    className="form-input"
                                    value={newAddress.city}
                                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="State"
                                    className="form-input"
                                    value={newAddress.state}
                                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Zip Code"
                                    className="form-input"
                                    value={newAddress.zip_code}
                                    onChange={e => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Country"
                                    className="form-input"
                                    value={newAddress.country}
                                    onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
                                    required
                                />
                                <div className="col-span-1 md:col-span-2 flex justify-end">
                                    <button type="submit" className="btn btn-primary rounded-lg px-6 py-2">
                                        Save Address
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {addresses.map(addr => (
                            <div key={addr.id} className="bg-white p-6 rounded-xl border border-border-color relative group hover:shadow-md transition-shadow">
                                <div className="flex gap-4">
                                    <div className="bg-bg-main p-2 rounded-lg h-fit text-primary">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-main mb-1">{addr.street}</p>
                                        <p className="text-sm text-text-secondary">{addr.city}, {addr.state} {addr.zip_code}</p>
                                        <p className="text-sm text-text-secondary mb-2">{addr.country}</p>
                                        {addr.is_default && <span className="inline-block text-xs bg-success-bg/20 text-success px-2 py-0.5 rounded border border-success-bg/30">Default</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="absolute top-4 right-4 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {addresses.length === 0 && !showAddressForm && (
                            <div className="col-span-full text-center py-8 text-text-muted italic bg-bg-main rounded-xl border border-dashed border-border-color">
                                No addresses saved.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Profile;
