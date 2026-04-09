import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAdminStore } from '../auth/AdminStoreContext';
import { orderApi as salesApi, storeApi, getErrorMessage } from '../../services/api';
import { Search, Receipt, Printer, XCircle, Share2, Filter, Info, History } from 'lucide-react';
import toast from 'react-hot-toast';
import EntityHistoryPanel from '../../components/audit/EntityHistoryPanel';

type TabStatus = 'all' | 'completed' | 'voided' | 'refunded';
type DateFilter = 'today' | 'week' | 'month' | 'custom';

const fmt = (n: number) => `£${Number(n || 0).toFixed(2)}`;

export default function SalesHistoryPage() {
    const { user, isManager, isCashier } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const { selectedStore: adminSelectedStore } = useAdminStore();
    const defaultStoreId = isAdmin ? (adminSelectedStore?.id || '') : (user?.store_id || '');

    // Filters State
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState(defaultStoreId);
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [statusFilter, setStatusFilter] = useState<TabStatus>('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [saleTypeFilter, setSaleTypeFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Data State
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const [historyEntityId, setHistoryEntityId] = useState<string | null>(null);
    const [historyEntityName, setHistoryEntityName] = useState<string>('');

    useEffect(() => {
        if (!isManager && !isCashier) {
            loadStores();
        } else {
            // Managers and Cashiers are locked to their store
            setSelectedStore(user?.store_id || '');
        }
    }, [isManager, isCashier, user?.store_id]);

    useEffect(() => {
        if (isAdmin && adminSelectedStore) {
            setSelectedStore(adminSelectedStore.id);
        }
    }, [isAdmin, adminSelectedStore]);

    useEffect(() => {
        // If we are admin, wait for store dropdown. If manager/cashier, wait for user.store_id
        // Since admin can view ALL stores, '' is also valid for them.
        const canLoad = (!isManager && !isCashier) || selectedStore !== '';
        if (canLoad) {
            loadSales();
        }
    }, [selectedStore, dateFilter, statusFilter, paymentFilter, saleTypeFilter]);

    const loadStores = async () => {
        try {
            const res = await storeApi.list();
            setStores(res.data || []);
            // All stores option is blank string
        } catch (err) { console.error(err); }
    };

    const loadSales = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };

            // Apply scoped filters
            if (selectedStore) params.store_id = selectedStore;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (paymentFilter !== 'all') params.payment_method = paymentFilter;
            if (saleTypeFilter !== 'all') params.sale_type = saleTypeFilter;
            if (search) params.search = search;

            // Apply Dates
            const today = new Date();
            if (dateFilter === 'today') {
                params.date_from = today.toISOString().split('T')[0] + 'T00:00:00';
                params.date_to = today.toISOString().split('T')[0] + 'T23:59:59';
            } else if (dateFilter === 'week') {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                params.date_from = weekStart.toISOString().split('T')[0] + 'T00:00:00';
            } else if (dateFilter === 'month') {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                params.date_from = monthStart.toISOString().split('T')[0] + 'T00:00:00';
            }

            // Note: Cashier scoping is handled securely in the backend, we don't need to pass cashier_id explicitly unless doing manager-level filtering

            const res = await salesApi.list(params);
            setSales(res.data?.items || []);
        } catch (err: any) {
            toast.error(getErrorMessage(err, 'Failed to load sales'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadSales();
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            'completed': 'var(--success)',
            'voided': 'var(--danger)',
            'refunded': 'var(--warning)',
        };
        const bg = colors[status] || 'var(--text-muted)';
        return <span className="badge" style={{ background: bg, color: '#fff' }}>{status}</span>;
    };

    const SaleTypeBadge = ({ type }: { type: string }) => {
        return (
            <span className="badge" style={{
                background: type === 'preorder' ? 'var(--primary-light)' : 'var(--success)',
                color: '#fff'
            }}>
                {type === 'preorder' ? 'Pre-Order' : 'Sale'}
            </span>
        );
    };

    return (
        <div>
            {/* Filters Row 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Admin Store Filter */}
                    {(!isManager && !isCashier) && (
                        <select className="form-select" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} style={{ minWidth: 200 }}>
                            <option value="">All Stores</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}

                    <select className="form-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                        <div className="pos-search" style={{ margin: 0, width: 250 }}>
                            <input
                                className="form-input"
                                placeholder="Search Invoice or Phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary"><Search size={16} /></button>
                    </form>
                </div>
            </div>

            {/* Filters Row 2 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TabStatus)} style={{ width: 'auto' }}>
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="voided">Voided</option>
                </select>
                <select className="form-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All Payments</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                </select>
                <select className="form-select" value={saleTypeFilter} onChange={(e) => setSaleTypeFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All Sale Types</option>
                    <option value="regular">Regular Sales</option>
                    <option value="preorder">Pre-Order Conversions</option>
                </select>
            </div>

            {/* Main Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Date & Time</th>
                                {!isManager && !isCashier && <th>Store</th>}
                                <th>Type</th>
                                <th>Cashier</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No sales found for the selected filters.</td></tr>
                            ) : sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                                        {sale.invoice_number}
                                        {sale.preorder_number && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sale.preorder_number}</div>}
                                    </td>
                                    <td style={{ fontSize: '0.9rem' }}>
                                        {new Date(sale.created_at).toLocaleDateString()}<br />
                                        <span style={{ color: 'var(--text-muted)' }}>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    {(!isManager && !isCashier) && <td>{stores.find(s => s.id === sale.store_id)?.name || 'Unknown'}</td>}
                                    <td><SaleTypeBadge type={sale.sale_type} /></td>
                                    <td style={{ fontSize: '0.9rem' }}>{sale.cashier_name || 'System'}</td>
                                    <td style={{ fontSize: '0.9rem' }}>
                                        {sale.customer_name || 'Walk-in'}
                                        {sale.customer_phone && <div style={{ color: 'var(--text-muted)' }}>{sale.customer_phone}</div>}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={sale.items?.map((i: any) => `${i.quantity}x ${i.product_name}`).join('\n')}>
                                            {sale.items?.length || 0} items <Info size={12} color="var(--text-muted)" />
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>
                                        {fmt(sale.total)}
                                        {sale.sale_type === 'preorder' && sale.deposit_paid > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Balance: {fmt(sale.balance_collected)}</div>}
                                    </td>
                                    <td><StatusBadge status={sale.status} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedSale(sale); setShowReceiptModal(true); }}>
                                                <Receipt size={14} /> View
                                            </button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => { setHistoryEntityId(sale.id); setHistoryEntityName('Sale ' + sale.invoice_number); }} title="History">
                                                <History size={14} /> History
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && selectedSale && (
                <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header d-print-none">
                            <h3 className="modal-title">Receipt</h3>
                            <button className="btn-icon" onClick={() => setShowReceiptModal(false)}><XCircle size={18} /></button>
                        </div>

                        <div id="receipt-print-area" className="receipt-print" style={{ padding: '20px 0', fontFamily: 'monospace' }}>
                            {/* Receipt Header */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <h2 style={{ margin: '0 0 5px 0' }}>RetailPOS</h2>
                                <h4 style={{ margin: 0, fontWeight: 'normal', fontSize: '1.2rem', color: 'var(--text-primary)' }}>TAX INVOICE</h4>
                                {selectedSale.sale_type === 'preorder' && <div style={{ marginTop: 5, fontSize: '0.85rem' }}>Converted Pre-Order</div>}
                            </div>

                            {/* Receipt Meta */}
                            <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 15, marginBottom: 15, fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>Invoice:</span> <b>{selectedSale.invoice_number}</b>
                                </div>
                                {selectedSale.preorder_number && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span>Reference:</span> <b>{selectedSale.preorder_number}</b>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>Date:</span> <span>{new Date(selectedSale.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>Cashier:</span> <span>{selectedSale.cashier_name || 'System'}</span>
                                </div>
                                {selectedSale.customer_name && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                        <span>Customer:</span> <span>{selectedSale.customer_name} {selectedSale.customer_phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 15, marginBottom: 15 }}>
                                <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: 10, fontSize: '0.85rem' }}>
                                    <div style={{ flex: 1 }}>Item</div>
                                    <div style={{ width: 40, textAlign: 'center' }}>Qty</div>
                                    <div style={{ width: 80, textAlign: 'right' }}>Total</div>
                                </div>
                                {selectedSale.items?.map((item: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', marginBottom: 8, fontSize: '0.9rem', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            {item.product_name}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@ {fmt(item.unit_price)}</div>
                                        </div>
                                        <div style={{ width: 40, textAlign: 'center' }}>{item.quantity}</div>
                                        <div style={{ width: 80, textAlign: 'right' }}>{fmt(item.total)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 15, marginBottom: 15 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span>Subtotal:</span>
                                    <span>{fmt(selectedSale.subtotal)}</span>
                                </div>
                                {selectedSale.tax_amount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span>Tax:</span>
                                        <span>{fmt(selectedSale.tax_amount)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginTop: 10 }}>
                                    <span>TOTAL:</span>
                                    <span>{fmt(selectedSale.total)}</span>
                                </div>

                                {selectedSale.sale_type === 'preorder' && selectedSale.deposit_paid > 0 && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, color: 'var(--success)' }}>
                                            <span>Deposit Paid:</span>
                                            <span>-{fmt(selectedSale.deposit_paid)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: 5 }}>
                                            <span>Balance Collected:</span>
                                            <span>{fmt(selectedSale.total - selectedSale.deposit_paid)}</span>
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                    <span>Method:</span>
                                    <span style={{ textTransform: 'uppercase' }}>{selectedSale.payment_method}</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                                <p style={{ margin: '0 0 5px 0' }}>Thank you for your purchase!</p>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Please keep this receipt for your records.</p>
                            </div>
                        </div>

                        <div className="d-print-none" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
                                <Printer size={16} style={{ marginRight: 6 }} /> Print
                            </button>
                            <a
                                href={`https://wa.me/?text=Invoice:%20${selectedSale.invoice_number}%0ATotal:%20${fmt(selectedSale.total)}%0AThank%20you!`}
                                target="_blank"
                                className="btn btn-success"
                                style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                            >
                                <Share2 size={16} style={{ marginRight: 6 }} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <EntityHistoryPanel
                isOpen={!!historyEntityId}
                onClose={() => setHistoryEntityId(null)}
                entityType="Sale"
                entityId={historyEntityId || ''}
                entityName={historyEntityName}
            />
        </div>
    );
}
