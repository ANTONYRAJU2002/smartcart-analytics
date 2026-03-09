import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    // Response is { id, role, username }
                    setUser(res.data);
                } catch (err) {
                    console.error("Auth check failed", err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        const { access_token, role, username: dbUsername } = res.data; // Ensure backend sends these
        localStorage.setItem('token', access_token);
        // Since backend might return token structure differently, adapt here
        // But our decode is in /me. For immediate update:
        setUser({ username: dbUsername || username, role });
        return res.data;
    };

    const register = async (username, email, password, role = 'customer') => {
        await api.post('/auth/register', { username, email, password, role });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
