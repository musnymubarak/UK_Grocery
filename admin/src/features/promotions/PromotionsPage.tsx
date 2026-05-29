import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionApi, storeApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Tag } from 'lucide-react';

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
    const [showCreate, setShowCreate] = useState(false);

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
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });

    const counts = {
        total: promos.length,
        active: promos.filter(p => p.is_active).length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Kpi label="Total promotions" value={counts.total} />
                <Kpi label="Active" value={counts.active} color="var(--success)" />
                <Kpi label="Inactive" value={counts.total - counts.active} color="var(--text-secondary)" />
            </div>

            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Promotions</h3>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={16} /> New Promotion
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ padding: 24 }}>Loading…</div>
                ) : promos.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Tag size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                        <div>No promotions yet.</div>
                        <div style={{ fontSize: '0.85rem', marginTop: 6 }}>
                            Click <strong>New Promotion</strong> to create one.
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Scope</th>
                                    <th>Window</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promos.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            {p.description && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.description}</div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{TYPE_LABEL[p.promotion_type] ?? p.promotion_type}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{storeName(p.store_id)}</td>
                                        <td style={{ fontSize: '0.8rem' }}>
                                            {p.starts_at || p.ends_at ? (
                                                <>
                                                    {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : '—'}
                                                    {' → '}
                                                    {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : '—'}
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>Always</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${p.is_active ? 'success' : 'danger'}`}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => toggle.mutate({ id: p.id, active: !p.is_active })}
                                                title={p.is_active ? 'Disable' : 'Enable'}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: p.is_active ? 'var(--success)' : 'var(--text-secondary)' }}
                                            >
                                                {p.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Delete "${p.name}"?`)) del.mutate(p.id);
                                                }}
                                                title="Delete"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--danger)', marginLeft: 4 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreate && (
                <CreatePromotionModal
                    stores={stores}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['promotions'] });
                        setShowCreate(false);
                    }}
                />
            )}
        </div>
    );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                {label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
        </div>
    );
}

function CreatePromotionModal({
    stores,
    onClose,
    onCreated,
}: {
    stores: Store[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        promotion_type: 'quantity_discount' as keyof typeof CONFIG_TEMPLATES,
        config_text: JSON.stringify(CONFIG_TEMPLATES['quantity_discount'], null, 2),
        store_id: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
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

    const create = useMutation({
        mutationFn: () => {
            let config: any;
            try {
                config = JSON.parse(form.config_text);
            } catch (e: any) {
                throw new Error(`Config is not valid JSON: ${e.message}`);
            }
            return promotionApi.create({
                name: form.name,
                description: form.description || undefined,
                promotion_type: form.promotion_type,
                config,
                store_id: form.store_id || undefined,
                starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
                ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
                is_active: form.is_active,
            });
        },
        onSuccess: () => {
            toast.success('Promotion created');
            onCreated();
        },
        onError: (e: any) => {
            const msg = e?.message?.includes('valid JSON')
                ? e.message
                : getErrorMessage(e);
            setConfigError(msg);
            toast.error(msg);
        },
    });

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-card, #fff)', borderRadius: 'var(--radius-lg)',
                    padding: 24, width: '100%', maxWidth: 560, boxShadow: 'var(--shadow-lg)',
                    maxHeight: '90vh', overflowY: 'auto',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>New Promotion</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>
                <form
                    onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                    <Field label="Name">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="form-input" />
                    </Field>
                    <Field label="Description (optional)">
                        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input" />
                    </Field>
                    <Field label="Promotion type">
                        <select
                            value={form.promotion_type}
                            onChange={e => setType(e.target.value as any)}
                            className="form-input"
                        >
                            <option value="quantity_discount">Quantity discount — buy N+, get % off</option>
                            <option value="buy_x_get_y">Buy X get Y — BOGO-style</option>
                            <option value="bundle_price">Bundle price — fixed price for a set (NOT yet evaluated at checkout)</option>
                        </select>
                    </Field>
                    <Field label="Config (JSON — template auto-filled per type)">
                        <textarea
                            value={form.config_text}
                            onChange={e => { setForm(f => ({ ...f, config_text: e.target.value })); setConfigError(null); }}
                            rows={7}
                            spellCheck={false}
                            className="form-input"
                            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                            required
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                            Replace the placeholder product IDs with real ones from the Products page.
                        </small>
                        {configError && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>{configError}</div>
                        )}
                    </Field>
                    <Field label="Scope">
                        <select value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))} className="form-input">
                            <option value="">All stores (org-wide)</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Starts (optional)">
                            <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="form-input" />
                        </Field>
                        <Field label="Ends (optional)">
                            <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="form-input" />
                        </Field>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                        Active immediately
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={create.isPending} className="btn btn-primary">
                            {create.isPending ? 'Creating…' : 'Create Promotion'}
                        </button>
                    </div>
                </form>
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
