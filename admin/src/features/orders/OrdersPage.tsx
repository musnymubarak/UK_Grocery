import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import toast from 'react-hot-toast';

export default function OrdersPage() {
    const { selectedStore } = useAdminStore();
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders_list', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await orderApi.list({ store_id: selectedStore.id });
            return res.data;
        },
        enabled: !!selectedStore?.id,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, status),
        onSuccess: () => {
            toast.success('Order status updated');
            queryClient.invalidateQueries({ queryKey: ['orders_list'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate dashboard too
        },
        onError: () => {
            toast.error('Failed to update status');
        }
    });

    if (!selectedStore) {
        return <div className="p-8">Please select a store to view orders.</div>;
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Orders Management</h3>
            </div>
            
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order: any) => (
                                <tr key={order.id}>
                                    <td><strong>{order.order_number}</strong></td>
                                    <td>{new Date(order.created_at).toLocaleString()}</td>
                                    <td>{order.customer_id}</td>
                                    <td>{order.items?.length || 0} items</td>
                                    <td>£{Number(order.total).toFixed(2)}</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                                            disabled={updateStatus.isPending && updateStatus.variables?.id === order.id}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-primary)',
                                                outline: 'none',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <option value="placed">Placed</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="picking">Picking</option>
                                            <option value="ready_for_collection">Ready for Collection</option>
                                            <option value="assigned_to_driver">Assigned</option>
                                            <option value="out_for_delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </td>
                                    <td>{order.payment_method}</td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center' }}>No orders found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
