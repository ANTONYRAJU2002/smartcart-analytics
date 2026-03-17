import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { MapPin, Plus, Trash2, User, LogOut, Edit3, Check, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Profile Edit State
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [tempPhone, setTempPhone] = useState('');
    
    // Address Form State
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({ 
        street: '', city: '', state: '', zip_code: '', country: '' 
    });

    const { logout } = useContext(AuthContext);

    const fetchProfileData = async () => {
        try {
            const [profRes, addrRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/user/addresses')
            ]);
            setProfile(profRes.data);
            setAddresses(addrRes.data);
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAddressId) {
                await api.put(`/user/addresses/${editingAddressId}`, addressForm);
                alert('Address updated');
            } else {
                await api.post('/user/addresses', addressForm);
                alert('Address added');
            }
            fetchProfileData();
            resetAddressForm();
        } catch {
            alert('Operation failed');
        }
    };

    const resetAddressForm = () => {
        setAddressForm({ street: '', city: '', state: '', zip_code: '', country: '' });
        setEditingAddressId(null);
        setShowAddressForm(false);
    };

    const handleEditAddress = (addr) => {
        setAddressForm({
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code,
            country: addr.country
        });
        setEditingAddressId(addr.id);
        setShowAddressForm(true);
        window.scrollTo({ top: document.querySelector('.profile-address-section').offsetTop - 20, behavior: 'smooth' });
    };

    const handleDeleteAddress = async (id) => {
        if (!confirm('Delete this address?')) return;
        try {
            await api.delete(`/user/addresses/${id}`);
            setAddresses(addresses.filter(a => a.id !== id));
        } catch {
            alert('Failed to delete address');
        }
    };

    const handleUpdatePhone = async () => {
        try {
            await api.patch('/auth/profile', { phone_number: tempPhone });
            setProfile({ ...profile, phone_number: tempPhone });
            setIsEditingPhone(false);
        } catch {
            alert('Failed to update phone number');
        }
    };


    if (loading) return <div className="profile-page-wrapper flex items-center justify-center">Loading Profile...</div>;
    if (!profile) return <div className="profile-page-wrapper flex items-center justify-center text-red-500 font-bold">Please login to view profile</div>;

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                
                {/* PROFILE CARD */}
                <div className="profile-card animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="profile-avatar">
                        <User size={48} />
                    </div>
                    <h2>{profile.username}</h2>
                    <p className="email">{profile.email}</p>
                    
                    <div className="profile-phone-box">
                        📞 {isEditingPhone ? (
                            <div className="flex gap-2">
                                <input 
                                    className="profile-input py-1 px-3 text-sm w-48"
                                    value={tempPhone}
                                    onChange={e => setTempPhone(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleUpdatePhone} className="profile-edit-btn text-green-600 border-green-100 hover:bg-green-50"><Check size={14}/></button>
                                <button onClick={() => setIsEditingPhone(false)} className="profile-edit-btn text-red-600 border-red-100 hover:bg-red-50"><X size={14}/></button>
                            </div>
                        ) : (
                            <>
                                <span className="font-bold">{profile.phone_number || 'No contact number'}</span>
                                <button 
                                    onClick={() => { setTempPhone(profile.phone_number || ''); setIsEditingPhone(true); }}
                                    className="profile-edit-btn"
                                >
                                    Edit
                                </button>
                            </>
                        )}
                    </div>

                    <div className="profile-stats-row" style={{ justifyContent: 'center' }}>
                        <button onClick={logout} className="profile-logout-btn">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>

                {/* ADDRESS SECTION */}
                <div className="profile-address-section animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="profile-address-header">
                        <h3>📍 Saved Addresses</h3>
                        {!showAddressForm && (
                            <button onClick={() => setShowAddressForm(true)} className="profile-add-btn">
                                + Add New
                            </button>
                        )}
                    </div>

                    {showAddressForm && (
                        <div className="profile-address-box" style={{ background: '#fff', borderColor: '#4f46e5' }}>
                            <h4 className="font-bold mb-4">{editingAddressId ? 'Edit Address' : 'New Address'}</h4>
                            <form onSubmit={handleAddressSubmit}>
                                <div className="profile-input-group">
                                    <label>Street Address</label>
                                    <input 
                                        required className="profile-input" 
                                        value={addressForm.street} 
                                        onChange={e => setAddressForm({...addressForm, street: e.target.value})} 
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="profile-input-group flex-1">
                                        <label>City</label>
                                        <input 
                                            required className="profile-input" 
                                            value={addressForm.city} 
                                            onChange={e => setAddressForm({...addressForm, city: e.target.value})} 
                                        />
                                    </div>
                                    <div className="profile-input-group flex-1">
                                        <label>State</label>
                                        <input 
                                            required className="profile-input" 
                                            value={addressForm.state} 
                                            onChange={e => setAddressForm({...addressForm, state: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="profile-input-group flex-1">
                                        <label>ZIP Code</label>
                                        <input 
                                            required className="profile-input" 
                                            value={addressForm.zip_code} 
                                            onChange={e => setAddressForm({...addressForm, zip_code: e.target.value})} 
                                        />
                                    </div>
                                    <div className="profile-input-group flex-1">
                                        <label>Country</label>
                                        <input 
                                            required className="profile-input" 
                                            value={addressForm.country} 
                                            onChange={e => setAddressForm({...addressForm, country: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="profile-form-actions">
                                    <button type="button" onClick={resetAddressForm} className="profile-cancel-btn">Cancel</button>
                                    <button type="submit" className="profile-save-btn">Save Address</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {addresses.map(addr => (
                        <div key={addr.id} className="profile-address-box">
                            <p><strong>{addr.street}</strong></p>
                            <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                            <p>{addr.country}</p>

                            <div className="profile-address-actions">
                                <button onClick={() => handleEditAddress(addr)} className="address-action-btn">
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button onClick={() => handleDeleteAddress(addr.id)} className="address-action-btn delete">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {addresses.length === 0 && !showAddressForm && (
                        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                           <MapPin size={32} className="mx-auto mb-2 opacity-20" />
                           <p>No addresses found. Add one to speed up checkout!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;
