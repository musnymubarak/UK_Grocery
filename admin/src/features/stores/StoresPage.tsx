/**
 * Store management page — admin only.
 */
import React, { useState, useEffect } from 'react';
import { storeApi, getErrorMessage } from '../../services/api';
import { Plus, Edit2, Trash2, MapPin, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Store {
    id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    created_at: string;
}

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editStore, setEditStore] = useState<Store | null>(null);
    const [form, setForm] = useState({
        name: '', code: '', address: '', city: '', state: '',
        country: '', phone: '', email: '',
    });

    useEffect(() => { loadStores(); }, []);

    const loadStores = async () => {
        try {
            const res = await storeApi.list();
            setStores(res.data.items || res.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: form.name,
                code: form.code,
                address: form.address || undefined,
                city: form.city || undefined,
                state: form.state || undefined,
                country: form.country || undefined,
                phone: form.phone || undefined,
                email: form.email || undefined,
            };
            if (editStore) {
                await storeApi.update(editStore.id, payload);
                toast.success('Store updated');
            } else {
                await storeApi.create(payload);
                toast.success('Store created');
            }
            setShowModal(false);
            resetForm();
            loadStores();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Failed')); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this store?')) return;
        try {
            await storeApi.delete(id);
            toast.success('Store deleted');
            loadStores();
        } catch (err) { toast.error('Failed to delete'); }
    };

    const resetForm = () => {
        setEditStore(null);
        setForm({ name: '', code: '', address: '', city: '', state: '', country: '', phone: '', email: '' });
    };

    const openEdit = (store: Store) => {
        setEditStore(store);
        setForm({
            name: store.name, code: store.code, address: store.address || '',
            city: store.city || '', state: store.state || '', country: store.country || '',
            phone: store.phone || '', email: store.email || '',
        });
        setShowModal(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Stores</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px' }}>
                        Manage your physical locations, monitor fulfillment health, and configure local availability.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                        <button className="btn btn-secondary" style={{ border: 'none', background: 'var(--bg-card)', padding: '8px 16px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={14} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, transform: 'scale(1.2)' }} /> Grid</div>
                        </button>
                        <button className="btn btn-secondary" style={{ border: 'none', background: 'transparent', padding: '8px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} /> Map</div>
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }} style={{ padding: '14px 28px', fontSize: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Plus size={20} />
                            Add New Store
                        </div>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100 }}><div className="loading-spinner"><div className="spinner" /></div></div>
                ) : stores.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>No stores found.</div>
                ) : stores.map((store) => (
                    <div key={store.id} className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{store.name}</h2>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, padding: '2px 6px', background: store.is_active ? 'var(--success-bg)' : 'var(--danger-bg)', color: store.is_active ? 'var(--success)' : 'var(--danger)' }}>
                                        {store.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
                                    <MapPin size={16} />
                                    {store.address || 'Location not set'}
                                </div>
                            </div>
                            <div style={{ 
                                width: 44, height: 24, background: store.is_active ? 'var(--primary)' : '#ddd', 
                                borderRadius: 12, position: 'relative', cursor: 'pointer' 
                            }}>
                                <div style={{ 
                                    width: 18, height: 18, background: '#fff', borderRadius: '50%', 
                                    position: 'absolute', top: 3, left: store.is_active ? 23 : 3,
                                    transition: 'all 0.2s'
                                }} />
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ccc', overflow: 'hidden' }}>
                                <img src={`https://ui-avatars.com/api/?name=Manager&background=random`} alt="Avatar" style={{ width: '100%', height: '100%' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manager</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Sarah Jenkins</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Orders</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0' }}>142</div>
                                <div style={{ height: 4, background: '#ddd', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ width: '60%', height: '100%', background: 'var(--primary)' }} />
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Today's Revenue</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0' }}>£4,250</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>+12%</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                <Truck size={18} />
                                Avg. Fulfillment: <b>24m</b>
                            </div>
                            <button className="btn-icon" onClick={() => openEdit(store)} style={{ border: 'none', background: 'transparent' }}>
                                <Edit2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editStore ? 'Edit Store' : 'New Store'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label className="form-label">Store Name *</label>
                                    <input className="form-input" value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Code *</label>
                                    <input className="form-input" value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })} required
                                        placeholder="e.g. MAIN-01" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input className="form-input" value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">City</label>
                                    <input className="form-input" value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">State</label>
                                    <input className="form-input" value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Country</label>
                                    <input className="form-input" value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editStore ? 'Update' : 'Create'} Store</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
