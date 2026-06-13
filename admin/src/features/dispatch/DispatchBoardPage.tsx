import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { RefreshCw, UserCheck, Truck, PackageCheck } from 'lucide-react';
import { orderApi, getErrorMessage } from '../../services/api';
import {
    PageHeader, Card, Badge, Button, Select, EmptyState, Skeleton,
} from '../../components/ui';

interface Card {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string | null;
    item_count: number;
    customer_name: string | null;
    delivery_address: string | null;
    store_id: string;
    assigned_to: string | null;
    driver_name: string | null;
}
interface Driver {
    id: string;
    name: string;
    is_available: boolean;
    is_online: boolean;
    total_deliveries: number;
    active_orders: number;
}
interface DispatchData {
    unassigned: Card[];
    in_flight: Card[];
    drivers: Driver[];
}

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';

const STATUS_TONE: Record<string, BadgeTone> = {
    placed: 'info',
    confirmed: 'info',
    picking: 'warning',
    substitution_pending: 'warning',
    ready_for_collection: 'primary',
    assigned_to_driver: 'info',
    out_for_delivery: 'warning',
    delivered: 'success',
    delivery_failed: 'danger',
    cancelled: 'danger',
};

const gbp = (n: number) => `£${Number(n || 0).toFixed(2)}`;

function statusLabel(status: string) {
    return status
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function StatusBadge({ status }: { status: string }) {
    return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{statusLabel(status)}</Badge>;
}

function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function DispatchBoardPage() {
    const qc = useQueryClient();
    const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [statusId, setStatusId] = useState<string | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dispatch'],
        queryFn: async () => (await orderApi.dispatch()).data as DispatchData,
        refetchInterval: 15000,
    });

    const assignMut = useMutation({
        mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
            orderApi.assignDelivery(orderId, driverId),
        onMutate: ({ orderId }) => setAssigningId(orderId),
        onSuccess: (_res, { driverId }) => {
            const driver = data?.drivers.find((d) => d.id === driverId);
            toast.success(`Assigned to ${driver?.name ?? 'driver'}`);
            qc.invalidateQueries({ queryKey: ['dispatch'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to assign driver')),
        onSettled: () => setAssigningId(null),
    });

    const statusMut = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
            orderApi.updateStatus(orderId, status),
        onMutate: ({ orderId }) => setStatusId(orderId),
        onSuccess: (_res, { status }) => {
            toast.success(
                status === 'delivered' ? 'Marked delivered' : 'Marked out for delivery',
            );
            qc.invalidateQueries({ queryKey: ['dispatch'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to update status')),
        onSettled: () => setStatusId(null),
    });

    const drivers = data?.drivers ?? [];
    const unassigned = data?.unassigned ?? [];
    const inFlight = data?.in_flight ?? [];

    return (
        <div>
            <PageHeader
                title="Dispatch"
                subtitle="Assign drivers to live orders and track deliveries in real time."
                actions={
                    <Button variant="ghost" icon={RefreshCw} onClick={() => refetch()}>
                        Refresh
                    </Button>
                }
            />

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {[0, 1, 2].map((i) => (
                        <Card key={i} className="p-5 space-y-3">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Awaiting driver */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h2 className="font-headline font-bold text-on-surface">Awaiting driver</h2>
                            <Badge tone="info">{unassigned.length}</Badge>
                        </div>
                        {unassigned.length === 0 ? (
                            <Card className="p-5">
                                <EmptyState icon={PackageCheck} title="All orders have a driver" />
                            </Card>
                        ) : (
                            unassigned.map((order) => {
                                const chosen = selectedDriver[order.id] ?? '';
                                const busy = assignMut.isPending && assigningId === order.id;
                                return (
                                    <Card key={order.id} className="p-5 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-bold text-on-surface">{order.order_number}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="text-sm text-on-surface-variant space-y-0.5">
                                            {order.customer_name && (
                                                <div className="text-on-surface">{order.customer_name}</div>
                                            )}
                                            <div>{gbp(order.total)} · {order.item_count} items</div>
                                            {order.created_at && <div className="text-xs">{timeAgo(order.created_at)}</div>}
                                            {order.delivery_address && (
                                                <div className="text-xs truncate" title={order.delivery_address}>
                                                    {order.delivery_address}
                                                </div>
                                            )}
                                        </div>
                                        {drivers.length === 0 ? (
                                            <p className="text-xs text-on-surface-variant">No drivers — add one in Drivers.</p>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={chosen}
                                                    onChange={(e) =>
                                                        setSelectedDriver((s) => ({ ...s, [order.id]: e.target.value }))
                                                    }
                                                >
                                                    <option value="">Choose driver…</option>
                                                    {drivers.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {`${d.name} · ${d.active_orders} active${d.is_available ? '' : ' · offline'}`}
                                                        </option>
                                                    ))}
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    icon={UserCheck}
                                                    disabled={!chosen}
                                                    loading={busy}
                                                    onClick={() =>
                                                        assignMut.mutate({ orderId: order.id, driverId: chosen })
                                                    }
                                                >
                                                    Assign
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </section>

                    {/* In flight */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h2 className="font-headline font-bold text-on-surface">In flight</h2>
                            <Badge tone="warning">{inFlight.length}</Badge>
                        </div>
                        {inFlight.length === 0 ? (
                            <Card className="p-5">
                                <EmptyState icon={Truck} title="Nothing out for delivery" />
                            </Card>
                        ) : (
                            inFlight.map((order) => {
                                const busy = statusMut.isPending && statusId === order.id;
                                return (
                                    <Card key={order.id} className="p-5 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-bold text-on-surface">{order.order_number}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="text-sm text-on-surface-variant space-y-0.5">
                                            {order.driver_name && (
                                                <div className="flex items-center gap-1.5 text-on-surface">
                                                    <Truck size={14} />
                                                    {order.driver_name}
                                                </div>
                                            )}
                                            {order.customer_name && <div>{order.customer_name}</div>}
                                            <div>{gbp(order.total)}</div>
                                        </div>
                                        {order.status !== 'out_for_delivery' ? (
                                            <Button
                                                size="sm"
                                                loading={busy}
                                                onClick={() =>
                                                    statusMut.mutate({ orderId: order.id, status: 'out_for_delivery' })
                                                }
                                            >
                                                Out for delivery
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="success"
                                                loading={busy}
                                                onClick={() =>
                                                    statusMut.mutate({ orderId: order.id, status: 'delivered' })
                                                }
                                            >
                                                Mark delivered
                                            </Button>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </section>

                    {/* Drivers */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h2 className="font-headline font-bold text-on-surface">Drivers</h2>
                            <Badge tone="neutral">{drivers.length}</Badge>
                        </div>
                        <Card className="p-5">
                            {drivers.length === 0 ? (
                                <p className="text-sm text-on-surface-variant">No drivers yet.</p>
                            ) : (
                                <div className="divide-y divide-outline-variant/60">
                                    {drivers.map((d) => (
                                        <div key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                            <span
                                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                                    d.is_available ? 'bg-success' : 'bg-on-surface-variant/40'
                                                }`}
                                            />
                                            <div className="min-w-0">
                                                <div className="font-semibold text-on-surface truncate">{d.name}</div>
                                                <div className="text-xs text-on-surface-variant">
                                                    {`${d.active_orders} active · ${d.total_deliveries} delivered`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </section>
                </div>
            )}
        </div>
    );
}
