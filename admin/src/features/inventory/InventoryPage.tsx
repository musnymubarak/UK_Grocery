/**
 * Inventory management page — stock per store, adjustments, transfers.
 */
import React, { useState, useEffect } from 'react';
import { inventoryApi, storeApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { useAdminStore } from '../auth/AdminStoreContext';
import { CustomSelect } from '../../components/CustomSelect';
import { Warehouse, ArrowRightLeft, Plus, Minus, History, Edit2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
    const { isManager, user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const { selectedStore: adminSelectedStore } = useAdminStore();

    // Default to admin context store if available, else user's store, else empty string
    const defaultStoreId = isAdmin ? (adminSelectedStore?.id || '') : (user?.store_id || '');

    const [inventory, setInventory] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState(defaultStoreId);
    const [loading, setLoading] = useState(true);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ product_id: '', quantity: '', reason: '', notes: '' });
    const [transferForm, setTransferForm] = useState({ product_id: '', from_store_id: '', to_store_id: '', quantity: '', notes: '' });
    const [movements, setMovements] = useState<any[]>([]);
    const [showMovements, setShowMovements] = useState(false);

    useEffect(() => { loadStores(); }, []);

    // Sync local selectedStore with admin's globally selected store when it changes externally
    useEffect(() => {
        if (isAdmin && adminSelectedStore) {
            setSelectedStore(adminSelectedStore.id);
        }
    }, [isAdmin, adminSelectedStore]);

    useEffect(() => { if (selectedStore) loadInventory(); }, [selectedStore]);

    const loadStores = async () => {
        try {
            const res = await storeApi.list();
            setStores(res.data || []);
            // Only auto-select first store if we don't already have one selected via context/user profile
            if (res.data?.length > 0 && !selectedStore) setSelectedStore(res.data[0].id);
        } catch (err) { console.error(err); }
    };

    const loadInventory = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getStoreInventory(selectedStore, { limit: 500 });
            setInventory(res.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryApi.adjust({
                product_id: adjustForm.product_id,
                store_id: selectedStore,
                quantity: parseInt(adjustForm.quantity),
                reason: adjustForm.reason,
                notes: adjustForm.notes,
            });
            toast.success('Stock adjusted');
            setShowAdjustModal(false);
            loadInventory();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Adjustment failed')); }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryApi.transfer({
                product_id: transferForm.product_id,
                from_store_id: transferForm.from_store_id,
                to_store_id: transferForm.to_store_id,
                quantity: parseInt(transferForm.quantity),
                notes: transferForm.notes,
            });
            toast.success('Stock transferred');
            setShowTransferModal(false);
            loadInventory();
        } catch (err: any) { toast.error(getErrorMessage(err, 'Transfer failed')); }
    };

    const loadMovements = async () => {
        try {
            const res = await inventoryApi.movements(selectedStore, { limit: 50 });
            setMovements(res.data || []);
            setShowMovements(true);
        } catch (err) { console.error(err); }
    };

    const getStockPercentage = (current: number) => {
        const threshold = 100; // Assuming 100 as "full" for demo
        return Math.min((current / threshold) * 100, 100);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="input-group">
                        <Warehouse size={18} color="var(--text-muted)" />
                        <CustomSelect
                            options={stores.map((s: any) => ({ value: s.id, label: s.name }))}
                            value={selectedStore}
                            onChange={(val) => setSelectedStore(val)}
                            disabled={isManager}
                            style={{ width: 220 }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={loadMovements}><History size={16} /> History</button>
                    {!isAdmin && <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}><ArrowRightLeft size={16} /> Transfer</button>}
                    <button className="btn btn-primary" onClick={() => setShowAdjustModal(true)} style={{ padding: '12px 24px' }}>
                        <Plus size={18} /> Adjust Stock
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Current Stock</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>All Items</span>
                        <span className="badge" style={{ padding: '6px 14px', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Produce</span>
                        <span className="badge" style={{ padding: '6px 14px', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Dairy</span>
                    </div>
                </div>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock Level</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : inventory.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>No inventory records</td></tr>
                            ) : inventory.map((item: any) => {
                                const stockPct = getStockPercentage(item.quantity);
                                const isLow = item.quantity <= 10;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ width: 48, height: 48, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <ImageIcon size={20} style={{ opacity: 0.3 }} />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.product_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.product_sku}</div>
                                        </td>
                                        <td>{item.category || 'General'}</td>
                                        <td style={{ fontWeight: 600 }}>£{(item.price || 4.99).toFixed(2)}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/unit</span></td>
                                        <td style={{ width: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ flex: 1, height: 8, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        width: `${stockPct}%`, 
                                                        height: '100%', 
                                                        background: isLow ? 'var(--danger)' : 'var(--primary)',
                                                        borderRadius: 4
                                                    }} />
                                                </div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, width: 60 }}>
                                                    {item.quantity} lbs
                                                </div>
                                            </div>
                                            {isLow && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 4, fontWeight: 600 }}>Low Stock Warning</div>}
                                        </td>
                                        <td>
                                            <span className={`badge ${item.quantity > 0 ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase', fontStyle: 'normal', borderRadius: 4 }}>
                                                {item.quantity > 0 ? 'ACTIVE' : 'OUT OF STOCK'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-icon" onClick={() => setShowAdjustModal(true)}>
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {showAdjustModal && (
                <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Adjust Stock</h3>
                        </div>
                        <form onSubmit={handleAdjust}>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-select" value={adjustForm.product_id} onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })} required>
                                    <option value="">Select product...</option>
                                    {inventory.map((item: any) => <option key={item.product_id} value={item.product_id}>{item.product_name} (Qty: {item.quantity})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity (+/−)</label>
                                <input type="number" className="form-input" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason *</label>
                                <input className="form-input" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Adjust</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Transfer Stock</h3>
                        </div>
                        <form onSubmit={handleTransfer}>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-select" value={transferForm.product_id} onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })} required>
                                    <option value="">Select product...</option>
                                    {inventory.map((item: any) => <option key={item.product_id} value={item.product_id}>{item.product_name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">From Store</label>
                                    <select className="form-select" value={transferForm.from_store_id} onChange={(e) => setTransferForm({ ...transferForm, from_store_id: e.target.value })} required>
                                        <option value="">Select...</option>
                                        {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">To Store</label>
                                    <select className="form-select" value={transferForm.to_store_id} onChange={(e) => setTransferForm({ ...transferForm, to_store_id: e.target.value })} required>
                                        <option value="">Select...</option>
                                        {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input type="number" min="1" className="form-input" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Movement History Modal */}
            {showMovements && (
                <div className="modal-overlay" onClick={() => setShowMovements(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Stock Movement History</h3>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead><tr><th>Type</th><th>Qty</th><th>Reference</th><th>Date</th></tr></thead>
                                <tbody>
                                    {movements.map((m: any) => (
                                        <tr key={m.id}>
                                            <td><span className={`badge ${m.quantity > 0 ? 'badge-success' : 'badge-danger'}`}>{m.movement_type}</span></td>
                                            <td style={{ fontWeight: 600 }}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                                            <td>{m.reference || '—'}</td>
                                            <td>{new Date(m.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
