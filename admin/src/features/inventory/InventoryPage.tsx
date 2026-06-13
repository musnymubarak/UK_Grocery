/**
 * Inventory management page — stock per store, adjustments, transfers.
 * Migrated to the design-system DataTable + primitives + Modal.
 */
import React, { useState, useEffect } from 'react';
import { inventoryApi, storeApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { useAdminStore } from '../auth/AdminStoreContext';
import { DataTable, type Column } from '../../components/ui/DataTable';
import {
    PageHeader,
    Button,
    Badge,
    Card,
    FormField,
    Input,
    Select,
    EmptyState,
} from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { Warehouse, ArrowRightLeft, Plus, History } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventoryItem {
    id: string;
    product_id: string;
    product_name?: string;
    product_sku?: string;
    product_unit?: string;
    quantity: number;
}

interface Movement {
    id: string;
    movement_type?: string;
    quantity: number;
    reference?: string | null;
    created_at: string;
}

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryPage() {
    const { isManager, user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const { selectedStore: adminSelectedStore } = useAdminStore();

    // Default to admin context store if available, else user's store, else empty string
    const defaultStoreId = isAdmin ? (adminSelectedStore?.id || '') : (user?.store_id || '');

    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState(defaultStoreId);
    const [loading, setLoading] = useState(true);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ product_id: '', quantity: '', reason: '', notes: '' });
    const [transferForm, setTransferForm] = useState({ product_id: '', from_store_id: '', to_store_id: '', quantity: '', notes: '' });
    const [movements, setMovements] = useState<Movement[]>([]);
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

    const stockTone = (qty: number): 'danger' | 'warning' | 'success' => {
        if (qty <= 0) return 'danger';
        if (qty <= LOW_STOCK_THRESHOLD) return 'warning';
        return 'success';
    };

    const columns: Column<InventoryItem>[] = [
        {
            key: 'product_name',
            header: 'Product',
            sortable: true,
            accessor: (i) => i.product_name ?? '',
            render: (i) => <span className="font-semibold text-on-surface">{i.product_name || '—'}</span>,
        },
        {
            key: 'product_sku',
            header: 'SKU',
            accessor: (i) => i.product_sku ?? '',
            render: (i) => <span className="text-on-surface-variant">{i.product_sku || '—'}</span>,
        },
        {
            key: 'quantity',
            header: 'Current Stock',
            sortable: true,
            accessor: (i) => i.quantity ?? 0,
            render: (i) => {
                const qty = i.quantity ?? 0;
                const tone = stockTone(qty);
                const label = qty <= 0 ? 'Out of stock' : `${qty} ${i.product_unit || 'units'}`;
                return (
                    <span className="inline-flex items-center gap-2">
                        <Badge tone={tone}>{label}</Badge>
                        {qty > 0 && qty <= LOW_STOCK_THRESHOLD && (
                            <span className="text-xs font-semibold text-warning">Low stock</span>
                        )}
                    </span>
                );
            },
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (i) => ((i.quantity ?? 0) > 0 ? 'Active' : 'Out of stock'),
            render: (i) => (
                <Badge tone={(i.quantity ?? 0) > 0 ? 'success' : 'danger'}>
                    {(i.quantity ?? 0) > 0 ? 'Active' : 'Out of stock'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: () => (
                <Button variant="ghost" size="sm" icon={History} onClick={loadMovements}>
                    History
                </Button>
            ),
        },
    ];

    const headerActions = (
        <>
            <Button variant="secondary" icon={History} onClick={loadMovements}>History</Button>
            {!isAdmin && (
                <Button variant="secondary" icon={ArrowRightLeft} onClick={() => setShowTransferModal(true)}>
                    Transfer
                </Button>
            )}
            <Button variant="primary" icon={Plus} onClick={() => setShowAdjustModal(true)}>
                Adjust Stock
            </Button>
        </>
    );

    const storeSelector = (
        <div className="flex items-center gap-2">
            <Warehouse size={18} className="text-on-surface-variant" />
            <Select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                disabled={isManager}
                className="w-56"
                aria-label="Store"
            >
                <option value="">Select store…</option>
                {stores.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </Select>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Inventory"
                subtitle="Stock levels, adjustments and transfers per store."
                actions={headerActions}
            />

            {!selectedStore ? (
                <Card className="p-0">
                    <EmptyState
                        icon={Warehouse}
                        title="Select a store"
                        message="Choose a store to view and manage its inventory."
                        action={storeSelector}
                    />
                </Card>
            ) : (
                <DataTable<InventoryItem>
                    data={inventory}
                    columns={columns}
                    rowKey={(i) => i.id}
                    loading={loading}
                    searchKeys={[(i) => i.product_name, (i) => i.product_sku]}
                    searchPlaceholder="Search by product or SKU…"
                    exportFilename="inventory"
                    pageSize={12}
                    toolbar={storeSelector}
                    emptyTitle="No inventory records"
                    emptyMessage="Adjust stock to create inventory records for this store."
                />
            )}

            {/* Adjust Stock Modal */}
            <Modal
                open={showAdjustModal}
                onClose={() => setShowAdjustModal(false)}
                title="Adjust Stock"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" form="adjust-form">Adjust</Button>
                    </>
                }
            >
                <form id="adjust-form" onSubmit={handleAdjust}>
                    <FormField label="Product" required>
                        <Select
                            value={adjustForm.product_id}
                            onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                            required
                        >
                            <option value="">Select product…</option>
                            {inventory.map((item) => (
                                <option key={item.product_id} value={item.product_id}>
                                    {item.product_name} (Qty: {item.quantity})
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Quantity (+/−)" required>
                        <Input
                            type="number"
                            value={adjustForm.quantity}
                            onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                            required
                        />
                    </FormField>
                    <FormField label="Reason" required>
                        <Input
                            value={adjustForm.reason}
                            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                            required
                        />
                    </FormField>
                    <FormField label="Notes" className="mb-0">
                        <Input
                            value={adjustForm.notes}
                            onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                        />
                    </FormField>
                </form>
            </Modal>

            {/* Transfer Modal */}
            <Modal
                open={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                title="Transfer Stock"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowTransferModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" form="transfer-form">Transfer</Button>
                    </>
                }
            >
                <form id="transfer-form" onSubmit={handleTransfer}>
                    <FormField label="Product" required>
                        <Select
                            value={transferForm.product_id}
                            onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                            required
                        >
                            <option value="">Select product…</option>
                            {inventory.map((item) => (
                                <option key={item.product_id} value={item.product_id}>{item.product_name}</option>
                            ))}
                        </Select>
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="From Store" required>
                            <Select
                                value={transferForm.from_store_id}
                                onChange={(e) => setTransferForm({ ...transferForm, from_store_id: e.target.value })}
                                required
                            >
                                <option value="">Select…</option>
                                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="To Store" required>
                            <Select
                                value={transferForm.to_store_id}
                                onChange={(e) => setTransferForm({ ...transferForm, to_store_id: e.target.value })}
                                required
                            >
                                <option value="">Select…</option>
                                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </FormField>
                    </div>
                    <FormField label="Quantity" required className="mb-0">
                        <Input
                            type="number"
                            min="1"
                            value={transferForm.quantity}
                            onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                            required
                        />
                    </FormField>
                </form>
            </Modal>

            {/* Movement History Modal */}
            <Modal
                open={showMovements}
                onClose={() => setShowMovements(false)}
                title="Stock Movement History"
                size="lg"
            >
                {movements.length === 0 ? (
                    <EmptyState icon={History} title="No movements" message="No stock movements recorded yet." />
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-outline-variant">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">Reference</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((m) => (
                                    <tr key={m.id} className="border-t border-outline-variant">
                                        <td className="px-4 py-3 text-sm">
                                            <Badge tone={m.quantity > 0 ? 'success' : 'danger'}>{m.movement_type}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-on-surface">
                                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">{m.reference || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-on-surface-variant">
                                            {new Date(m.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>
        </div>
    );
}
