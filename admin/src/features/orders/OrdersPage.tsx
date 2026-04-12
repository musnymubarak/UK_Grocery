import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';

export default function OrdersPage() {
    const { selectedStore } = useAdminStore();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders_list', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await orderApi.list({ store_id: selectedStore.id });
            return res.data;
        },
        enabled: !!selectedStore?.id,
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
                                        <span className={`badge badge-${
                                            order.status === 'delivered' ? 'success' :
                                            order.status === 'cancelled' ? 'danger' :
                                            order.status === 'packed' ? 'warning' : 'primary'
                                        }`}>
                                            {order.status}
                                        </span>
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
