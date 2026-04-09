import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryZoneApi, getErrorMessage } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import toast from 'react-hot-toast';

export default function DeliveryZonesPage() {
    const { selectedStore } = useAdminStore();
    const queryClient = useQueryClient();
    
    const [name, setName] = useState('');
    const [baseFee, setBaseFee] = useState(0);
    const [freeDeliveryOver, setFreeDeliveryOver] = useState(0);
    const [postcodes, setPostcodes] = useState('');

    const { data: zones = [], isLoading } = useQuery({
        queryKey: ['delivery_zones', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await deliveryZoneApi.list(selectedStore.id);
            return res.data;
        },
        enabled: !!selectedStore?.id,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => deliveryZoneApi.create(selectedStore!.id, data),
        onSuccess: () => {
            toast.success('Zone created');
            queryClient.invalidateQueries({ queryKey: ['delivery_zones'] });
            setName('');
            setBaseFee(0);
            setFreeDeliveryOver(0);
            setPostcodes('');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const patterns = postcodes.split(',').map(s => s.trim()).filter(Boolean);
        if (!name || patterns.length === 0) {
            toast.error('Name and at least one postcode are required');
            return;
        }
        createMutation.mutate({
            name,
            base_fee: baseFee,
            per_km_fee: 0,
            min_order_for_free_delivery: freeDeliveryOver,
            is_active: true,
            postcode_patterns: patterns
        });
    };

    if (!selectedStore) {
        return <div className="p-8">Please select a store to manage delivery zones.</div>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Delivery Zones</h3>
                </div>
                {isLoading ? <div>Loading...</div> : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Zone Name</th>
                                    <th>Base Fee</th>
                                    <th>Free Delivery &gt;=</th>
                                    <th>Coverage (Postcodes)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zones.map((z: any) => (
                                    <tr key={z.id}>
                                        <td><strong>{z.name}</strong></td>
                                        <td>£{z.base_fee.toFixed(2)}</td>
                                        <td>£{z.min_order_for_free_delivery.toFixed(2)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {z.postcode_patterns.map((p: string, idx: number) => (
                                                    <span key={idx} className="badge badge-primary">{p}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {zones.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center' }}>No delivery zones configured for this store</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Add New Zone</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Zone Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Central London, SW Region"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Base Fee (£)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={baseFee}
                            onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Free Delivery For Orders Over (£)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={freeDeliveryOver}
                            onChange={(e) => setFreeDeliveryOver(parseFloat(e.target.value) || 0)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Covered Postcodes (comma separated)</label>
                        <textarea
                            className="form-input"
                            value={postcodes}
                            onChange={(e) => setPostcodes(e.target.value)}
                            placeholder="SW1A*, E1 6AN, N1*"
                            rows={3}
                            required
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Supports exact match or wildcard * (e.g., SW1*, E*)
                        </span>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Saving...' : 'Create Zone'}
                    </button>
                </form>
            </div>
        </div>
    );
}
