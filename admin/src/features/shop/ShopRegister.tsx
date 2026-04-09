import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ShopRegister() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Need a configured org_id. For demo, bypassing strict org context matching.
            // Fast API customer register endpoint expects CustomerCreate payload
            await axios.post('/api/v1/customers/register', { 
                full_name: fullName, 
                email, 
                password, 
                phone 
            });
            toast.success('Registration successful! Please sign in.');
            navigate('/shop/login');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail 
                ? (Array.isArray(err.response.data.detail) ? err.response.data.detail[0].msg : err.response.data.detail) 
                : 'Registration failed';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '40px auto', background: 'var(--bg-card)', padding: '40px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>Join us for fresh deliveries</p>

            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        required 
                    />
                </div>
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
                <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                        type="tel" 
                        className="form-input" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
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
                        minLength={6}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/shop/login" style={{ fontWeight: 600 }}>Sign In</Link>
            </div>
        </div>
    );
}
