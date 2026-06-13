import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionApi, storeApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, Button, Badge, FormField, Input, Textarea, Select } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { usePermissions } from '../../features/auth/PermissionContext';

interface Promotion {
    id: string;
    store_id?: string | null;
    name: string;
    description?: string | null;
    promotion_type: 'buy_x_get_y' | 'quantity_discount' | 'bundle_price';
    config: Record<string, any>;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active: boolean;
    created_at: string;
}

interface Store {
    id: string;
    name: string;
}

const TYPE_LABEL: Record<string, string> = {
    buy_x_get_y: 'Buy X Get Y',
    quantity_discount: 'Quantity Discount',
    bundle_price: 'Bundle Price',
};

const TYPE_TONE: Record<string, 'primary' | 'info' | 'neutral'> = {
    quantity_discount: 'primary',
    buy_x_get_y: 'info',
    bundle_price: 'neutral',
};

const CONFIG_TEMPLATES: Record<string, object> = {
    buy_x_get_y: {
        buy_product_id: '00000000-0000-0000-0000-000000000000',
        buy_qty: 2,
        get_qty: 1,
        discount_pct: 100,
    },
    quantity_discount: {
        product_id: '00000000-0000-0000-0000-000000000000',
        min_qty: 3,
        discount_pct: 10,
    },
    bundle_price: {
        // backend doesn't evaluate this type yet — left here for future support
        product_ids: ['00000000-0000-0000-0000-000000000000'],
        bundle_price: 9.99,
    },
};

export default function PromotionsPage() {
    const queryClient = useQueryClient();
    const { can } = usePermissions();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data: promos = [], isLoading } = useQuery<Promotion[]>({
        queryKey: ['promotions'],
        queryFn: async () => (await promotionApi.list()).data,
    });

    const { data: stores = [] } = useQuery<Store[]>({
        queryKey: ['stores'],
        queryFn: async () => (await storeApi.list()).data,
    });

    const storeName = (id?: string | null) => id ? (stores.find(s => s.id === id)?.name ?? '—') : 'All stores';

    const toggle = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) =>
            promotionApi.update(id, { is_active: active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });

    const del = useMutation({
        mutationFn: (id: string) => promotionApi.delete(id),
        onSuccess: () => {
            toast.success('Promotion deleted');
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });

    const filtered = promos.filter((p) => {
        if (typeFilter && p.promotion_type !== typeFilter) return false;
        if (statusFilter === 'active' && !p.is_active) return false;
        if (statusFilter === 'inactive' && p.is_active) return false;
        return true;
    });

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (p: Promotion) => { setEditing(p); setShowForm(true); };

    const columns: Column<Promotion>[] = [
        {
            key: 'name', header: 'Name', sortable: true, accessor: (p) => p.name, render: (p) => (
                <div>
                    <div className="font-semibold text-on-surface">{p.name}</div>
                    {p.description && <div className="text-xs text-on-surface-variant">{p.description}</div>}
                </div>
            ),
        },
        {
            key: 'type', header: 'Type', sortable: true, accessor: (p) => TYPE_LABEL[p.promotion_type] ?? p.promotion_type,
            render: (p) => <Badge tone={TYPE_TONE[p.promotion_type] ?? 'neutral'}>{TYPE_LABEL[p.promotion_type] ?? p.promotion_type}</Badge>,
        },
        {
            key: 'status', header: 'Status', align: 'center', sortable: true, accessor: (p) => (p.is_active ? 'Active' : 'Inactive'),
            render: (p) => <Badge tone={p.is_active ? 'success' : 'neutral'} dot>{p.is_active ? 'Active' : 'Inactive'}</Badge>,
        },
        {
            key: 'scope', header: 'Scope', sortable: true, accessor: (p) => storeName(p.store_id),
            render: (p) => <span className="text-sm">{storeName(p.store_id)}</span>,
        },
        {
            key: 'window', header: 'Window', accessor: (p) => p.starts_at ?? p.created_at, render: (p) => (
                p.starts_at || p.ends_at ? (
                    <span className="text-xs">
                        {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : '—'}
                        {' → '}
                        {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : '—'}
                    </span>
                ) : (
                    <span className="text-xs text-on-surface-variant">Always</span>
                )
            ),
        },
        {
            key: 'actions', header: '', align: 'right', render: (p) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={p.is_active ? ToggleRight : ToggleLeft}
                        title={p.is_active ? 'Disable' : 'Enable'}
                        onClick={() => toggle.mutate({ id: p.id, active: !p.is_active })}
                        className={p.is_active ? 'text-success' : ''}
                    />
                    <Button variant="ghost" size="sm" icon={Edit2} title="Edit" onClick={() => openEdit(p)} />
                    {can('delete_records') && (
                        <Button variant="ghost" size="sm" icon={Trash2} title="Delete" onClick={() => setDeleteTarget(p)} className="text-error hover:bg-error/10" />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Promotions"
                subtitle="Automatic basket promotions applied at checkout."
                actions={<Button icon={Plus} onClick={openCreate}>New Promotion</Button>}
            />
            <DataTable
                data={filtered}
                columns={columns}
                rowKey={(p) => p.id}
                loading={isLoading}
                searchKeys={[(p) => p.name, (p) => p.description, (p) => storeName(p.store_id)]}
                searchPlaceholder="Search promotions…"
                exportFilename={can('export_data') ? 'promotions' : undefined}
                onRowClick={(p) => openEdit(p)}
                emptyTitle="No promotions yet"
                emptyMessage="Click New Promotion to create one."
                toolbar={
                    <>
                        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44">
                            <option value="">All types</option>
                            <option value="quantity_discount">Quantity Discount</option>
                            <option value="buy_x_get_y">Buy X Get Y</option>
                            <option value="bundle_price">Bundle Price</option>
                        </Select>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </Select>
                    </>
                }
            />

            {showForm && (
                <PromotionFormModal
                    stores={stores}
                    editing={editing}
                    onClose={() => setShowForm(false)}
                    onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ['promotions'] });
                        setShowForm(false);
                    }}
                />
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && del.mutate(deleteTarget.id)}
                title="Delete promotion?"
                message={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ''}
                confirmLabel="Delete"
                loading={del.isPending}
            />
        </div>
    );
}

function PromotionFormModal({
    stores,
    editing,
    onClose,
    onSaved,
}: {
    stores: Store[];
    editing: Promotion | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const toLocalInput = (iso?: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        // YYYY-MM-DDTHH:mm in local time for datetime-local input
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const initialType = (editing?.promotion_type ?? 'quantity_discount') as keyof typeof CONFIG_TEMPLATES;
    const [form, setForm] = useState({
        name: editing?.name ?? '',
        description: editing?.description ?? '',
        promotion_type: initialType,
        config_text: JSON.stringify(editing?.config ?? CONFIG_TEMPLATES[initialType], null, 2),
        store_id: editing?.store_id ?? '',
        starts_at: toLocalInput(editing?.starts_at),
        ends_at: toLocalInput(editing?.ends_at),
        is_active: editing?.is_active ?? true,
    });
    const [configError, setConfigError] = useState<string | null>(null);

    const setType = (t: keyof typeof CONFIG_TEMPLATES) => {
        setForm(f => ({
            ...f,
            promotion_type: t,
            config_text: JSON.stringify(CONFIG_TEMPLATES[t], null, 2),
        }));
        setConfigError(null);
    };

    const save = useMutation({
        mutationFn: () => {
            let config: any;
            try {
                config = JSON.parse(form.config_text);
            } catch (e: any) {
                throw new Error(`Config is not valid JSON: ${e.message}`);
            }
            const payload = {
                name: form.name,
                description: form.description || undefined,
                promotion_type: form.promotion_type,
                config,
                store_id: form.store_id || undefined,
                starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
                ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
                is_active: form.is_active,
            };
            return editing ? promotionApi.update(editing.id, payload) : promotionApi.create(payload);
        },
        onSuccess: () => {
            toast.success(editing ? 'Promotion updated' : 'Promotion created');
            onSaved();
        },
        onError: (e: any) => {
            const msg = e?.message?.includes('valid JSON') ? e.message : getErrorMessage(e);
            setConfigError(msg);
            toast.error(msg);
        },
    });

    return (
        <Modal
            open
            onClose={onClose}
            title={editing ? 'Edit Promotion' : 'New Promotion'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => save.mutate()} loading={save.isPending}>{editing ? 'Update' : 'Create Promotion'}</Button>
                </>
            }
        >
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                <FormField label="Name" required>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </FormField>
                <FormField label="Description (optional)">
                    <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </FormField>
                <FormField label="Promotion type">
                    <Select value={form.promotion_type} onChange={e => setType(e.target.value as any)}>
                        <option value="quantity_discount">Quantity discount — buy N+, get % off</option>
                        <option value="buy_x_get_y">Buy X get Y — BOGO-style</option>
                        <option value="bundle_price">Bundle price — fixed price for a set (NOT yet evaluated at checkout)</option>
                    </Select>
                </FormField>
                <FormField label="Config (JSON — template auto-filled per type)" hint="Replace the placeholder product IDs with real ones from the Products page." error={configError ?? undefined}>
                    <Textarea
                        value={form.config_text}
                        onChange={e => { setForm(f => ({ ...f, config_text: e.target.value })); setConfigError(null); }}
                        rows={7}
                        spellCheck={false}
                        className="font-mono text-xs"
                        required
                    />
                </FormField>
                <FormField label="Scope">
                    <Select value={form.store_id ?? ''} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}>
                        <option value="">All stores (org-wide)</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Starts (optional)">
                        <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                    </FormField>
                    <FormField label="Ends (optional)">
                        <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                    </FormField>
                </div>
                <label className="flex items-center gap-2 text-sm text-on-surface">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-action-blue" />
                    Active immediately
                </label>
            </form>
        </Modal>
    );
}
