import React, { useState } from 'react';
import { CreditCard, User, MapPin, Package, Clock, Phone, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import { CustomSelect } from '../../components/CustomSelect';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Badge, Button, Select } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';

const STATUS_TONE: Record<string, BadgeTone> = {
    placed: 'warning',
    confirmed: 'neutral',
    picking: 'info',
    ready_for_collection: 'info',
    ready: 'info',
    out_for_delivery: 'info',
    delivered: 'success',
    cancelled: 'danger',
    rejected: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    picking: 'Picking',
    ready_for_collection: 'Ready',
    ready: 'Ready',
    out_for_delivery: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
};

function statusLabel(status?: string) {
    if (!status) return '—';
    return STATUS_LABEL[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string) {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime())
        ? '—'
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdersPage() {
    const { selectedStore } = useAdminStore();
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejections, setRejections] = useState<Record<string, number>>({});
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders_list', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await orderApi.list({ store_id: selectedStore.id });
            return res.data;
        },
        enabled: !!selectedStore?.id,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, status),
        onSuccess: () => {
            toast.success('Order status updated');
            queryClient.invalidateQueries({ queryKey: ['orders_list'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate dashboard too
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    const rejectSubstitutions = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => orderApi.rejectSubstitutions(id, data),
        onSuccess: () => {
            toast.success('Substitutions rejected successfully');
            setIsRejectModalOpen(false);
            setRejections({});
            queryClient.invalidateQueries({ queryKey: ['orders_list'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Failed to reject substitutions');
        },
    });

    const tabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'placed', label: 'Pending' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'picking', label: 'Processing' },
        { id: 'ready_for_collection', label: 'Ready' },
        { id: 'out_for_delivery', label: 'Shipped' },
        { id: 'delivered', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    const statusOptions = [
        { value: 'placed', label: 'Placed' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'picking', label: 'Picking' },
        { value: 'ready_for_collection', label: 'Ready' },
        { value: 'out_for_delivery', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const filteredOrders = (orders as any[]).filter(
        (o) => statusFilter === 'all' || o.status === statusFilter,
    );

    const columns: Column<any>[] = [
        {
            key: 'order_number',
            header: 'Order Ref',
            sortable: true,
            accessor: (o) => o.order_number ?? '',
            render: (o) => <span className="font-bold text-on-surface">{o.order_number}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            sortable: true,
            accessor: (o) => o.customer?.full_name ?? 'Guest',
            render: (o) => (
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {o.customer?.full_name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-on-surface truncate">{o.customer?.full_name || 'Guest'}</div>
                        <div className="text-xs text-on-surface-variant truncate">{o.customer?.email || 'N/A'}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            align: 'left',
            accessor: (o) => statusLabel(o.status),
            render: (o) => (
                <div className="flex flex-col items-start gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Badge tone={STATUS_TONE[o.status] ?? 'neutral'}>{statusLabel(o.status)}</Badge>
                    <CustomSelect
                        options={statusOptions}
                        value={o.status}
                        onChange={(val) => updateStatus.mutate({ id: o.id, status: val })}
                        style={{ width: '140px' }}
                    />
                </div>
            ),
        },
        {
            key: 'payment',
            header: 'Payment',
            accessor: (o) => `${o.payment_method ?? 'cod'} ${o.payment_status ?? 'pending'}`,
            render: (o) => {
                const isPaid = o.payment_status === 'paid';
                return (
                    <div className="flex flex-col items-start gap-1">
                        <Badge tone={isPaid ? 'success' : 'warning'}>{isPaid ? 'Paid' : 'Pending'}</Badge>
                        <span className="text-xs font-semibold uppercase text-on-surface-variant">
                            {o.payment_method?.toUpperCase() || 'COD'}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'total',
            header: 'Total',
            sortable: true,
            align: 'right',
            accessor: (o) => Number(o.total) || 0,
            render: (o) => <span className="font-bold text-on-surface">£{Number(o.total).toFixed(2)}</span>,
        },
        {
            key: 'order_type',
            header: 'Type',
            sortable: true,
            accessor: (o) => o.order_type ?? 'delivery',
            render: (o) => (
                <Badge tone={o.order_type === 'collection' ? 'info' : 'neutral'}>
                    {o.order_type === 'collection' ? 'Collection' : 'Delivery'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Placed',
            sortable: true,
            align: 'right',
            accessor: (o) => o.created_at ?? '',
            render: (o) => <span className="text-sm text-on-surface-variant">{formatDate(o.created_at)}</span>,
        },
    ];

    if (!selectedStore) {
        return <div className="p-8 text-on-surface-variant">Please select a store to view orders.</div>;
    }

    return (
        <div>
            <PageHeader title="Orders" subtitle="Manage and fulfill customer orders." />

            <DataTable<any>
                data={filteredOrders}
                columns={columns}
                rowKey={(o) => o.id}
                loading={isLoading}
                onRowClick={(o) => {
                    setSelectedOrder(o);
                    setIsModalOpen(true);
                }}
                searchKeys={[(o) => o.order_number, (o) => o.customer?.full_name, (o) => o.customer_id]}
                searchPlaceholder="Search by ID or customer…"
                exportFilename="orders"
                pageSize={12}
                emptyTitle="No orders found"
                emptyMessage="No orders match your current filters."
                toolbar={
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-44"
                        aria-label="Filter by status"
                    >
                        {tabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                                {tab.label}
                            </option>
                        ))}
                    </Select>
                }
            />

            {/* Order Details Modal */}
            <Modal
                open={isModalOpen && !!selectedOrder}
                onClose={() => setIsModalOpen(false)}
                size="xl"
                title={
                    selectedOrder ? (
                        <div>
                            <span className="font-headline text-lg font-bold text-on-surface">
                                Order {selectedOrder.order_number}
                            </span>
                            <p className="mt-0.5 text-xs font-normal text-on-surface-variant">
                                Placed on {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : '—'}
                            </p>
                        </div>
                    ) : undefined
                }
                footer={
                    selectedOrder ? (
                        <div className="flex w-full items-center justify-between">
                            {selectedOrder.status === 'out_for_delivery' &&
                            selectedOrder.items?.some((i: any) => i.is_substituted) ? (
                                <Button variant="secondary" onClick={() => setIsRejectModalOpen(true)}>
                                    Reject Substitutions
                                </Button>
                            ) : (
                                <span />
                            )}
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Close Detail
                            </Button>
                        </div>
                    ) : undefined
                }
            >
                {selectedOrder && (
                    <>
                        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* Customer & Delivery */}
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-on-surface">
                                        <User size={18} className="text-primary" /> Customer Details
                                    </h4>
                                    <div className="rounded-lg bg-surface-container-low p-4">
                                        <div className="mb-2 text-lg font-bold text-on-surface">
                                            {selectedOrder.customer?.full_name || 'Guest'}
                                        </div>
                                        <div className="mb-1 flex items-center gap-2 text-sm text-on-surface-variant">
                                            <Mail size={14} /> {selectedOrder.customer?.email || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                            <Phone size={14} /> {selectedOrder.customer?.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-on-surface">
                                        <MapPin size={18} className="text-primary" /> Delivery Information
                                    </h4>
                                    <div className="rounded-lg bg-surface-container-low p-4">
                                        <div className="text-sm leading-relaxed text-on-surface">
                                            <strong>Address:</strong>{' '}
                                            {selectedOrder.delivery_address || 'Collection from Store'}
                                            {selectedOrder.delivery_postcode && <span>, {selectedOrder.delivery_postcode}</span>}
                                        </div>
                                        {selectedOrder.delivery_instructions && (
                                            <div className="mt-3 border-l-2 border-primary/40 bg-surface-container-lowest p-2 text-sm italic text-on-surface-variant">
                                                "{selectedOrder.delivery_instructions}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment & Status */}
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-on-surface">
                                        <CreditCard size={18} className="text-primary" /> Payment Information
                                    </h4>
                                    <div className="rounded-lg bg-surface-container-low p-4">
                                        <div className="mb-2 flex justify-between">
                                            <span className="text-on-surface-variant">Method:</span>
                                            <span className="font-bold uppercase text-on-surface">
                                                {selectedOrder.payment_method}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-on-surface-variant">Status:</span>
                                            <Badge tone={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}>
                                                {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-on-surface">
                                        <Clock size={18} className="text-primary" /> Order Status
                                    </h4>
                                    <CustomSelect
                                        options={statusOptions}
                                        value={selectedOrder.status}
                                        onChange={(val) => updateStatus.mutate({ id: selectedOrder.id, status: val })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-on-surface">
                                <Package size={18} className="text-primary" /> Order Items
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-outline-variant">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-surface-container-low">
                                            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                                                Item
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                                                Qty
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                                                Price
                                            </th>
                                            <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items?.map((item: any) => (
                                            <tr key={item.id} className="border-t border-outline-variant">
                                                <td className="px-4 py-2.5">
                                                    <div className="font-semibold text-on-surface">{item.product_name}</div>
                                                    <div className="text-xs text-on-surface-variant">
                                                        SKU: {item.product_sku || 'N/A'}
                                                    </div>
                                                    {item.is_substituted && (
                                                        <div className="text-xs font-bold text-warning">Substituted</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-on-surface">{item.quantity}</td>
                                                <td className="px-4 py-2.5 text-on-surface">
                                                    £{Number(item.unit_price).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-bold text-on-surface">
                                                    £{Number(item.total).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-outline-variant">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 text-right text-on-surface-variant">
                                                Delivery Fee
                                            </td>
                                            <td className="px-4 py-2 text-right text-on-surface">
                                                £{Number(selectedOrder.delivery_fee).toFixed(2)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 text-right text-on-surface-variant">
                                                Service Fee
                                            </td>
                                            <td className="px-4 py-2 text-right text-on-surface">
                                                £{Number(selectedOrder.service_fee || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                        {Number(selectedOrder.discount) > 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2 text-right text-error">
                                                    Discount
                                                </td>
                                                <td className="px-4 py-2 text-right text-error">
                                                    -£{Number(selectedOrder.discount).toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2.5 text-right text-lg font-extrabold text-on-surface">
                                                Order Total
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-lg font-extrabold text-primary">
                                                £{Number(selectedOrder.total).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            {/* Reject Substitutions Modal */}
            <Modal
                open={isRejectModalOpen && !!selectedOrder}
                onClose={() => setIsRejectModalOpen(false)}
                size="lg"
                title="Record Substitution Rejections"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            loading={rejectSubstitutions.isPending}
                            disabled={rejectSubstitutions.isPending || !Object.values(rejections).some((q) => q > 0)}
                            onClick={() => {
                                const payload = Object.entries(rejections)
                                    .filter(([, qty]) => qty > 0)
                                    .map(([id, qty]) => ({ order_item_id: id, quantity: qty, notes: 'Rejected at door' }));
                                rejectSubstitutions.mutate({ id: selectedOrder.id, data: payload });
                            }}
                        >
                            Confirm Rejections
                        </Button>
                    </>
                }
            >
                {selectedOrder && (
                    <>
                        <p className="mb-4 text-sm text-on-surface-variant">
                            Select the quantity of substituted items that the customer rejected at the door.
                        </p>
                        {selectedOrder.items
                            ?.filter((i: any) => i.is_substituted)
                            .map((item: any) => (
                                <div
                                    key={item.id}
                                    className="mb-2 flex items-center justify-between rounded-lg border border-outline-variant p-3"
                                >
                                    <div>
                                        <div className="font-semibold text-on-surface">{item.product_name}</div>
                                        <div className="text-sm text-on-surface-variant">Qty in Order: {item.quantity}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-on-surface">Reject Qty:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.quantity}
                                            value={rejections[item.id] || 0}
                                            onChange={(e) =>
                                                setRejections({ ...rejections, [item.id]: Number(e.target.value) })
                                            }
                                            className="w-16 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface focus:border-action-blue focus:outline-none focus:ring-2 focus:ring-action-blue/20"
                                        />
                                    </div>
                                </div>
                            ))}
                    </>
                )}
            </Modal>
        </div>
    );
}
