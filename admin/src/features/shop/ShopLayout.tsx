import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, LogOut, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShopLayout() {
    const navigate = useNavigate();
    const token = localStorage.getItem('shop_token');
    const [cartCount, setCartCount] = useState(0); // We will integrate this properly with global state if needed, or localstorage

    const handleLogout = () => {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_customer');
        toast.success("Logged out successfully");
        navigate('/shop/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <header style={{
                position: 'sticky',
                top: 0,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--glass-border)',
                zIndex: 100,
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/shop')}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '8px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
                    }}>G</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        UK Grocery
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button 
                        onClick={() => navigate('/shop/cart')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--text-secondary)' }}
                    >
                        <ShoppingCart size={24} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -8, right: -12, background: 'var(--danger)', color: 'white',
                                borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {token ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Link to="/shop/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                <UserIcon size={20} />
                                <span style={{ fontWeight: 500 }}>Profile</span>
                            </Link>
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/shop/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            Sign In
                        </Link>
                    )}
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                <Outlet />
            </main>
            
            <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center', marginTop: '60px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    &copy; {new Date().getFullYear()} UK Grocery Online. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
