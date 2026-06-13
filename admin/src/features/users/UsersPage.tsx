/**
 * User management page (admin only) — list, create, edit, delete, assign stores.
 */
import React, { useEffect, useState } from 'react';
import { authApi, storeApi, getErrorMessage } from '../../services/api';
import { usePermissions } from '../../features/auth/PermissionContext';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { PageHeader, Button, Badge, FormField, Input, Select } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';

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

const ROLE_TONE: Record<string, any> = { admin: 'danger', super_admin: 'danger', manager: 'warning' };

export default function UsersPage() {
    const { can } = usePermissions();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUser, setEditUser] = useState<UserItem | null>(null);
    const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const openCreate = () => {
        setCreateForm({ email: '', password: '', full_name: '', role: 'cashier', phone: '', store_id: '' });
        setShowCreateModal(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
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
        finally { setCreating(false); }
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
        setSaving(true);
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
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteUser) return;
        setDeleting(true);
        try {
            await authApi.deleteUser(deleteUser.id);
            toast.success('User deleted');
            setDeleteUser(null);
            loadData();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Failed to delete user')); }
        finally { setDeleting(false); }
    };

    const getStoreName = (storeId?: string) => {
        if (!storeId) return '—';
        return stores.find(s => s.id === storeId)?.name || '—';
    };

    const needsStore = (u: UserItem) => !u.store_id && (u.role === 'manager' || u.role === 'cashier');

    const columns: Column<UserItem>[] = [
        {
            key: 'name', header: 'Name', sortable: true, accessor: (u) => u.full_name,
            render: (u) => (
                <div>
                    <div className="font-semibold text-on-surface">{u.full_name}</div>
                    {u.phone && <div className="text-xs text-on-surface-variant">{u.phone}</div>}
                </div>
            ),
        },
        { key: 'email', header: 'Email', sortable: true, accessor: (u) => u.email },
        {
            key: 'role', header: 'Role', align: 'center', accessor: (u) => u.role,
            render: (u) => <Badge tone={ROLE_TONE[u.role] || 'info'}>{u.role}</Badge>,
        },
        {
            key: 'store', header: 'Store', accessor: (u) => getStoreName(u.store_id),
            render: (u) => (
                <div>
                    <div className="text-on-surface">{getStoreName(u.store_id)}</div>
                    {needsStore(u) && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-warning">
                            <ShieldAlert size={12} /> No store assigned
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'status', header: 'Status', align: 'center', accessor: (u) => (u.is_active ? 'Active' : 'Inactive'),
            render: (u) => <Badge tone={u.is_active ? 'success' : 'neutral'} dot>{u.is_active ? 'Active' : 'Inactive'}</Badge>,
        },
        {
            key: 'actions', header: '', align: 'right',
            render: (u) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(u)} />
                    {can('delete_records') && (
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteUser(u)} className="text-error hover:bg-error/10" />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="User Management"
                subtitle="Manage staff accounts, roles and store assignments."
                actions={<Button icon={Plus} onClick={openCreate}>Add user</Button>}
            />
            <DataTable
                data={users}
                columns={columns}
                rowKey={(u) => u.id}
                loading={loading}
                searchKeys={[(u) => u.full_name, (u) => u.email, (u) => u.phone]}
                searchPlaceholder="Search users…"
                {...(can('export_data') ? { exportFilename: 'users' } : {})}
                emptyTitle="No users yet"
                emptyMessage="Create your first user to get started."
            />

            {/* Create user */}
            <Modal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create new user"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button onClick={handleCreate} loading={creating}>Create user</Button>
                    </>
                }
            >
                <form onSubmit={handleCreate}>
                    <FormField label="Full name" required>
                        <Input value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} required />
                    </FormField>
                    <FormField label="Email" required>
                        <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                    </FormField>
                    <FormField label="Password" required>
                        <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Role" required>
                            <Select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="cashier">Cashier</option>
                            </Select>
                        </FormField>
                        <FormField label="Store">
                            <Select value={createForm.store_id} onChange={(e) => setCreateForm({ ...createForm, store_id: e.target.value })}>
                                <option value="">No store</option>
                                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </FormField>
                    </div>
                    <FormField label="Phone">
                        <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                    </FormField>
                </form>
            </Modal>

            {/* Edit user */}
            <Modal
                open={showEditModal && !!editUser}
                onClose={() => { setShowEditModal(false); setEditUser(null); }}
                title={editUser ? `Edit user — ${editUser.email}` : 'Edit user'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditUser(null); }}>Cancel</Button>
                        <Button onClick={handleEdit} loading={saving}>Save changes</Button>
                    </>
                }
            >
                <form onSubmit={handleEdit}>
                    <FormField label="Full name" required>
                        <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} required />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Role" required>
                            <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="cashier">Cashier</option>
                            </Select>
                        </FormField>
                        <FormField label="Assign store">
                            <Select value={editForm.store_id} onChange={(e) => setEditForm({ ...editForm, store_id: e.target.value })}>
                                <option value="">No store</option>
                                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </FormField>
                    </div>
                    <FormField label="Phone">
                        <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </FormField>
                    <FormField label="Status">
                        <Select value={editForm.is_active ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === '1' })}>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!deleteUser}
                onClose={() => setDeleteUser(null)}
                onConfirm={handleDelete}
                title="Delete user?"
                message={deleteUser ? `${deleteUser.full_name} (${deleteUser.email}) will be permanently removed.` : ''}
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
