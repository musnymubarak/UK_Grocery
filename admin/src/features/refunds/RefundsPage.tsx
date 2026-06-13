import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, FileText, ShoppingBag, CreditCard, User } from 'lucide-react';
import { PageHeader, Button, Badge, Select, Textarea } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { usePermissions } from '../../features/auth/PermissionContext';

const gbp = (n: any) => `£${Number(n || 0).toFixed(2)}`;

const STATUS_TONE: Record<string, any> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    partially_approved: 'info',
    processed: 'success',
};
const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    partially_approved: 'Partial',
    processed: 'Processed',
};
const statusTone = (s: string) => STATUS_TONE[s] || 'neutral';
const statusLabel = (s: string) => STATUS_LABEL[s] || s;

interface Refund {
    id: string;
    order_id: string;
    order_reference?: string;
    customer_name?: string;
    destination?: string;
    total_amount: string | number;
    status: string;
    created_at: string;
    items?: any[];
}

export default function RefundsPage() {
    const { can } = usePermissions();
    const queryClient = useQueryClient();
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [processingItem, setProcessingItem] = useState<{ refundId: string; itemId: string } | null>(null);
    const [action, setAction] = useState<'approved' | 'rejected'>('approved');
    const [notes, setNotes] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

    const { data: refunds = [], isLoading } = useQuery({
        queryKey: ['refunds', statusFilter],
        queryFn: async () => {
            const params = statusFilter === 'all' ? {} : { status: statusFilter === 'resolved' ? 'processed' : statusFilter };
            const res = await refundApi.list(params);
            let data = res.data;
            if (statusFilter === 'resolved') {
                data = data.filter((r: any) => r.status !== 'pending');
            }
            return data as Refund[];
        },
    });

    const processItem = useMutation({
        mutationFn: ({ refundId, itemId, status, notes }: { refundId: string; itemId: string; status: string; notes: string }) =>
            refundApi.processItem(refundId, itemId, { status, admin_notes: notes }),
        onSuccess: (res) => {
            toast.success(`Item ${action} successfully`);
            setProcessingItem(null);
            setNotes('');
            queryClient.invalidateQueries({ queryKey: ['refunds'] });

            // Update local state for the selected refund to show immediate feedback
            if (selectedRefund) {
                const updatedItems = (selectedRefund.items || []).map((it: any) =>
                    it.id === res.data.id ? res.data : it,
                );
                setSelectedRefund({ ...selectedRefund, items: updatedItems });
            }
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const refundRef = (r: Refund) => r.order_reference || 'REF-' + r.order_id.slice(0, 8);

    const columns: Column<Refund>[] = [
        {
            key: 'ref',
            header: 'Order Ref',
            sortable: true,
            accessor: (r) => refundRef(r),
            render: (r) => <span className="font-mono font-semibold text-on-surface">{refundRef(r)}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            sortable: true,
            accessor: (r) => r.customer_name || 'Customer',
            render: (r) => (
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-surface-container text-on-surface-variant">
                        <User size={14} />
                    </span>
                    <span>{r.customer_name || 'Customer'}</span>
                </div>
            ),
        },
        {
            key: 'destination',
            header: 'Destination',
            align: 'center',
            accessor: (r) => (r.destination === 'wallet' ? 'Wallet' : 'Original'),
            render: (r) => (
                <Badge tone={r.destination === 'wallet' ? 'primary' : 'neutral'}>
                    {r.destination === 'wallet' ? (
                        <>
                            <ShoppingBag size={12} /> Wallet
                        </>
                    ) : (
                        <>
                            <CreditCard size={12} /> Original
                        </>
                    )}
                </Badge>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            sortable: true,
            accessor: (r) => Number(r.total_amount),
            render: (r) => (
                <span className={Number(r.total_amount) > 0 ? 'font-semibold text-success' : 'font-semibold text-on-surface'}>
                    {gbp(r.total_amount)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            accessor: (r) => statusLabel(r.status),
            render: (r) => (
                <Badge tone={statusTone(r.status)} dot>
                    {statusLabel(r.status)}
                </Badge>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            align: 'right',
            sortable: true,
            accessor: (r) => r.created_at,
            render: (r) => new Date(r.created_at).toLocaleDateString(),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Refund Requests"
                subtitle="Review and process item-level refund claims."
            />
            <DataTable
                data={refunds}
                columns={columns}
                rowKey={(r) => r.id}
                loading={isLoading}
                searchKeys={[(r) => refundRef(r), (r) => r.customer_name]}
                searchPlaceholder="Search order ref or customer…"
                exportFilename={can('export_data') ? 'refunds' : undefined}
                onRowClick={(r) => setSelectedRefund(r)}
                emptyTitle="No refund requests"
                emptyMessage="There are no refund requests matching this filter."
                toolbar={
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-44"
                    >
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="all">All</option>
                    </Select>
                }
            />

            {/* Refund detail */}
            <RefundDetail
                refund={selectedRefund}
                onClose={() => setSelectedRefund(null)}
                onDecide={(itemId) => {
                    if (!selectedRefund) return;
                    setProcessingItem({ refundId: selectedRefund.id, itemId });
                    setAction('approved');
                    setNotes('');
                }}
            />

            {/* Item decision */}
            <Modal
                open={!!processingItem}
                onClose={() => { setProcessingItem(null); setNotes(''); }}
                title="Review item claim"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setProcessingItem(null); setNotes(''); }}>Cancel</Button>
                        <Button
                            variant={action === 'approved' ? 'success' : 'danger'}
                            loading={processItem.isPending}
                            onClick={() =>
                                processingItem &&
                                processItem.mutate({ refundId: processingItem.refundId, itemId: processingItem.itemId, status: action, notes })
                            }
                        >
                            Confirm {action === 'approved' ? 'approve' : 'reject'}
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        type="button"
                        onClick={() => setAction('approved')}
                        className={
                            'flex flex-col items-center gap-1.5 py-4 rounded-lg border-2 font-semibold transition-colors ' +
                            (action === 'approved'
                                ? 'border-success bg-success/10 text-success'
                                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container')
                        }
                    >
                        <CheckCircle size={22} /> Approve
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('rejected')}
                        className={
                            'flex flex-col items-center gap-1.5 py-4 rounded-lg border-2 font-semibold transition-colors ' +
                            (action === 'rejected'
                                ? 'border-error bg-error/10 text-error'
                                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container')
                        }
                    >
                        <XCircle size={22} /> Reject
                    </button>
                </div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Decision note</label>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this decision…"
                />
            </Modal>
        </div>
    );
}

/* ----------------------------- Detail modal ----------------------------- */
function RefundDetail({
    refund,
    onClose,
    onDecide,
}: {
    refund: Refund | null;
    onClose: () => void;
    onDecide: (itemId: string) => void;
}) {
    return (
        <Modal
            open={!!refund}
            onClose={onClose}
            title={refund ? `Refund claim: ${refund.order_reference || refund.id.slice(0, 8)}` : 'Refund claim'}
            size="xl"
        >
            {refund && (
                <div className="space-y-5">
                    <p className="text-sm text-on-surface-variant -mt-1">
                        Requested on {new Date(refund.created_at).toLocaleString()}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg bg-surface-container-low border border-outline-variant p-4">
                            <div className="text-[11px] uppercase font-bold text-on-surface-variant mb-1">Customer</div>
                            <div className="font-semibold text-on-surface">{refund.customer_name || 'System User'}</div>
                        </div>
                        <div className="rounded-lg bg-surface-container-low border border-outline-variant p-4">
                            <div className="text-[11px] uppercase font-bold text-on-surface-variant mb-1">Method</div>
                            <div className="flex items-center gap-2 font-semibold text-on-surface">
                                {refund.destination === 'wallet' ? <ShoppingBag size={18} /> : <CreditCard size={18} />}
                                {refund.destination === 'wallet' ? 'Wallet Credit' : 'Original Payment Method'}
                            </div>
                        </div>
                        <div className="rounded-lg bg-surface-container-low border border-outline-variant p-4">
                            <div className="text-[11px] uppercase font-bold text-on-surface-variant mb-1">Current Approved Total</div>
                            <div className="font-headline text-xl font-bold text-success">{gbp(refund.total_amount)}</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-headline font-bold text-on-surface mb-2">
                            Requested Items ({refund.items?.length || 0})
                        </h4>
                        <div className="border border-outline-variant rounded-lg overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                                        <th className="text-left px-3 py-2">Item</th>
                                        <th className="px-3 py-2">Qty</th>
                                        <th className="text-right px-3 py-2">Refund Amount</th>
                                        <th className="text-left px-3 py-2">Reason</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {refund.items?.map((item: any) => (
                                        <tr key={item.id} className="border-t border-outline-variant align-top">
                                            <td className="px-3 py-2">
                                                <div className="font-semibold text-on-surface">{item.product_name || 'Order Item'}</div>
                                                <div className="text-xs text-on-surface-variant">ID: {item.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-3 py-2 text-center text-on-surface">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-on-surface">{gbp(item.amount)}</td>
                                            <td className="px-3 py-2">
                                                <Badge tone="neutral">{String(item.reason || '').replace('_', ' ')}</Badge>
                                                {item.customer_notes && (
                                                    <div className="mt-1 text-xs italic text-on-surface-variant">"{item.customer_notes}"</div>
                                                )}
                                                {item.evidence?.length > 0 && (
                                                    <div className="mt-2 flex gap-1 flex-wrap">
                                                        {item.evidence.map((ev: any, idx: number) => (
                                                            <a key={idx} href={ev.file_url} target="_blank" rel="noopener noreferrer">
                                                                <img
                                                                    src={ev.file_url}
                                                                    alt="Evidence"
                                                                    className="h-10 w-10 object-cover rounded border border-outline-variant"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <Badge tone={statusTone(item.status)} dot>{statusLabel(item.status)}</Badge>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {item.status === 'pending' ? (
                                                    <Button size="sm" onClick={() => onDecide(item.id)}>Decide</Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        icon={FileText}
                                                        disabled={!item.admin_notes}
                                                        onClick={() => item.admin_notes && toast(`Notes: ${item.admin_notes}`)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
