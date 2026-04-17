import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, getErrorMessage } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import toast from 'react-hot-toast';
import { PackageOpen, Truck, CheckCircle, XCircle } from 'lucide-react';
import AnalyticsSummary from './AnalyticsSummary';

const COLUMNS = [
    { id: 'placed', label: 'Placed', color: 'var(--primary)', icon: PackageOpen },
    { id: 'picking', label: 'Packing', color: 'var(--warning)', icon: PackageOpen },
    { id: 'out_for_delivery', label: 'In Transit', color: 'var(--info)', icon: Truck },
    { id: 'delivered', label: 'Delivered', color: 'var(--success)', icon: CheckCircle },
    { id: 'cancelled', label: 'Cancelled', color: 'var(--danger)', icon: XCircle },
];

export default function DashboardPage() {
    const { selectedStore } = useAdminStore();
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await orderApi.list({ store_id: selectedStore.id, limit: 200 });
            return res.data;
        },
        enabled: !!selectedStore?.id,
        refetchInterval: 30000, // Polling every 30s
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            orderApi.updateStatus(id, status),
        onSuccess: () => {
            toast.success('Order status updated');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        e.dataTransfer.setData('orderId', orderId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');
        if (orderId) {
            updateStatus.mutate({ id: orderId, status });
        }
    };

    if (!selectedStore) {
        return <div className="p-8">Please select a store from the top header to view the dashboard.</div>;
    }

    if (isLoading) return <div className="p-8">Loading dashboard...</div>;

    const ordersByStatus = COLUMNS.reduce((acc, col) => {
        acc[col.id] = orders.filter((o: any) => o.status === col.id);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="p-4">
            <AnalyticsSummary />
            <h2 className="mb-6 font-bold" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Pipeline</h2>
            
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', height: 'calc(100vh - 200px)' }}>
                {COLUMNS.map((col) => {
                    const Icon = col.icon;
                    return (
                        <div
                            key={col.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                            style={{
                                flex: '0 0 320px',
                                background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Icon size={18} color={col.color} />
                                <h3 style={{ fontWeight: 600, color: col.color, margin: 0 }}>
                                    {col.label} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>({ordersByStatus[col.id].length})</span>
                                </h3>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {ordersByStatus[col.id].map((order: any) => (
                                    <div
                                        key={order.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                        style={{
                                            background: 'var(--bg-card)',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border)',
                                            cursor: 'grab',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <strong>{order.order_number}</strong>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                £{Number(order.total).toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {order.items.length} items
                                        </div>
                                        {/* Optional visual cue for assignment */}
                                        {col.id === 'picking' && !order.assigned_to && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>
                                                Needs Delivery Assignment
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {ordersByStatus[col.id].length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                        No orders
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
