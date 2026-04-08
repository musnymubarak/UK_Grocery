/**
 * Categories management page.
 */
import React, { useState, useEffect } from 'react';
import { categoryApi, getErrorMessage } from '../../services/api';
import type { Category } from '../../types';
import { Plus, Edit2, Trash2, Tags } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: '', description: '', parent_id: '', sort_order: '0' });

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            const res = await categoryApi.list();
            setCategories(res.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                parent_id: form.parent_id || undefined,
                sort_order: parseInt(form.sort_order) || 0,
            };
            if (editCategory) {
                await categoryApi.update(editCategory.id, payload);
                toast.success('Category updated');
            } else {
                await categoryApi.create(payload);
                toast.success('Category created');
            }
            setShowModal(false);
            resetForm();
            loadCategories();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Failed')); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        try {
            await categoryApi.delete(id);
            toast.success('Category deleted');
            loadCategories();
        } catch (err) { toast.error('Failed to delete'); }
    };

    const resetForm = () => {
        setEditCategory(null);
        setForm({ name: '', description: '', parent_id: '', sort_order: '0' });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Tags size={20} /> Categories</h3>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={16} /> Add Category
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Name</th><th>Description</th><th>Parent</th><th>Order</th><th>Actions</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No categories</td></tr>
                            ) : categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cat.name}</td>
                                    <td>{cat.description || '—'}</td>
                                    <td>{categories.find(c => c.id === cat.parent_id)?.name || '—'}</td>
                                    <td>{cat.sort_order}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon" onClick={() => {
                                                setEditCategory(cat);
                                                setForm({ name: cat.name, description: cat.description || '', parent_id: cat.parent_id || '', sort_order: String(cat.sort_order) });
                                                setShowModal(true);
                                            }}><Edit2 size={14} /></button>
                                            <button className="btn-icon" onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editCategory ? 'Edit Category' : 'New Category'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Parent Category</label>
                                <select className="form-select" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                                    <option value="">None (Top Level)</option>
                                    {categories.filter(c => c.id !== editCategory?.id).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sort Order</label>
                                <input type="number" className="form-input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editCategory ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
