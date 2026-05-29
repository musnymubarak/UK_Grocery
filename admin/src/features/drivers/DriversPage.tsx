import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, storeApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Bike, Car, Truck as TruckIcon, X, CircleDot, Circle } from 'lucide-react';

interface Driver {
    id: string;
    email: string;
    full_name: string;
    phone?: string | null;
    store_id?: string | null;
    is_active: boolean;
    created_at: string;
    vehicle_type?: string | null;
    is_available: boolean;
    is_online: boolean;
    total_deliveries: number;
    shift_start?: string | null;
}

interface Store {
    id: string;
    name: string;
}

const VEHICLE_ICON: Record<string, React.ReactNode> = {
    bike: <Bike size={14} />,
    car: <Car size={14} />,
    van: <TruckIcon size={14} />,
};

export default function DriversPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);

    const { data: drivers = [], isLoading } = useQuery<Driver[]>({
        queryKey: ['drivers'],
        queryFn: async () => (await driverApi.list()).data,
    });

    const { data: stores = [] } = useQuery<Store[]>({
        queryKey: ['stores'],
        queryFn: async () => (await storeApi.list()).data,
    });

    const storeName = (id?: string | null) => stores.find(s => s.id === id)?.name ?? '—';

    const counts = {
        total: drivers.length,
        active: drivers.filter(d => d.is_active).length,
        online: drivers.filter(d => d.is_online).length,
        available: drivers.filter(d => d.is_available && d.is_online).length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <Kpi label="Total drivers" value={counts.total} />
                <Kpi label="Active accounts" value={counts.active} />
                <Kpi label="Online now" value={counts.online} color="var(--info)" />
                <Kpi label="Available now" value={counts.available} color="var(--success)" />
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Delivery Drivers ({counts.total})</h3>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={16} /> New Driver
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ padding: 24 }}>Loading drivers…</div>
                ) : drivers.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No drivers yet. Click <strong>New Driver</strong> to onboard your first one.
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Driver</th>
                                    <th>Contact</th>
                                    <th>Store</th>
                                    <th>Vehicle</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Deliveries</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.map(d => (
                                    <tr key={d.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{d.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.email}</div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{d.phone || '—'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{storeName(d.store_id)}</td>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                                {d.vehicle_type ? VEHICLE_ICON[d.vehicle_type] ?? null : null}
                                                {d.vehicle_type || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span className={`badge badge-${d.is_active ? 'success' : 'danger'}`}>
                                                    {d.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: d.is_online ? 'var(--success)' : 'var(--text-secondary)' }}>
                                                    {d.is_online ? <CircleDot size={10} /> : <Circle size={10} />}
                                                    {d.is_online ? (d.is_available ? 'online · available' : 'online · busy') : 'offline'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.total_deliveries}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateDriverModal
                    stores={stores}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['drivers'] });
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

function CreateDriverModal({
    stores,
    onClose,
    onCreated,
}: {
    stores: Store[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        store_id: '',
        vehicle_type: 'bike',
    });

    const create = useMutation({
        mutationFn: () =>
            driverApi.create({
                email: form.email,
                password: form.password,
                full_name: form.full_name,
                phone: form.phone || undefined,
                store_id: form.store_id || undefined,
                vehicle_type: form.vehicle_type || undefined,
            }),
        onSuccess: () => {
            toast.success(`Driver ${form.full_name} created`);
            onCreated();
        },
        onError: (e) => {
            toast.error(getErrorMessage(e));
        },
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        create.mutate();
    };

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
                    padding: 24, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>New Driver</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label="Full name">
                        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required className="form-input" />
                    </Field>
                    <Field label="Email">
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="form-input" />
                    </Field>
                    <Field label="Password (min 6 chars)">
                        <input type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="form-input" />
                    </Field>
                    <Field label="Phone">
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+44…" className="form-input" />
                    </Field>
                    <Field label="Assigned store">
                        <select value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))} className="form-input">
                            <option value="">— None —</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Vehicle">
                        <select value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))} className="form-input">
                            <option value="bike">Bike</option>
                            <option value="car">Car</option>
                            <option value="van">Van</option>
                        </select>
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={create.isPending} className="btn btn-primary">
                            {create.isPending ? 'Creating…' : 'Create Driver'}
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
