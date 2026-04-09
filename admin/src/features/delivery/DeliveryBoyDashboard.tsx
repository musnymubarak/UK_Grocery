import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export default function DeliveryBoyDashboard() {
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['my_deliveries'],
        queryFn: async () => {
            const res = await orderApi.deliveryList();
            return res.data;
        },
    });

    const updateStatus = useMutation({
        mutationFn: (data: { id: string, status: string }) => orderApi.updateStatus(data.id, data.status),
        onSuccess: () => {
            toast.success("Delivery confirmed!");
            queryClient.invalidateQueries({ queryKey: ['my_deliveries'] });
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        }
    });

    if (isLoading) return <div className="p-8">Loading deliveries...</div>;

    const activeDeliveries = orders.filter((o: any) => o.status === 'on_delivery' || o.status === 'packed');
    const pastDeliveries = orders.filter((o: any) => o.status === 'delivered');

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>My Deliveries</h2>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Active Assignments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {activeDeliveries.map((order: any) => (
                    <div key={order.id} className="card" style={{ padding: '20px', borderLeft: '4px solid var(--info)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '1.1rem' }}>{order.order_number}</strong>
                            <span className="badge badge-info">{order.status.replace('_', ' ')}</span>
                        </div>
                        <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                            <div style={{ marginBottom: '4px' }}><strong>Customer:</strong> {order.customer_id}</div>
                            <div style={{ marginBottom: '4px' }}><strong>Address ID:</strong> {order.delivery_address_id}</div>
                            {order.delivery_instructions && (
                                <div style={{ background: 'var(--warning-bg)', padding: '8px', borderRadius: '4px', color: 'var(--warning)', fontSize: '0.85rem', marginTop: '8px' }}>
                                    <strong>Note:</strong> {order.delivery_instructions}
                                </div>
                            )}
                        </div>

                        {order.status === 'packed' && (
                            <button 
                                className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => updateStatus.mutate({ id: order.id, status: 'on_delivery' })}
                            >
                                Start Delivery
                            </button>
                        )}
                        {order.status === 'on_delivery' && (
                            <button 
                                className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}
                            >
                                Mark as Delivered
                            </button>
                        )}
                    </div>
                ))}
                {activeDeliveries.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                        No active deliveries. You're all caught up!
                    </div>
                )}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Past Deliveries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastDeliveries.map((order: any) => (
                    <div key={order.id} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{order.order_number}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.updated_at).toLocaleString()}</div>
                        </div>
                        <div style={{ color: 'var(--success)', fontWeight: 600 }}>Delivered</div>
                    </div>
                ))}
            </div>

        </div>
    );
}
