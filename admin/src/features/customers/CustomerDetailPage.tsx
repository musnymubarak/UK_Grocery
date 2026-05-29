import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerApi, orderApi } from '../../services/api';
import { ArrowLeft, Mail, Phone, MapPin, Wallet, Award, Calendar, Package } from 'lucide-react';

interface Address {
    id: string;
    label?: string;
    street: string;
    city: string;
    state?: string;
    postcode: string;
    country?: string;
    is_default?: boolean;
}

interface Customer {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    membership_tier: string;
    lifetime_value: string | number;
    wallet_balance: string | number;
    discount_rate: string | number;
    dob?: string;
    referral_code?: string;
    created_at: string;
    addresses: Address[];
}

interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    total: string | number;
    payment_method: string;
    payment_status: string;
    created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
    placed: 'var(--primary)',
    confirmed: 'var(--info)',
    picking: 'var(--warning)',
    ready_for_collection: 'var(--info)',
    assigned_to_driver: 'var(--info)',
    out_for_delivery: 'var(--info)',
    delivered: 'var(--success)',
    cancelled: 'var(--danger)',
    rejected: 'var(--danger)',
};

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: customer, isLoading: loadingCustomer, error: customerError } = useQuery<Customer>({
        queryKey: ['customer', id],
        queryFn: async () => {
            const res = await customerApi.get(id!);
            return res.data;
        },
        enabled: !!id,
    });

    const { data: orders = [], isLoading: loadingOrders } = useQuery<OrderRow[]>({
        queryKey: ['orders', { customer_id: id }],
        queryFn: async () => {
            const res = await orderApi.list({ customer_id: id, limit: 20 });
            return res.data;
        },
        enabled: !!id,
    });

    if (loadingCustomer) return <div style={{ padding: 32 }}>Loading customer…</div>;
    if (customerError || !customer) {
        return (
            <div style={{ padding: 32 }}>
                <button onClick={() => navigate('/customers')} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="card" style={{ marginTop: 16, padding: 24 }}>
                    Customer not found or you don't have access.
                </div>
            </div>
        );
    }

    const defaultAddr = customer.addresses.find(a => a.is_default) ?? customer.addresses[0];
    const totalSpend = Number(customer.lifetime_value || 0);
    const orderCount = orders.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    onClick={() => navigate('/customers')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--text-secondary)' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{customer.full_name}</h2>
                <span className={`badge badge-${customer.is_active ? 'success' : 'danger'}`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="badge" style={{ background: 'var(--primary-50)', color: 'var(--primary)', textTransform: 'capitalize' }}>
                    {customer.membership_tier}
                </span>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <KpiTile icon={<Wallet size={18} />} label="Wallet" value={`£${Number(customer.wallet_balance).toFixed(2)}`} />
                <KpiTile icon={<Award size={18} />} label="Lifetime spend" value={`£${totalSpend.toFixed(2)}`} />
                <KpiTile icon={<Package size={18} />} label="Orders" value={orderCount} />
                <KpiTile icon={<Calendar size={18} />} label="Joined" value={new Date(customer.created_at).toLocaleDateString()} />
            </div>

            {/* Profile + Addresses + Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                {/* Left column: profile + addresses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <div className="card-header"><h3 className="card-title">Profile</h3></div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Field icon={<Mail size={14} />} label="Email" value={customer.email} />
                            <Field icon={<Phone size={14} />} label="Phone" value={customer.phone || '—'} />
                            <Field icon={<Calendar size={14} />} label="DOB" value={customer.dob ? new Date(customer.dob).toLocaleDateString() : '—'} />
                            <Field icon={<Award size={14} />} label="Tier" value={customer.membership_tier} />
                            <Field icon={<Wallet size={14} />} label="Discount rate" value={`${Number(customer.discount_rate || 0)}%`} />
                            {customer.referral_code && (
                                <Field icon={<Award size={14} />} label="Referral code" value={customer.referral_code} />
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3 className="card-title">Addresses ({customer.addresses.length})</h3></div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {customer.addresses.length === 0 ? (
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No saved addresses.</div>
                            ) : (
                                customer.addresses.map(a => (
                                    <div
                                        key={a.id}
                                        style={{
                                            padding: 12,
                                            border: `1px solid ${a.is_default ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            background: a.is_default ? 'var(--primary-50)' : 'transparent',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <MapPin size={14} style={{ color: 'var(--text-secondary)' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                                {a.label || 'address'}
                                            </span>
                                            {a.is_default && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>
                                                    DEFAULT
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {a.street}<br />
                                            {[a.city, a.state, a.postcode].filter(Boolean).join(', ')}<br />
                                            {a.country}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: orders */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="card-title">Recent orders ({orderCount})</h3>
                        {defaultAddr && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Default delivery → {defaultAddr.postcode}
                            </span>
                        )}
                    </div>
                    {loadingOrders ? (
                        <div style={{ padding: 24 }}>Loading orders…</div>
                    ) : orders.length === 0 ? (
                        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>No orders yet.</div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o.id}>
                                            <td>
                                                <Link to={`/orders?id=${o.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                    {o.order_number}
                                                </Link>
                                            </td>
                                            <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: 'transparent',
                                                        color: STATUS_COLOR[o.status] || 'var(--text-secondary)',
                                                        border: `1px solid ${STATUS_COLOR[o.status] || 'var(--border)'}`,
                                                        textTransform: 'capitalize',
                                                    }}
                                                >
                                                    {o.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {o.payment_method} · {o.payment_status}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>£{Number(o.total).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function KpiTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {icon}
                {label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, width: 90 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
        </div>
    );
}
