import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

// The customer auth has a different token logic directly hitting /api/v1/customers/login
export default function ShopLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post('/api/v1/customers/login', { email, password });
            localStorage.setItem('shop_token', res.data.access_token);
            toast.success('Welcome back!');
            navigate('/shop');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', background: 'var(--bg-card)', padding: '40px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>Sign in to continue your grocery shopping</p>

            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                        type="email" 
                        className="form-input" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '32px' }}>
                    <label className="form-label">Password</label>
                    <input 
                        type="password" 
                        className="form-input" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Don't have an account? <Link to="/shop/register" style={{ fontWeight: 600 }}>Create one</Link>
            </div>
        </div>
    );
}
