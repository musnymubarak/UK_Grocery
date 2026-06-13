/**
 * Store management — admin only. Real per-store ops stats (no fabricated KPIs).
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi, authApi, analyticsApi, getErrorMessage } from '../../services/api';
import { Plus, Edit2, Trash2, MapPin, Truck, ShoppingBag, PackageX } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Button, Card, Badge, Toggle, FormField, Input, Skeleton } from '../../components/ui/primitives';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

interface Store {
    id: string; name: string; code: string; address?: string; city?: string; state?: string;
    country?: string; phone?: string; email?: string; is_active: boolean; avg_prep_time_min?: number; created_at: string;
}
interface AlertData {
    orders?: { pending_action?: number; out_for_delivery?: number; substitution_pending?: number };
    inventory?: { out_of_stock_skus?: number };
}

const EMPTY = { name: '', code: '', address: '', city: '', state: '', country: '', phone: '', email: '' };

export default function StoresPage() {
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editStore, setEditStore] = useState<Store | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['stores'],
        queryFn: async () => { const r = await storeApi.list(); return (r.data.items || r.data || []) as Store[]; },
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users', 'for-stores'],
        queryFn: async () => { try { const r = await authApi.listUsers(); return (r.data.items || r.data || []) as any[]; } catch { return []; } },
    });

    const storeIds = stores.map((s) => s.id).join(',');
    const { data: stats = {} } = useQuery<Record<string, AlertData>>({
        queryKey: ['store-stats', storeIds],
        enabled: stores.length > 0,
        refetchInterval: 60000,
        queryFn: async () => {
            const entries = await Promise.allSettled(
                stores.map((s) => analyticsApi.alerts({ store_id: s.id }).then((r) => [s.id, r.data as AlertData] as const)),
            );
            const map: Record<string, AlertData> = {};
            for (const e of entries) if (e.status === 'fulfilled') map[e.value[0]] = e.value[1];
            return map;
        },
    });

    const managerFor = (storeId: string): string | null => {
        const m = users.find((u) => u.store_id === storeId && u.role === 'manager') || users.find((u) => u.store_id === storeId);
        return m?.full_name ?? null;
    };
    const activeOrders = (a?: AlertData): number | null =>
        a?.orders ? (a.orders.pending_action ?? 0) + (a.orders.out_for_delivery ?? 0) + (a.orders.substitution_pending ?? 0) : null;

    const saveMut = useMutation({
        mutationFn: (payload: any) => editStore ? storeApi.update(editStore.id, payload) : storeApi.create(payload),
        onSuccess: () => { toast.success(editStore ? 'Store updated' : 'Store created'); setShowModal(false); qc.invalidateQueries({ queryKey: ['stores'] }); },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });
    const toggleMut = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => storeApi.update(id, { is_active }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
        onError: (e) => toast.error(getErrorMessage(e, 'Failed')),
    });
    const deleteMut = useMutation({
        mutationFn: (id: string) => storeApi.delete(id),
        onSuccess: () => { toast.success('Store deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['stores'] }); },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to delete')),
    });

    const openCreate = () => { setEditStore(null); setForm(EMPTY); setShowModal(true); };
    const openEdit = (s: Store) => {
        setEditStore(s);
        setForm({ name: s.name, code: s.code, address: s.address || '', city: s.city || '', state: s.state || '', country: s.country || '', phone: s.phone || '', email: s.email || '' });
        setShowModal(true);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMut.mutate(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || undefined])));
    };

    return (
        <div>
            <PageHeader
                title="Stores"
                subtitle="Manage locations and monitor live fulfilment health."
                actions={<Button icon={Plus} onClick={openCreate}>Add store</Button>}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-40 w-full" /></Card>)
                ) : stores.length === 0 ? (
                    <Card className="col-span-full p-12 text-center text-on-surface-variant">No stores yet.</Card>
                ) : stores.map((store) => {
                    const a = stats[store.id];
                    const orders = activeOrders(a);
                    const oos = a?.inventory?.out_of_stock_skus;
                    const manager = managerFor(store.id);
                    return (
                        <Card key={store.id} className="p-6 flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-headline text-lg font-extrabold text-on-surface truncate">{store.name}</h2>
                                        <Badge tone={store.is_active ? 'success' : 'danger'}>{store.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-on-surface-variant mt-1">
                                        <MapPin size={15} /> <span className="truncate">{store.address || 'Location not set'}</span>
                                    </div>
                                </div>
                                <Toggle checked={store.is_active} onChange={(v) => toggleMut.mutate({ id: store.id, is_active: v })} label="Toggle active" />
                            </div>

                            <div className="flex items-center gap-3 rounded-md bg-surface-container-low px-4 py-3">
                                <span className="h-9 w-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                                    {(manager ?? '–').charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Manager</div>
                                    <div className="text-sm font-semibold text-on-surface truncate">{manager ?? 'Unassigned'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <StatBox icon={ShoppingBag} label="Active orders" value={orders ?? '—'} />
                                <StatBox icon={PackageX} label="Out of stock" value={oos ?? '—'} tone={oos ? 'red' : 'muted'} />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                                <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                                    <Truck size={16} /> Avg prep: <b className="text-on-surface">{store.avg_prep_time_min ? `${store.avg_prep_time_min}m` : '—'}</b>
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(store)}>Edit</Button>
                                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(store.id)} className="text-error hover:bg-error/10" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editStore ? 'Edit store' : 'New store'}
                footer={<>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={submit} loading={saveMut.isPending}>{editStore ? 'Update' : 'Create'}</Button>
                </>}
            >
                <form onSubmit={submit} className="space-y-0">
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="Store name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></FormField>
                        <FormField label="Code" required><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="MAIN-01" /></FormField>
                    </div>
                    <FormField label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></FormField>
                        <FormField label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></FormField>
                        <FormField label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
                        <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
                title="Delete store?"
                message="This will remove the store. This action cannot be undone."
                confirmLabel="Delete"
                loading={deleteMut.isPending}
            />
        </div>
    );
}

function StatBox({ icon: Icon, label, value, tone = 'primary' }: { icon: React.ComponentType<{ size?: number | string }>; label: string; value: React.ReactNode; tone?: 'primary' | 'red' | 'muted' }) {
    const color = tone === 'red' ? 'text-error' : tone === 'muted' ? 'text-on-surface-variant' : 'text-primary';
    return (
        <div className="rounded-md bg-surface-container-low px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant"><Icon size={13} /> {label}</div>
            <div className={`font-headline text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
        </div>
    );
}
