import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

export default function ShopCart() {
    const [cart, setCart] = useState<any[]>([]);
    const [address, setAddress] = useState('');
    const [postcode, setPostcode] = useState('');
    const [instructions, setInstructions] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const currentCartStr = localStorage.getItem('shop_cart');
        if (currentCartStr) {
            setCart(JSON.parse(currentCartStr));
        }
    }, []);

    const updateQuantity = (productId: string, delta: number) => {
        const newCart = cart.map(item => {
            if (item.product_id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        });
        setCart(newCart);
        localStorage.setItem('shop_cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart_updated'));
    };

    const removeItem = (productId: string) => {
        const newCart = cart.filter(item => item.product_id !== productId);
        setCart(newCart);
        localStorage.setItem('shop_cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart_updated'));
    };

    // Subtotal
    const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    // Hardcoded fee for demo. In a real app we hit `/api/v1/delivery/calculate-fee`
    const deliveryFee = subtotal > 50 ? 0 : 5; 
    const total = subtotal + deliveryFee;

    const checkoutMutation = useMutation({
        mutationFn: async (data: any) => {
            // Need a store ID. For demo, we just use the first available from a public endpoint or hardcode.
            // But we actually need to hit a public checkout endpoint that figures it out.
            // Bypassing real logic for demo transformation.
            toast.error("Checkout requires a configured store and customer context (Not fully wired in demo)");
            // We would call: return orderApi.checkout(storeId, data);
            throw new Error("Demo checkout paused");
        },
        onSuccess: () => {
            toast.success('Order placed successfully!');
            localStorage.removeItem('shop_cart');
            setCart([]);
            window.dispatchEvent(new Event('cart_updated'));
            // navigate('/shop/orders');
        },
        onError: (err) => {
            // toast.error(getErrorMessage(err));
        }
    });

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('shop_token');
        if (!token) {
            toast.error("Please login to checkout");
            navigate('/shop/login');
            return;
        }

        if (cart.length === 0) return;

        checkoutMutation.mutate({
            items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            payment_method: 'credit_card',
            delivery_instructions: instructions,
            // In a real flow, we select a delivery_address_id
            delivery_address_id: "00000000-0000-0000-0000-000000000000" 
        });
    };

    if (cart.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Your Cart is Empty</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Looks like you haven't added any fresh groceries yet.</p>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '40px', alignItems: 'start' }}>
            
            {/* Cart Items */}
            <div className="card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>Shopping Cart</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {cart.map(item => (
                        <div key={item.product_id} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-muted)' }}>
                                {item.product_name.charAt(0)}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>{item.product_name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>£{item.unit_price.toFixed(2)} / each</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                                <button onClick={() => updateQuantity(item.product_id, -1)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px' }}>-</button>
                                <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product_id, 1)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px' }}>+</button>
                            </div>

                            <div style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '80px', textAlign: 'right' }}>
                                £{(item.unit_price * item.quantity).toFixed(2)}
                            </div>

                            <button onClick={() => removeItem(item.product_id)} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: 'var(--radius-sm)', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Checkout Form */}
            <div className="card" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Order Summary</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Delivery Fee</span>
                    <span>£{deliveryFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '1.5rem', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>£{total.toFixed(2)}</span>
                </div>

                <form onSubmit={handleCheckout}>
                    <div className="form-group">
                        <label className="form-label">Delivery Postcode</label>
                        <input type="text" className="form-input" placeholder="e.g. SW1A 1AA" required value={postcode} onChange={e=>setPostcode(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Delivery Address</label>
                        <textarea className="form-input" placeholder="Full address" rows={2} required value={address} onChange={e=>setAddress(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Delivery Notes</label>
                        <textarea className="form-input" placeholder="e.g. Leave by the front door" rows={2} value={instructions} onChange={e=>setInstructions(e.target.value)} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                        Proceed to Checkout
                    </button>
                </form>
            </div>

        </div>
    );
}
