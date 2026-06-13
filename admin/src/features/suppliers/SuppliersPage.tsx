import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Factory, Receipt } from 'lucide-react';
import { PageHeader, Button, Badge, StatCard, FormField, Input, Textarea, Select } from '../../components/ui';
import { Modal, ConfirmDialog, Drawer } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface Supplier {
    id: string; name: string; contact_name?: string; email?: string; phone?: string; address?: string;
    payment_terms?: string; lead_time_days?: number; notes?: string; is_active: boolean; outstanding: string;
}
const gbp = (n: any) => `£${Number(n || 0).toFixed(2)}`;
const EMPTY = { name: '', contact_name: '', email: '', phone: '', address: '', payment_terms: '', lead_time_days: '', notes: '', is_active: true };

export default function SuppliersPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [form, setForm] = useState<any>(EMPTY);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [detailId, setDetailId] = useState<string | null>(null);

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => (await supplierApi.list()).data as Supplier[],
    });

    const saveMut = useMutation({
        mutationFn: (payload: any) => editing ? supplierApi.update(editing.id, payload) : supplierApi.create(payload),
        onSuccess: () => { toast.success(editing ? 'Supplier updated' : 'Supplier created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['suppliers'] }); },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });
    const deleteMut = useMutation({
        mutationFn: (id: string) => supplierApi.delete(id),
        onSuccess: () => { toast.success('Supplier deleted'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['suppliers'] }); },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed')),
    });

    const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
    const openEdit = (s: Supplier) => {
        setEditing(s);
        setForm({ ...EMPTY, ...s, lead_time_days: s.lead_time_days ?? '' });
        setShowForm(true);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...form, lead_time_days: form.lead_time_days === '' ? null : Number(form.lead_time_days) };
        Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
        saveMut.mutate(payload);
    };

    const columns: Column<Supplier>[] = [
        { key: 'name', header: 'Supplier', sortable: true, accessor: (s) => s.name, render: (s) => (
            <div><div className="font-semibold text-on-surface">{s.name}</div>{s.payment_terms && <div className="text-xs text-on-surface-variant">{s.payment_terms}</div>}</div>
        ) },
        { key: 'contact', header: 'Contact', accessor: (s) => s.contact_name || s.email || '', render: (s) => (
            <div className="text-sm"><div>{s.contact_name || '—'}</div><div className="text-xs text-on-surface-variant">{s.email || s.phone || ''}</div></div>
        ) },
        { key: 'lead', header: 'Lead time', align: 'center', accessor: (s) => s.lead_time_days ?? 0, render: (s) => s.lead_time_days != null ? `${s.lead_time_days}d` : '—' },
        { key: 'outstanding', header: 'Outstanding', align: 'right', sortable: true, accessor: (s) => Number(s.outstanding), render: (s) => (
            <Badge tone={Number(s.outstanding) > 0 ? 'warning' : 'success'}>{gbp(s.outstanding)}</Badge>
        ) },
        { key: 'status', header: 'Status', align: 'center', accessor: (s) => (s.is_active ? 'Active' : 'Inactive'), render: (s) => <Badge tone={s.is_active ? 'success' : 'neutral'} dot>{s.is_active ? 'Active' : 'Inactive'}</Badge> },
        { key: 'actions', header: '', align: 'right', render: (s) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(s)} />
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(s.id)} className="text-error hover:bg-error/10" />
            </div>
        ) },
    ];

    return (
        <div>
            <PageHeader title="Suppliers" subtitle="Manage your supply partners and what you owe them." actions={<Button icon={Plus} onClick={openCreate}>Add supplier</Button>} />
            <DataTable
                data={suppliers}
                columns={columns}
                rowKey={(s) => s.id}
                loading={isLoading}
                searchKeys={[(s) => s.name, (s) => s.contact_name, (s) => s.email]}
                searchPlaceholder="Search suppliers…"
                exportFilename="suppliers"
                onRowClick={(s) => setDetailId(s.id)}
                emptyTitle="No suppliers yet"
                emptyMessage="Add your first supplier to start raising purchase orders."
            />

            {/* Create / edit */}
            <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit supplier' : 'New supplier'}
                footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={submit} loading={saveMut.isPending}>{editing ? 'Update' : 'Create'}</Button></>}>
                <form onSubmit={submit}>
                    <FormField label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Contact name"><Input value={form.contact_name ?? ''} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></FormField>
                        <FormField label="Email"><Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Phone"><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
                        <FormField label="Payment terms"><Input value={form.payment_terms ?? ''} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" /></FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Lead time (days)"><Input type="number" min={0} value={form.lead_time_days ?? ''} onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })} /></FormField>
                        <FormField label="Active"><Select value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}><option value="1">Active</option><option value="0">Inactive</option></Select></FormField>
                    </div>
                    <FormField label="Address"><Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
                    <FormField label="Notes"><Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
                </form>
            </Modal>

            <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
                title="Delete supplier?" message="The supplier will be removed. Purchase orders are kept." confirmLabel="Delete" loading={deleteMut.isPending} />

            <SupplierDetail supplierId={detailId} onClose={() => setDetailId(null)} />
        </div>
    );
}

function SupplierDetail({ supplierId, onClose }: { supplierId: string | null; onClose: () => void }) {
    const qc = useQueryClient();
    const [showPay, setShowPay] = useState(false);
    const [pay, setPay] = useState<any>({ amount: '', method: 'bank_transfer', reference: '', notes: '' });
    const open = !!supplierId;

    const { data: supplier } = useQuery({ queryKey: ['supplier', supplierId], queryFn: async () => (await supplierApi.get(supplierId!)).data, enabled: open });
    const { data: summary } = useQuery({ queryKey: ['supplier-summary', supplierId], queryFn: async () => (await supplierApi.summary(supplierId!)).data, enabled: open });
    const { data: payments = [] } = useQuery({ queryKey: ['supplier-payments', supplierId], queryFn: async () => (await supplierApi.payments(supplierId!)).data, enabled: open });

    const payMut = useMutation({
        mutationFn: () => supplierApi.addPayment(supplierId!, { amount: Number(pay.amount), method: pay.method || null, reference: pay.reference || null, notes: pay.notes || null }),
        onSuccess: () => {
            toast.success('Payment recorded'); setShowPay(false); setPay({ amount: '', method: 'bank_transfer', reference: '', notes: '' });
            qc.invalidateQueries({ queryKey: ['supplier-summary', supplierId] });
            qc.invalidateQueries({ queryKey: ['supplier-payments', supplierId] });
            qc.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed')),
    });

    return (
        <Drawer open={open} onClose={onClose} title={supplier?.name ?? 'Supplier'} width={480}
            footer={<Button icon={Receipt} onClick={() => setShowPay(true)} className="w-full">Record payment</Button>}>
            {supplier && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={Factory} label="Purchase orders" value={summary?.total_orders ?? '—'} tone="blue" />
                        <StatCard label="Outstanding" value={gbp(summary?.outstanding)} tone={Number(summary?.outstanding) > 0 ? 'red' : 'green'} />
                        <StatCard label="Total billed" value={gbp(summary?.total_billed)} tone="primary" />
                        <StatCard label="Total paid" value={gbp(summary?.total_paid)} tone="green" />
                    </div>

                    <div className="text-sm text-on-surface-variant space-y-1">
                        {supplier.contact_name && <div>Contact: <span className="text-on-surface">{supplier.contact_name}</span></div>}
                        {supplier.email && <div>Email: <span className="text-on-surface">{supplier.email}</span></div>}
                        {supplier.phone && <div>Phone: <span className="text-on-surface">{supplier.phone}</span></div>}
                        {supplier.payment_terms && <div>Terms: <span className="text-on-surface">{supplier.payment_terms}</span></div>}
                    </div>

                    <div>
                        <h4 className="font-headline font-bold text-on-surface mb-2">Payments ({payments.length})</h4>
                        {payments.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">No payments recorded.</p>
                        ) : (
                            <div className="divide-y divide-outline-variant/60 border border-outline-variant rounded-lg">
                                {payments.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                        <div><div className="font-semibold text-on-surface">{gbp(p.amount)}</div><div className="text-xs text-on-surface-variant">{p.method || 'payment'} · {new Date(p.payment_date).toLocaleDateString()}</div></div>
                                        {p.reference && <span className="text-xs text-on-surface-variant">{p.reference}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal open={showPay} onClose={() => setShowPay(false)} title="Record payment" size="sm"
                footer={<><Button variant="secondary" onClick={() => setShowPay(false)}>Cancel</Button><Button onClick={() => payMut.mutate()} loading={payMut.isPending} disabled={!pay.amount}>Save</Button></>}>
                <FormField label="Amount (£)" required><Input type="number" min="0" step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></FormField>
                <FormField label="Method"><Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="cheque">Cheque</option></Select></FormField>
                <FormField label="Reference"><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></FormField>
                <FormField label="Notes"><Textarea value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} /></FormField>
            </Modal>
        </Drawer>
    );
}
