import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Tag } from 'lucide-react';

export default function CouponsPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage_discount',
        discount_value: '',
        minimum_order_value: '',
        max_redemptions: '',
        max_per_customer: '1',
    });

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const res = await couponApi.list();
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => couponApi.create(data),
        onSuccess: () => {
            toast.success('Coupon created');
            setIsCreating(false);
            setFormData({ code: '', discount_type: 'percentage_discount', discount_value: '', minimum_order_value: '', max_redemptions: '', max_per_customer: '1' });
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => couponApi.delete(id),
        onSuccess: () => {
            toast.success('Coupon deleted');
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            discount_value: parseFloat(formData.discount_value),
            minimum_order_value: formData.minimum_order_value ? parseFloat(formData.minimum_order_value) : null,
            max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions, 10) : null,
            max_per_customer: parseInt(formData.max_per_customer, 10),
        };
        createMutation.mutate(payload);
    };

    if (isLoading) return <div className="page-content">Loading coupons...</div>;

    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 8 }}>Coupons & Promotions</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage promotional codes, discounts, and free delivery offers.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={18} /> New Coupon
                </button>
            </div>

            {isCreating && (
                <div className="card" style={{ marginBottom: 32, borderTop: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24 }}>Create New Coupon</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Coupon Code</label>
                                <input required type="text" className="form-input" style={{ textTransform: 'uppercase' }} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Discount Type</label>
                                <select className="form-select" value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })}>
                                    <option value="percentage_discount">Percentage Discount (%)</option>
                                    <option value="flat_discount">Flat Discount (£)</option>
                                    <option value="free_delivery">Free Delivery</option>
                                </select>
                            </div>
                            {formData.discount_type !== 'free_delivery' && (
                                <div className="form-group">
                                    <label className="form-label">Discount Value</label>
                                    <input required type="number" step="0.01" className="form-input" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} placeholder="e.g. 10" />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Minimum Order Value (£)</label>
                                <input type="number" step="0.01" className="form-input" value={formData.minimum_order_value} onChange={e => setFormData({ ...formData, minimum_order_value: e.target.value })} placeholder="Optional" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Global Uses</label>
                                <input type="number" className="form-input" value={formData.max_redemptions} onChange={e => setFormData({ ...formData, max_redemptions: e.target.value })} placeholder="Optional limit (e.g. first 100 uses)" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Per Customer</label>
                                <input type="number" min="1" className="form-input" value={formData.max_per_customer} onChange={e => setFormData({ ...formData, max_per_customer: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {coupons.map((coupon: any) => (
                    <div key={coupon.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        {!coupon.is_active && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 100, color: 'var(--text-muted)' }}>Inactive</div>}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                <Tag size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', margin: 0, letterSpacing: '1px' }}>{coupon.code}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: '4px 0 0 0' }}>
                                    {coupon.discount_type.replace('_', ' ')}: {coupon.discount_type === 'percentage_discount' ? `${coupon.discount_value}%` : coupon.discount_type === 'flat_discount' ? `£${coupon.discount_value}` : 'Waives Delivery Fee'}
                                </p>
                            </div>
                        </div>

                        <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span>Used</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{coupon.current_redemptions} {coupon.max_redemptions ? `/ ${coupon.max_redemptions}` : ''}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span>Per Customer Limit</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{coupon.max_per_customer}</span>
                            </div>
                            {coupon.minimum_order_value && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span>Min. Order Value</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>£{coupon.minimum_order_value}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => { if(window.confirm('Delete coupon?')) deleteMutation.mutate(coupon.id) }} className="btn-icon" style={{ borderColor: 'transparent', color: 'var(--danger)' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {coupons.length === 0 && !isCreating && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <Tag size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                    <p>No coupons found. Create one to get started.</p>
                </div>
            )}
        </div>
    );
}
