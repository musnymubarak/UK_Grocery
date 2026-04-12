import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Star, Plus, Trash2, Award } from 'lucide-react';

export default function RewardsPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        threshold_amount: '',
        reward_type: 'flat_discount',
        reward_value: '',
        expiry_days: '30'
    });

    const { data: tiers = [], isLoading } = useQuery({
        queryKey: ['rewards_tiers'],
        queryFn: async () => {
            const res = await rewardsApi.listTiers();
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => rewardsApi.createTier(data),
        onSuccess: () => {
            toast.success('Reward Tier created');
            setIsCreating(false);
            setFormData({ name: '', threshold_amount: '', reward_type: 'flat_discount', reward_value: '', expiry_days: '30' });
            queryClient.invalidateQueries({ queryKey: ['rewards_tiers'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rewardsApi.deleteTier(id),
        onSuccess: () => {
            toast.success('Tier deleted');
            queryClient.invalidateQueries({ queryKey: ['rewards_tiers'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            ...formData,
            threshold_amount: parseFloat(formData.threshold_amount),
            reward_value: parseFloat(formData.reward_value),
            expiry_days: parseInt(formData.expiry_days, 10)
        });
    };

    if (isLoading) return <div className="page-content">Loading...</div>;

    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 8 }}>Loyalty & Rewards</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Automated spending milestones and point generation levels.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={18} /> New Tier
                </button>
            </div>

            {isCreating && (
                <div className="card" style={{ marginBottom: 32, borderTop: '4px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24 }}>Define New Spending Tier</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Tier Name</label>
                                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Gold Platter Monthly" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Spend Threshold Trigger (£)</label>
                                <input required type="number" step="1" className="form-input" value={formData.threshold_amount} onChange={e => setFormData({ ...formData, threshold_amount: e.target.value })} placeholder="e.g. 500" />
                            </div>
                        </div>

                        <h4 style={{ fontSize: '1rem', marginTop: 12, marginBottom: 12 }}>Reward Distributed</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={formData.reward_type} onChange={e => setFormData({ ...formData, reward_type: e.target.value })}>
                                    <option value="percentage_discount">Percentage Discount (%)</option>
                                    <option value="flat_discount">Flat Discount (£)</option>
                                    <option value="free_delivery">Free Delivery</option>
                                </select>
                            </div>
                            {formData.reward_type !== 'free_delivery' && (
                                <div className="form-group">
                                    <label className="form-label">Value</label>
                                    <input required type="number" step="0.01" className="form-input" value={formData.reward_value} onChange={e => setFormData({ ...formData, reward_value: e.target.value })} />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Coupon Lifespan (Days)</label>
                                <input required type="number" className="form-input" value={formData.expiry_days} onChange={e => setFormData({ ...formData, expiry_days: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Saving...' : 'Establish Tier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {tiers.map((tier: any) => (
                    <div key={tier.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ padding: 16, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)' }}>
                                <Award size={32} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0' }}>{tier.name}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Unlocked at <strong style={{ color: 'var(--text-primary)' }}>£{tier.threshold_amount}</strong> monthly spend
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reward Output</p>
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--success)' }}>
                                    {tier.reward_type === 'percentage_discount' ? `${tier.reward_value}% Off` : tier.reward_type === 'flat_discount' ? `£${tier.reward_value} Off` : 'Free Delivery'}
                                </p>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 32 }}>
                                <button onClick={() => { if(window.confirm('Delete tier?')) deleteMutation.mutate(tier.id) }} className="btn-icon" style={{ borderColor: 'transparent', color: 'var(--danger)' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {tiers.length === 0 && !isCreating && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <Star size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <p>No reward tiers defined. Create one to incentivize your shoppers!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
