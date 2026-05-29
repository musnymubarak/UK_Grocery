import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import { AlertTriangle, Clock, Truck, RefreshCw, CreditCard, Package, Wifi, ShoppingBag } from 'lucide-react';

interface Alerts {
    orders: {
        pending_action: number;
        late: number;
        out_for_delivery: number;
        substitution_pending: number;
        failed_payments: number;
    };
    refunds: { pending: number };
    drivers: { available: number };
    inventory: { out_of_stock_skus: number; low_stock_skus: number };
    _thresholds: { late_after_minutes: number; low_stock_threshold: number };
}

export default function UrgentAlerts() {
    const navigate = useNavigate();
    const { selectedStore } = useAdminStore();

    const { data, isLoading } = useQuery<Alerts>({
        queryKey: ['alerts', selectedStore?.id],
        queryFn: async () => {
            const params = selectedStore?.id ? { store_id: selectedStore.id } : {};
            return (await analyticsApi.alerts(params)).data;
        },
        refetchInterval: 30000,
    });

    if (isLoading || !data) {
        return null;
    }

    const tiles = [
        { label: 'Late orders', value: data.orders.late, icon: <Clock size={18} />, urgency: data.orders.late > 0 ? 'high' : 'ok', path: '/orders', hint: `>${data._thresholds.late_after_minutes}m in placed` },
        { label: 'Pending action', value: data.orders.pending_action, icon: <ShoppingBag size={18} />, urgency: data.orders.pending_action > 0 ? 'med' : 'ok', path: '/orders', hint: 'placed → ready' },
        { label: 'Out for delivery', value: data.orders.out_for_delivery, icon: <Truck size={18} />, urgency: 'info', path: '/orders' },
        { label: 'Substitutions', value: data.orders.substitution_pending, icon: <AlertTriangle size={18} />, urgency: data.orders.substitution_pending > 0 ? 'high' : 'ok', path: '/orders' },
        { label: 'Failed payments', value: data.orders.failed_payments, icon: <CreditCard size={18} />, urgency: data.orders.failed_payments > 0 ? 'high' : 'ok', path: '/orders' },
        { label: 'Refund queue', value: data.refunds.pending, icon: <RefreshCw size={18} />, urgency: data.refunds.pending > 0 ? 'med' : 'ok', path: '/refunds' },
        { label: 'Drivers online', value: data.drivers.available, icon: <Wifi size={18} />, urgency: data.drivers.available === 0 ? 'med' : 'ok', path: '/drivers' },
        { label: 'Out-of-stock', value: data.inventory.out_of_stock_skus, icon: <Package size={18} />, urgency: data.inventory.out_of_stock_skus > 0 ? 'high' : 'ok', path: '/inventory' },
        { label: 'Low-stock', value: data.inventory.low_stock_skus, icon: <Package size={18} />, urgency: data.inventory.low_stock_skus > 0 ? 'med' : 'ok', path: '/inventory', hint: `<${data._thresholds.low_stock_threshold}` },
    ];

    const colorFor = (u: string) => {
        if (u === 'high') return 'var(--danger)';
        if (u === 'med') return 'var(--warning)';
        if (u === 'info') return 'var(--info)';
        return 'var(--text-secondary)';
    };

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Urgent actions</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    auto-refreshes every 30s{selectedStore ? ` · scoped to ${selectedStore.name}` : ''}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {tiles.map(t => {
                    const color = colorFor(t.urgency);
                    const dim = t.urgency === 'ok';
                    return (
                        <button
                            key={t.label}
                            onClick={() => navigate(t.path)}
                            style={{
                                textAlign: 'left',
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${dim ? 'var(--border)' : color}`,
                                background: dim ? 'transparent' : `${color}11`,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                            title={t.hint || t.label}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: dim ? 'var(--text-secondary)' : color }}>
                                {t.icon}
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    {t.label}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: dim ? 'var(--text-primary)' : color }}>
                                {t.value}
                            </div>
                            {t.hint && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{t.hint}</div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
