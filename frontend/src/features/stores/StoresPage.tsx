/**
 * Store management page — admin only.
 */
import React, { useState, useEffect } from 'react';
import { storeApi, getErrorMessage } from '../../services/api';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={20} /> Stores</h3>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={16} /> Add Store
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>City</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : stores.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                                    No stores yet. Add your first store to get started.
                                </td></tr>
                            ) : stores.map((store) => (
                                <tr key={store.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{store.name}</td>
                                    <td><span className="badge badge-primary">{store.code}</span></td>
                                    <td>{store.city || '—'}</td>
                                    <td>{store.phone || '—'}</td>
                                    <td>
                                        <span className={`badge ${store.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {store.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon" onClick={() => openEdit(store)}><Edit2 size={14} /></button>
                                            <button className="btn-icon" onClick={() => handleDelete(store.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
