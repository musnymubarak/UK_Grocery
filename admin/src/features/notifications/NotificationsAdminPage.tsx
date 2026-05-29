import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAdminApi, customerApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Megaphone, Mail } from 'lucide-react';

interface Customer {
    id: string;
    full_name: string;
    email: string;
}

interface RecentNotif {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    title: string;
    body: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
}

type Target = 'single' | 'broadcast';

const TYPE_OPTIONS = [
    { value: 'system', label: 'System (default)' },
    { value: 'promo', label: 'Promotion' },
    { value: 'order_update', label: 'Order update' },
    { value: 'reward', label: 'Reward' },
    { value: 'refund', label: 'Refund' },
];

export default function NotificationsAdminPage() {
    const queryClient = useQueryClient();
    const [target, setTarget] = useState<Target>('single');
    const [customerId, setCustomerId] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [notificationType, setNotificationType] = useState('system');
    const [activeOnly, setActiveOnly] = useState(true);

    const { data: customers = [] } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: async () => (await customerApi.list()).data,
    });

    const { data: recent = [], isLoading: loadingRecent } = useQuery<RecentNotif[]>({
        queryKey: ['notifications', 'recent'],
        queryFn: async () => (await notificationAdminApi.recent(50)).data,
    });

    const send = useMutation({
        mutationFn: () => {
            if (target === 'single') {
                if (!customerId) throw new Error('Select a customer');
                return notificationAdminApi.send({
                    customer_id: customerId,
                    title,
                    body,
                    notification_type: notificationType,
                });
            }
            return notificationAdminApi.broadcast({
                title,
                body,
                notification_type: notificationType,
                active_only: activeOnly,
            });
        },
        onSuccess: (res) => {
            const data = res.data;
            const msg = data.recipients
                ? `Broadcast sent to ${data.recipients} customer${data.recipients === 1 ? '' : 's'}`
                : `Notification sent`;
            toast.success(msg);
            setTitle('');
            setBody('');
            setCustomerId('');
            queryClient.invalidateQueries({ queryKey: ['notifications', 'recent'] });
        },
        onError: (e: any) => toast.error(e?.message || getErrorMessage(e)),
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
            {/* Composer */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Compose notification</h3>
                </div>
                <form
                    onSubmit={e => { e.preventDefault(); send.mutate(); }}
                    style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                    <Field label="Send to">
                        <div style={{ display: 'flex', gap: 8 }}>
                            <RadioOption
                                checked={target === 'single'}
                                onClick={() => setTarget('single')}
                                icon={<Mail size={14} />}
                                label="A single customer"
                            />
                            <RadioOption
                                checked={target === 'broadcast'}
                                onClick={() => setTarget('broadcast')}
                                icon={<Megaphone size={14} />}
                                label="All customers"
                            />
                        </div>
                    </Field>

                    {target === 'single' ? (
                        <Field label="Customer">
                            <select
                                value={customerId}
                                onChange={e => setCustomerId(e.target.value)}
                                className="form-input"
                                required
                            >
                                <option value="">— Select a customer —</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                                ))}
                            </select>
                        </Field>
                    ) : (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
                            Active customers only ({customers.filter((c: any) => c.is_active).length} of {customers.length})
                        </label>
                    )}

                    <Field label="Title">
                        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={255} required className="form-input" />
                    </Field>
                    <Field label="Body">
                        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} required className="form-input" />
                    </Field>
                    <Field label="Type">
                        <select value={notificationType} onChange={e => setNotificationType(e.target.value)} className="form-input">
                            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>

                    <button
                        type="submit"
                        disabled={send.isPending}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                        <Send size={16} />
                        {send.isPending ? 'Sending…' : (target === 'broadcast' ? 'Broadcast' : 'Send')}
                    </button>
                </form>
            </div>

            {/* Recent log */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Recent notifications ({recent.length})</h3>
                </div>
                {loadingRecent ? (
                    <div style={{ padding: 24 }}>Loading…</div>
                ) : recent.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No notifications sent yet.
                    </div>
                ) : (
                    <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        {recent.map(n => (
                            <div
                                key={n.id}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span
                                            className="badge"
                                            style={{
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                                fontSize: '0.7rem',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {n.notification_type.replace('_', ' ')}
                                        </span>
                                        {n.is_read && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>read</span>
                                        )}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.body}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    → {n.customer_name} · {n.customer_email} · {new Date(n.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
            {children}
        </label>
    );
}

function RadioOption({ checked, onClick, icon, label }: { checked: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                flex: 1,
                padding: 10,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                background: checked ? 'var(--primary-50)' : 'transparent',
                color: checked ? 'var(--primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: '0.85rem',
                fontWeight: 600,
            }}
        >
            {icon}
            {label}
        </button>
    );
}
