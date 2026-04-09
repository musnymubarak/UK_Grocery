import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function ShopHome() {
    // In a real B2C scenario, we'd determine store_id by geolocation or user selection.
    // For this demonstration, we'll fetch all products globally or just the first store's products.
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['shop_products'],
        queryFn: async () => {
            const res = await productApi.list();
            return res.data;
        },
    });

    const handleAddToCart = (product: any) => {
        // Very basic local storage cart handling for B2C
        try {
            const currentCartStr = localStorage.getItem('shop_cart');
            let cart = currentCartStr ? JSON.parse(currentCartStr) : [];
            
            const existing = cart.find((i: any) => i.product_id === product.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    product_id: product.id,
                    product_name: product.name,
                    product_sku: product.sku,
                    unit_price: product.price,
                    quantity: 1
                });
            }
            localStorage.setItem('shop_cart', JSON.stringify(cart));
            toast.success(`${product.name} added to cart`);
            
            // Dispatch event to update layout counter
            window.dispatchEvent(new Event('cart_updated'));
        } catch(e) {
            toast.error("Failed to add to cart");
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading catalog...</div>;

    return (
        <div>
            {/* Banner/Offers Section */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                borderRadius: 'var(--radius-xl)',
                padding: '40px 60px',
                color: 'white',
                marginBottom: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px 0' }}>Fresh Groceries, Delivered Daily</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, margin: '0 0 24px 0', maxWidth: '600px' }}>
                    Join our membership today and enjoy free delivery on all orders over £50. Farm-fresh produce straight to your doorstep.
                </p>
                <div>
                    <button className="btn" style={{ background: 'white', color: 'var(--primary-dark)', fontWeight: 700, padding: '12px 24px' }}>
                        Join Now
                    </button>
                </div>
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 700 }}>Featured Products</h3>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '24px'
            }}>
                {products.map((product: any) => (
                    <div key={product.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                        {/* Placeholder for image */}
                        <div style={{ 
                            width: '100%', height: '160px', background: 'var(--bg-elevated)', 
                            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                            marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', color: 'var(--text-muted)', overflow: 'hidden'
                        }}>
                            {/* In a real app we load Image path. Here we just show placeholder text or emoji based on category */}
                            {product.name.charAt(0)}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{product.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{product.category_name}</div>
                            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>£{product.price.toFixed(2)}</div>
                        </div>
                        
                        <button 
                            className="btn btn-primary" 
                            style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
                            onClick={() => handleAddToCart(product)}
                        >
                            Add to Cart
                        </button>
                    </div>
                ))}
                
                {products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No products available today. Please check back later.
                    </div>
                )}
            </div>
        </div>
    );
}
