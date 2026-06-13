import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi, supplierApi, storeApi, productApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, PackageCheck, Send, Ban, Receipt } from 'lucide-react';
import { PageHeader, Button, Badge, FormField, Input, Textarea, Select, Card } from '../../components/ui';
import { Modal, ConfirmDialog, Drawer } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';

const gbp = (n: any) => `£${Number(n || 0).toFixed(2)}`;
const STATUS_TONE: Record<string, any> = { draft: 'neutral', sent: 'info', partially_received: 'warning', received: 'success', cancelled: 'danger' };
const STATUS_LABEL: Record<string, string> = { draft: 'Draft', sent: 'Sent', partially_received: 'Partial', received: 'Received', cancelled: 'Cancelled' };

interface PO {
    id: string; po_number: string; supplier_id: string; supplier_name?: string; store_id: string;
    status: string; total: string; amount_paid: string; order_date: string; expected_date?: string;
    items?: any[]; notes?: string;
}

export default function PurchaseOrdersPage() {
    const [showEditor, setShowEditor] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['purchase-orders', statusFilter],
        queryFn: async () => (await purchaseOrderApi.list(statusFilter ? { status: statusFilter } : undefined)).data as PO[],
    });

    const columns: Column<PO>[] = [
        { key: 'po_number', header: 'PO #', sortable: true, accessor: (o) => o.po_number, render: (o) => <span className="font-mono font-semibold text-on-surface">{o.po_number}</span> },
        { key: 'supplier', header: 'Supplier', sortable: true, accessor: (o) => o.supplier_name || '' },
        { key: 'status', header: 'Status', align: 'center', accessor: (o) => o.status, render: (o) => <Badge tone={STATUS_TONE[o.status] || 'neutral'} dot>{STATUS_LABEL[o.status] || o.status}</Badge> },
        { key: 'total', header: 'Total', align: 'right', sortable: true, accessor: (o) => Number(o.total), render: (o) => gbp(o.total) },
        { key: 'paid', header: 'Paid', align: 'right', accessor: (o) => Number(o.amount_paid), render: (o) => <span className={Number(o.amount_paid) >= Number(o.total) && Number(o.total) > 0 ? 'text-success' : ''}>{gbp(o.amount_paid)}</span> },
        { key: 'date', header: 'Ordered', align: 'right', sortable: true, accessor: (o) => o.order_date, render: (o) => new Date(o.order_date).toLocaleDateString() },
    ];

    return (
        <div>
            <PageHeader title="Purchase Orders" subtitle="Raise orders to suppliers and receive stock into inventory." actions={<Button icon={Plus} onClick={() => setShowEditor(true)}>New PO</Button>} />
            <DataTable
                data={orders}
                columns={columns}
                rowKey={(o) => o.id}
                loading={isLoading}
                searchKeys={[(o) => o.po_number, (o) => o.supplier_name]}
                searchPlaceholder="Search PO # or supplier…"
                exportFilename="purchase-orders"
                onRowClick={(o) => setDetailId(o.id)}
                emptyTitle="No purchase orders"
                emptyMessage="Create your first PO to order stock from a supplier."
                toolbar={
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="partially_received">Partial</option>
                        <option value="received">Received</option>
                        <option value="cancelled">Cancelled</option>
                    </Select>
                }
            />
            {showEditor && <POEditor onClose={() => setShowEditor(false)} />}
            <PODetail poId={detailId} onClose={() => setDetailId(null)} />
        </div>
    );
}

/* ----------------------------- Create editor ----------------------------- */
interface Line { product_id: string; product_name: string; product_sku?: string; quantity_ordered: number; unit_cost: number }

function POEditor({ onClose }: { onClose: () => void }) {
    const qc = useQueryClient();
    const [supplierId, setSupplierId] = useState('');
    const [storeId, setStoreId] = useState('');
    const [expected, setExpected] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<Line[]>([]);

    const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: async () => (await supplierApi.list()).data });
    const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: async () => { const r = await storeApi.list(); return r.data.items ?? r.data ?? []; } });

    const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity_ordered * l.unit_cost, 0), [lines]);

    const addProduct = (p: any) => {
        if (lines.some((l) => l.product_id === p.id)) { toast('Already added'); return; }
        setLines((ls) => [...ls, { product_id: p.id, product_name: p.name, product_sku: p.sku, quantity_ordered: 1, unit_cost: Number(p.cost_price || 0) }]);
    };
    const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
    const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));

    const createMut = useMutation({
        mutationFn: () => purchaseOrderApi.create({
            supplier_id: supplierId, store_id: storeId, expected_date: expected || null, notes: notes || null,
            items: lines.map((l) => ({ product_id: l.product_id, quantity_ordered: Number(l.quantity_ordered), unit_cost: Number(l.unit_cost) })),
        }),
        onSuccess: () => { toast.success('Purchase order created'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); onClose(); },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to create')),
    });

    const canSubmit = supplierId && storeId && lines.length > 0 && lines.every((l) => l.quantity_ordered > 0);

    return (
        <Modal open onClose={onClose} title="New purchase order" size="xl"
            footer={<><span className="mr-auto text-sm text-on-surface-variant">Subtotal <b className="text-on-surface">{gbp(subtotal)}</b></span>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!canSubmit}>Create PO</Button></>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField label="Supplier" required><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Select…</option>{suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormField>
                <FormField label="Deliver to store" required><Select value={storeId} onChange={(e) => setStoreId(e.target.value)}><option value="">Select…</option>{stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormField>
                <FormField label="Expected date"><Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></FormField>
            </div>

            <FormField label="Add products"><ProductSearch onAdd={addProduct} /></FormField>

            {lines.length === 0 ? (
                <div className="text-sm text-on-surface-variant text-center py-6 border border-dashed border-outline-variant rounded-lg">Search and add products to this order.</div>
            ) : (
                <div className="border border-outline-variant rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                            <th className="text-left px-3 py-2">Product</th><th className="px-3 py-2 w-24">Qty</th><th className="px-3 py-2 w-28">Unit £</th><th className="text-right px-3 py-2 w-24">Total</th><th className="w-10"></th>
                        </tr></thead>
                        <tbody>
                            {lines.map((l, i) => (
                                <tr key={l.product_id} className="border-t border-outline-variant">
                                    <td className="px-3 py-2"><div className="font-medium text-on-surface">{l.product_name}</div>{l.product_sku && <div className="text-xs text-on-surface-variant">{l.product_sku}</div>}</td>
                                    <td className="px-3 py-2"><Input type="number" min={1} value={l.quantity_ordered} onChange={(e) => setLine(i, { quantity_ordered: Number(e.target.value) })} className="h-8" /></td>
                                    <td className="px-3 py-2"><Input type="number" min={0} step="0.01" value={l.unit_cost} onChange={(e) => setLine(i, { unit_cost: Number(e.target.value) })} className="h-8" /></td>
                                    <td className="px-3 py-2 text-right font-semibold text-on-surface">{gbp(l.quantity_ordered * l.unit_cost)}</td>
                                    <td className="px-3 py-2"><button onClick={() => removeLine(i)} className="text-error hover:opacity-80"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <FormField label="Notes" className="mt-3"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
        </Modal>
    );
}

function ProductSearch({ onAdd }: { onAdd: (p: any) => void }) {
    const [q, setQ] = useState('');
    const { data: results = [] } = useQuery({
        queryKey: ['po-product-search', q],
        queryFn: async () => { const r = await productApi.list({ search: q, limit: 8 }); return (r.data.items ?? r.data ?? []) as any[]; },
        enabled: q.trim().length >= 2,
    });
    return (
        <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type at least 2 characters…" className="pl-9" />
            {q.trim().length >= 2 && results.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-md shadow-2xl">
                    {results.map((p) => (
                        <button key={p.id} type="button" onClick={() => { onAdd(p); setQ(''); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-surface-container">
                            <span><span className="text-on-surface">{p.name}</span> <span className="text-xs text-on-surface-variant">{p.sku}</span></span>
                            <span className="text-xs text-on-surface-variant">cost {gbp(p.cost_price)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ----------------------------- Detail drawer ----------------------------- */
function PODetail({ poId, onClose }: { poId: string | null; onClose: () => void }) {
    const qc = useQueryClient();
    const open = !!poId;
    const [receipts, setReceipts] = useState<Record<string, number>>({});
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [payAmount, setPayAmount] = useState('');

    const { data: po } = useQuery<PO>({ queryKey: ['purchase-order', poId], queryFn: async () => (await purchaseOrderApi.get(poId!)).data, enabled: open });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['purchase-order', poId] });
        qc.invalidateQueries({ queryKey: ['purchase-orders'] });
        qc.invalidateQueries({ queryKey: ['suppliers'] });
    };
    const statusMut = useMutation({ mutationFn: (status: string) => purchaseOrderApi.update(poId!, { status }), onSuccess: () => { toast.success('Updated'); invalidate(); }, onError: (e) => toast.error(getErrorMessage(e)) });
    const cancelMut = useMutation({ mutationFn: () => purchaseOrderApi.cancel(poId!), onSuccess: () => { toast.success('Cancelled'); setConfirmCancel(false); invalidate(); }, onError: (e) => toast.error(getErrorMessage(e)) });
    const receiveMut = useMutation({
        mutationFn: () => purchaseOrderApi.receive(poId!, Object.entries(receipts).filter(([, q]) => q > 0).map(([item_id, quantity]) => ({ item_id, quantity: Number(quantity) }))),
        onSuccess: () => { toast.success('Stock received'); setReceipts({}); invalidate(); qc.invalidateQueries({ queryKey: ['inventory'] }); },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
    const payMut = useMutation({
        mutationFn: () => supplierApi.addPayment(po!.supplier_id, { amount: Number(payAmount), purchase_order_id: poId, method: 'bank_transfer' }),
        onSuccess: () => { toast.success('Payment recorded'); setPayAmount(''); invalidate(); },
        onError: (e) => toast.error(getErrorMessage(e)),
    });

    const remaining = (it: any) => it.quantity_ordered - it.quantity_received;
    const hasReceivable = po?.items?.some((it) => remaining(it) > 0) && !['cancelled', 'received'].includes(po?.status || '');

    return (
        <Drawer open={open} onClose={onClose} title={po ? po.po_number : 'Purchase order'} width={520}>
            {po && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <Badge tone={STATUS_TONE[po.status] || 'neutral'} dot>{STATUS_LABEL[po.status] || po.status}</Badge>
                        <div className="text-sm text-on-surface-variant">{po.supplier_name}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-md bg-surface-container-low py-2"><div className="text-[11px] uppercase text-on-surface-variant">Total</div><div className="font-headline font-bold text-on-surface">{gbp(po.total)}</div></div>
                        <div className="rounded-md bg-surface-container-low py-2"><div className="text-[11px] uppercase text-on-surface-variant">Paid</div><div className="font-headline font-bold text-on-surface">{gbp(po.amount_paid)}</div></div>
                        <div className="rounded-md bg-surface-container-low py-2"><div className="text-[11px] uppercase text-on-surface-variant">Owing</div><div className="font-headline font-bold text-error">{gbp(Number(po.total) - Number(po.amount_paid))}</div></div>
                    </div>

                    {/* Status actions */}
                    <div className="flex flex-wrap gap-2">
                        {po.status === 'draft' && <Button size="sm" icon={Send} onClick={() => statusMut.mutate('sent')} loading={statusMut.isPending}>Mark sent</Button>}
                        {!['cancelled', 'received'].includes(po.status) && <Button size="sm" variant="secondary" icon={Ban} onClick={() => setConfirmCancel(true)}>Cancel PO</Button>}
                    </div>

                    {/* Items + receive */}
                    <div>
                        <h4 className="font-headline font-bold text-on-surface mb-2">Items</h4>
                        <div className="border border-outline-variant rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                                    <th className="text-left px-3 py-2">Product</th><th className="px-2 py-2">Ord</th><th className="px-2 py-2">Rec</th>
                                    {hasReceivable && <th className="px-2 py-2 w-20">Receive</th>}
                                </tr></thead>
                                <tbody>
                                    {po.items?.map((it) => (
                                        <tr key={it.id} className="border-t border-outline-variant">
                                            <td className="px-3 py-2"><div className="text-on-surface">{it.product_name}</div><div className="text-xs text-on-surface-variant">{gbp(it.unit_cost)} ea</div></td>
                                            <td className="px-2 py-2 text-center">{it.quantity_ordered}</td>
                                            <td className="px-2 py-2 text-center">{it.quantity_received}</td>
                                            {hasReceivable && (
                                                <td className="px-2 py-2">
                                                    {remaining(it) > 0 ? (
                                                        <Input type="number" min={0} max={remaining(it)} value={receipts[it.id] ?? ''} placeholder={String(remaining(it))}
                                                            onChange={(e) => setReceipts((r) => ({ ...r, [it.id]: Math.min(Number(e.target.value), remaining(it)) }))} className="h-8" />
                                                    ) : <span className="text-xs text-success">✓ full</span>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {hasReceivable && (
                            <Button size="sm" icon={PackageCheck} className="mt-2 w-full"
                                onClick={() => receiveMut.mutate()} loading={receiveMut.isPending}
                                disabled={!Object.values(receipts).some((q) => q > 0)}>Receive selected into stock</Button>
                        )}
                    </div>

                    {/* Quick payment */}
                    {!['cancelled'].includes(po.status) && Number(po.amount_paid) < Number(po.total) && (
                        <div className="flex items-end gap-2">
                            <FormField label="Record payment (£)" className="flex-1 mb-0"><Input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></FormField>
                            <Button icon={Receipt} onClick={() => payMut.mutate()} loading={payMut.isPending} disabled={!payAmount}>Pay</Button>
                        </div>
                    )}

                    {po.notes && <div className="text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">Notes:</span> {po.notes}</div>}
                </div>
            )}

            <ConfirmDialog open={confirmCancel} onClose={() => setConfirmCancel(false)} onConfirm={() => cancelMut.mutate()}
                title="Cancel this PO?" message="The purchase order will be marked cancelled." confirmLabel="Cancel PO" loading={cancelMut.isPending} />
        </Drawer>
    );
}
