/**
 * User management page (admin only) — list, create, edit, assign stores.
 */
import React, { useState, useEffect } from 'react';
import { authApi, storeApi, getErrorMessage } from '../../services/api';
import { Plus, Edit2, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserItem {
    id: string;
    email: string;
    full_name: string;
    role: string;
    phone?: string;
    store_id?: string;
    is_active: boolean;
    created_at: string;
}

interface StoreItem {
    id: string;
    name: string;
    code: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUser, setEditUser] = useState<UserItem | null>(null);

    // Create form
    const [createForm, setCreateForm] = useState({
        email: '', password: '', full_name: '', role: 'cashier',
        phone: '', store_id: '',
    });

    // Edit form
    const [editForm, setEditForm] = useState({
        full_name: '', role: '', phone: '', store_id: '', is_active: true,
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [usersRes, storesRes] = await Promise.all([
                authApi.listUsers(),
                storeApi.list(),
            ]);
            setUsers(usersRes.data || []);
            setStores(storesRes.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authApi.createUser({
                email: createForm.email,
                password: createForm.password,
                full_name: createForm.full_name,
                role: createForm.role,
                phone: createForm.phone || undefined,
                store_id: createForm.store_id || undefined,
            });
            toast.success('User created');
            setShowCreateModal(false);
            setCreateForm({ email: '', password: '', full_name: '', role: 'cashier', phone: '', store_id: '' });
            loadData();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Failed to create user')); }
    };

    const openEdit = (user: UserItem) => {
        setEditUser(user);
        setEditForm({
            full_name: user.full_name,
            role: user.role,
            phone: user.phone || '',
            store_id: user.store_id || '',
            is_active: user.is_active,
        });
        setShowEditModal(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        try {
            const payload: any = {
                full_name: editForm.full_name,
                role: editForm.role,
                phone: editForm.phone || undefined,
                store_id: editForm.store_id || null,
                is_active: editForm.is_active,
            };
            await authApi.updateUser(editUser.id, payload);
            toast.success('User updated');
            setShowEditModal(false);
            setEditUser(null);
            loadData();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Failed to update user')); }
    };

    const getStoreName = (storeId?: string) => {
        if (!storeId) return '—';
        return stores.find(s => s.id === storeId)?.name || '—';
    };

    const getRoleBadge = (role: string) => {
        const cls = role === 'admin' ? 'badge-danger' : role === 'manager' ? 'badge-warning' : 'badge-info';
        return <span className={`badge ${cls}`}>{role}</span>;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={20} /> User Management</h3>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} /> Add User
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Store</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                                    <Shield size={32} style={{ marginBottom: 8, opacity: 0.5 }} /><br />
                                    No users found. Create your first user to get started.
                                </td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.full_name}</td>
                                    <td>{user.email}</td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td>
                                        {getStoreName(user.store_id)}
                                        {!user.store_id && (user.role === 'manager' || user.role === 'cashier') && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Shield size={12} /> No store assigned
                                            </div>
                                        )}
                                    </td>
                                    <td>{user.phone || '—'}</td>
                                    <td>
                                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-icon" onClick={() => openEdit(user)} title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New User</h3>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" value={createForm.full_name}
                                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input type="email" className="form-input" value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <input type="password" className="form-input" value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Role *</label>
                                    <select className="form-select" value={createForm.role}
                                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Store</label>
                                    <select className="form-select" value={createForm.store_id}
                                        onChange={(e) => setCreateForm({ ...createForm, store_id: e.target.value })}>
                                        <option value="">No store</option>
                                        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={createForm.phone}
                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editUser && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit User — {editUser.email}</h3>
                        </div>
                        <form onSubmit={handleEdit}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Role *</label>
                                    <select className="form-select" value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Assign Store</label>
                                    <select className="form-select" value={editForm.store_id}
                                        onChange={(e) => setEditForm({ ...editForm, store_id: e.target.value })}>
                                        <option value="">No store</option>
                                        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
                                    Active
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
