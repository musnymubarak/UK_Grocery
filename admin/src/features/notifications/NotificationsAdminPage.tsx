import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAdminApi, customerApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Megaphone, Mail } from 'lucide-react';
import { PageHeader, Card, Button, Badge, FormField, Input, Textarea, Select, EmptyState, Skeleton } from '../../components/ui';
import { cn } from '../../lib/cn';

interface Customer { id: string; full_name: string; email: string; is_active?: boolean }
interface RecentNotif {
    id: string; customer_id: string; customer_name: string; customer_email: string;
    title: string; body: string; notification_type: string; is_read: boolean; created_at: string;
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
        queryFn: async () => (await customerApi.list()).data?.items ?? (await customerApi.list()).data ?? [],
    });
    const { data: recent = [], isLoading: loadingRecent } = useQuery<RecentNotif[]>({
        queryKey: ['notifications', 'recent'],
        queryFn: async () => (await notificationAdminApi.recent(50)).data?.items ?? (await notificationAdminApi.recent(50)).data ?? [],
    });

    const send = useMutation({
        mutationFn: () => {
            if (target === 'single') {
                if (!customerId) throw new Error('Select a customer');
                return notificationAdminApi.send({ customer_id: customerId, title, body, notification_type: notificationType });
            }
            return notificationAdminApi.broadcast({ title, body, notification_type: notificationType, active_only: activeOnly });
        },
        onSuccess: (res) => {
            const data = res.data;
            toast.success(data.recipients ? `Broadcast sent to ${data.recipients} customer${data.recipients === 1 ? '' : 's'}` : 'Notification sent');
            setTitle(''); setBody(''); setCustomerId('');
            queryClient.invalidateQueries({ queryKey: ['notifications', 'recent'] });
        },
        onError: (e: any) => toast.error(e?.message || getErrorMessage(e)),
    });

    const activeCount = customers.filter((c) => c.is_active).length;

    return (
        <div>
            <PageHeader title="Notifications" subtitle="Send a message to one customer or broadcast to everyone." />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-5 items-start">
                {/* Composer */}
                <Card className="p-5 min-w-0">
                    <h3 className="font-headline font-bold text-on-surface mb-4">Compose</h3>
                    <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
                        <FormField label="Send to">
                            <div className="grid grid-cols-2 gap-2">
                                <RadioCard checked={target === 'single'} onClick={() => setTarget('single')} icon={<Mail size={15} />} label="A single customer" />
                                <RadioCard checked={target === 'broadcast'} onClick={() => setTarget('broadcast')} icon={<Megaphone size={15} />} label="All customers" />
                            </div>
                        </FormField>

                        {target === 'single' ? (
                            <FormField label="Customer" required>
                                <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                                    <option value="">— Select a customer —</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                                </Select>
                            </FormField>
                        ) : (
                            <label className="flex items-center gap-2 text-sm text-on-surface mb-4">
                                <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="accent-action-blue" />
                                Active customers only ({activeCount} of {customers.length})
                            </label>
                        )}

                        <FormField label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} required /></FormField>
                        <FormField label="Body" required><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required /></FormField>
                        <FormField label="Type">
                            <Select value={notificationType} onChange={(e) => setNotificationType(e.target.value)}>
                                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                        </FormField>

                        <Button type="submit" icon={Send} loading={send.isPending} className="w-full mt-2">
                            {target === 'broadcast' ? 'Broadcast' : 'Send notification'}
                        </Button>
                    </form>
                </Card>

                {/* Recent log */}
                <Card className="min-w-0">
                    <div className="px-5 py-4 border-b border-outline-variant">
                        <h3 className="font-headline font-bold text-on-surface">Recent notifications ({recent.length})</h3>
                    </div>
                    {loadingRecent ? (
                        <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : recent.length === 0 ? (
                        <EmptyState icon={Megaphone} title="No notifications yet" message="Sent and broadcast messages will appear here." />
                    ) : (
                        <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-outline-variant/60">
                            {recent.map((n) => (
                                <div key={n.id} className="px-5 py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <strong className="text-sm text-on-surface">{n.title}</strong>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge tone="neutral"><span className="capitalize">{n.notification_type.replace('_', ' ')}</span></Badge>
                                            {n.is_read && <span className="text-xs text-success font-semibold">read</span>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-on-surface-variant mt-0.5">{n.body}</p>
                                    <p className="text-xs text-on-surface-variant/80 mt-1 truncate">→ {n.customer_name} · {n.customer_email} · {safeDate(n.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function RadioCard({ checked, onClick, icon, label }: { checked: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-sm font-semibold text-center transition-colors',
                checked ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container',
            )}
        >
            {icon}<span className="truncate">{label}</span>
        </button>
    );
}

function safeDate(iso: string): string {
    try { return new Date(iso).toLocaleString(); } catch { return ''; }
}
