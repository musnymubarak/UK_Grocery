import React, { useState } from 'react';
import { X, CreditCard, User, MapPin, Package, Clock, Phone, Mail, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import { CustomSelect } from '../../components/CustomSelect';
import toast from 'react-hot-toast';

export default function OrdersPage() {
    const { selectedStore } = useAdminStore();
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const [statusFilter, setStatusFilter] = React.useState('all');
    const [search, setSearch] = React.useState('');

    const filteredOrders = orders.filter((o: any) => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesSearch = o.order_number?.toLowerCase().includes(search.toLowerCase()) || 
                             o.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                             o.customer_id?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const tabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'placed', label: 'Pending' },
        { id: 'picking', label: 'Processing' },
        { id: 'out_for_delivery', label: 'Shipped' },
        { id: 'delivered', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    const statusOptions = [
        { value: 'placed', label: 'Placed' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'picking', label: 'Picking' },
        { value: 'ready_for_collection', label: 'Ready' },
        { value: 'out_for_delivery', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const getPaymentBadge = (status: string, method: string) => {
        const isPaid = status === 'paid';
        const isCod = method === 'cod';
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.7rem', 
                    fontWeight: 800,
                    background: isPaid ? '#e6f7ef' : '#fff4e5',
                    color: isPaid ? '#2e7d32' : '#b25e09',
                    width: 'fit-content',
                    textTransform: 'uppercase'
                }}>
                    {status || 'Pending'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>
                    {method?.toUpperCase() || 'COD'}
                </span>
            </div>
        );
    };

    if (!selectedStore) {
        return <div className="p-8">Please select a store to view orders.</div>;
    }

    return (
        <>
            <div>
                <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Orders</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Manage and fulfill customer orders.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '100px' }}>
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '100px',
                                border: 'none',
                                background: statusFilter === tab.id ? 'var(--primary-200)' : 'transparent',
                                color: statusFilter === tab.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="Search by ID or customer..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                paddingLeft: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                width: '300px',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ORDER ID</th>
                                <th>DATE</th>
                                <th>CUSTOMER</th>
                                <th>TOTAL</th>
                                <th>PAYMENT</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No orders found matching your criteria.</td></tr>
                            ) : filteredOrders.map((order: any) => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.order_number}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td title={`Email: ${order.customer?.email || 'N/A'}\nPhone: ${order.customer?.phone || 'N/A'}`}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'help' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                                                {order.customer?.full_name?.charAt(0).toUpperCase() || 'C'}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{order.customer?.full_name || 'Guest'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>£{Number(order.total).toFixed(2)}</td>
                                    <td>
                                        {getPaymentBadge(order.payment_status, order.payment_method)}
                                    </td>
                                    <td>
                                        <CustomSelect
                                            options={statusOptions}
                                            value={order.status}
                                            onChange={(val) => updateStatus.mutate({ id: order.id, status: val })}
                                            style={{ width: '150px' }}
                                        />
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                                            style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>

        {/* Order Details Modal */}
        {isModalOpen && selectedOrder && (
            <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', padding: 0 }}>
                    <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Order {selectedOrder.order_number}</h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                            </div>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-primary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="modal-body" style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '32px' }}>
                            {/* Customer & Delivery Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="detail-section">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        <User size={18} color="var(--primary)" /> Customer Details
                                    </h4>
                                    <div className="card" style={{ padding: '16px', background: 'var(--bg-primary)', border: 'none' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{selectedOrder.customer?.full_name || 'Guest'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>
                                            <Mail size={14} /> {selectedOrder.customer?.email || 'N/A'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <Phone size={14} /> {selectedOrder.customer?.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        <MapPin size={18} color="var(--primary)" /> Delivery Information
                                    </h4>
                                    <div className="card" style={{ padding: '16px', background: 'var(--bg-primary)', border: 'none' }}>
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                                            <strong>Address:</strong> {selectedOrder.delivery_address || 'Collection from Store'}
                                            {selectedOrder.delivery_postcode && <span>, {selectedOrder.delivery_postcode}</span>}
                                        </div>
                                        {selectedOrder.delivery_instructions && (
                                            <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px', borderLeft: '3px solid var(--primary-100)', background: '#fff' }}>
                                                "{selectedOrder.delivery_instructions}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="detail-section">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        <CreditCard size={18} color="var(--primary)" /> Payment Information
                                    </h4>
                                    <div className="card" style={{ padding: '16px', background: 'var(--bg-primary)', border: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Method:</span>
                                            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{selectedOrder.payment_method}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                                            <span style={{ 
                                                fontWeight: 800, 
                                                color: selectedOrder.payment_status === 'paid' ? 'var(--primary-dark)' : '#b25e09',
                                                textTransform: 'uppercase'
                                            }}>
                                                {selectedOrder.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        <Clock size={18} color="var(--primary)" /> Order Status
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                        <CustomSelect
                                            options={statusOptions}
                                            value={selectedOrder.status}
                                            onChange={(val) => updateStatus.mutate({ id: selectedOrder.id, status: val })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="detail-section">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                <Package size={18} color="var(--primary)" /> Order Items
                            </h4>
                            <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                                <table className="table" style={{ fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items?.map((item: any) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.product_sku || 'N/A'}</div>
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>£{Number(item.unit_price).toFixed(2)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700 }}>£{Number(item.total).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ borderTop: '2px solid var(--border-light)' }}>
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>Delivery Fee</td>
                                            <td style={{ textAlign: 'right' }}>£{Number(selectedOrder.delivery_fee).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>Service Fee</td>
                                            <td style={{ textAlign: 'right' }}>£{Number(selectedOrder.service_fee || 0).toFixed(2)}</td>
                                        </tr>
                                        {Number(selectedOrder.discount) > 0 && (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: 'right', color: 'var(--danger)' }}>Discount</td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-£{Number(selectedOrder.discount).toFixed(2)}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem' }}>Order Total</td>
                                            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>£{Number(selectedOrder.total).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close Detail</button>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}
