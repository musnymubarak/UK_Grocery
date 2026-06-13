/**
 * Categories management page.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi, getErrorMessage } from '../../services/api';
import type { Category } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Button, FormField, Input, Select } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { usePermissions } from '../../features/auth/PermissionContext';

const EMPTY = { name: '', description: '', parent_id: '', sort_order: '0' };

export default function CategoriesPage() {
    const qc = useQueryClient();
    const { can } = usePermissions();
    const [showModal, setShowModal] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryApi.list()).data as Category[],
    });

    const saveMut = useMutation({
        mutationFn: (payload: any) => editCategory ? categoryApi.update(editCategory.id, payload) : categoryApi.create(payload),
        onSuccess: () => {
            toast.success(editCategory ? 'Category updated' : 'Category created');
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed')),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => categoryApi.delete(id),
        onSuccess: () => {
            toast.success('Category deleted');
            setDeleteId(null);
            qc.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to delete')),
    });

    const parentName = (id?: string) => categories.find((c) => c.id === id)?.name ?? '—';

    const openCreate = () => { setEditCategory(null); setForm(EMPTY); setShowModal(true); };
    const openEdit = (cat: Category) => {
        setEditCategory(cat);
        setForm({ name: cat.name, description: cat.description || '', parent_id: cat.parent_id || '', sort_order: String(cat.sort_order) });
        setShowModal(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMut.mutate({
            name: form.name,
            description: form.description || undefined,
            parent_id: form.parent_id || undefined,
            sort_order: parseInt(form.sort_order) || 0,
        });
    };

    const columns: Column<Category>[] = [
        {
            key: 'name', header: 'Name', sortable: true, accessor: (c) => c.name, render: (c) => (
                <div>
                    <div className="font-semibold text-on-surface">{c.name}</div>
                    {c.description && <div className="text-xs text-on-surface-variant">{c.description}</div>}
                </div>
            ),
        },
        { key: 'parent', header: 'Parent', sortable: true, accessor: (c) => parentName(c.parent_id), render: (c) => parentName(c.parent_id) },
        { key: 'sort_order', header: 'Sort order', align: 'center', sortable: true, accessor: (c) => c.sort_order },
        {
            key: 'actions', header: '', align: 'right', accessor: () => '', render: (c) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(c)} />
                    {can('delete_records') && (
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(c.id)} className="text-error hover:bg-error/10" />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Categories"
                subtitle="Organise your catalogue into a browsable hierarchy."
                actions={<Button icon={Plus} onClick={openCreate}>Add category</Button>}
            />
            <DataTable
                data={categories}
                columns={columns}
                rowKey={(c) => c.id}
                loading={isLoading}
                searchKeys={[(c) => c.name, (c) => c.description]}
                searchPlaceholder="Search categories…"
                exportFilename={can('export_data') ? 'categories' : undefined}
                emptyTitle="No categories yet"
                emptyMessage="Add your first category to start organising products."
            />

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editCategory ? 'Edit Category' : 'New Category'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={submit} loading={saveMut.isPending}>{editCategory ? 'Update' : 'Create'}</Button>
                    </>
                }
            >
                <form onSubmit={submit}>
                    <FormField label="Name" required>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </FormField>
                    <FormField label="Description">
                        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </FormField>
                    <FormField label="Parent category">
                        <Select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                            <option value="">None (Top Level)</option>
                            {categories.filter((c) => c.id !== editCategory?.id).map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Sort order">
                        <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                    </FormField>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
                title="Delete category?"
                message="The category will be removed. Products are kept but lose this category."
                confirmLabel="Delete"
                loading={deleteMut.isPending}
            />
        </div>
    );
}
