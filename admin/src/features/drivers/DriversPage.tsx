import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, storeApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Bike, Car, Truck as TruckIcon, Users, UserCheck, Wifi, CircleCheck, Pencil } from 'lucide-react';
import { PageHeader, Button, Badge, StatCard, FormField, Input, Select, Toggle, IconButton } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface Driver {
    id: string;
    email: string;
    full_name: string;
    phone?: string | null;
    store_id?: string | null;
    is_active: boolean;
    created_at: string;
    vehicle_type?: string | null;
    is_available: boolean;
    is_online: boolean;
    total_deliveries: number;
    shift_start?: string | null;
}

interface Store {
    id: string;
    name: string;
}

const VEHICLE_ICON: Record<string, React.ReactNode> = {
    bike: <Bike size={14} />,
    car: <Car size={14} />,
    van: <TruckIcon size={14} />,
};

export default function DriversPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Driver | null>(null);

    const { data: drivers = [], isLoading } = useQuery<Driver[]>({
        queryKey: ['drivers'],
        queryFn: async () => (await driverApi.list()).data,
    });

    const { data: stores = [] } = useQuery<Store[]>({
        queryKey: ['stores'],
        queryFn: async () => (await storeApi.list()).data,
    });

    const storeName = (id?: string | null) => stores.find((s) => s.id === id)?.name ?? '—';

    const counts = {
        total: drivers.length,
        active: drivers.filter((d) => d.is_active).length,
        online: drivers.filter((d) => d.is_online).length,
        available: drivers.filter((d) => d.is_available && d.is_online).length,
    };

    const columns: Column<Driver>[] = [
        {
            key: 'name', header: 'Driver', sortable: true, accessor: (d) => d.full_name, render: (d) => (
                <div>
                    <div className="font-semibold text-on-surface">{d.full_name}</div>
                    <div className="text-xs text-on-surface-variant">{storeName(d.store_id)}</div>
                </div>
            ),
        },
        {
            key: 'contact', header: 'Contact', accessor: (d) => d.email, render: (d) => (
                <div className="text-sm">
                    <div className="text-on-surface">{d.email}</div>
                    <div className="text-xs text-on-surface-variant">{d.phone || '—'}</div>
                </div>
            ),
        },
        {
            key: 'vehicle', header: 'Vehicle', accessor: (d) => d.vehicle_type ?? '', render: (d) => (
                <span className="inline-flex items-center gap-1.5 text-sm capitalize">
                    {d.vehicle_type ? VEHICLE_ICON[d.vehicle_type] ?? null : null}
                    {d.vehicle_type || '—'}
                </span>
            ),
        },
        {
            key: 'status', header: 'Status', align: 'center', accessor: (d) => (d.is_active ? 'Active' : 'Disabled'), render: (d) => (
                <div className="flex flex-col items-center gap-1">
                    <Badge tone={d.is_active ? 'success' : 'danger'} dot>{d.is_active ? 'Active' : 'Disabled'}</Badge>
                    <Badge tone={d.is_online ? (d.is_available ? 'info' : 'warning') : 'neutral'} dot>
                        {d.is_online ? (d.is_available ? 'Online · available' : 'Online · busy') : 'Offline'}
                    </Badge>
                </div>
            ),
        },
        { key: 'deliveries', header: 'Deliveries', align: 'right', sortable: true, accessor: (d) => d.total_deliveries },
        {
            key: 'actions', header: '', align: 'right', render: (d) => (
                <div className="flex justify-end">
                    <IconButton icon={Pencil} label="Edit driver" size={15} onClick={() => setEditing(d)} />
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delivery Drivers"
                subtitle="Onboard drivers and track who is on shift and available."
                actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>New driver</Button>}
            />

            {/* KPI summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard icon={Users} label="Total drivers" value={counts.total} tone="primary" loading={isLoading} />
                <StatCard icon={UserCheck} label="Active accounts" value={counts.active} tone="blue" loading={isLoading} />
                <StatCard icon={Wifi} label="Online now" value={counts.online} tone="amber" loading={isLoading} />
                <StatCard icon={CircleCheck} label="Available now" value={counts.available} tone="green" loading={isLoading} />
            </div>

            <DataTable
                data={drivers}
                columns={columns}
                rowKey={(d) => d.id}
                loading={isLoading}
                searchKeys={[(d) => d.full_name, (d) => d.email, (d) => d.phone]}
                searchPlaceholder="Search drivers…"
                emptyTitle="No drivers yet"
                emptyMessage="Click New driver to onboard your first one."
            />

            {showCreate && (
                <CreateDriverModal
                    stores={stores}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['drivers'] });
                        setShowCreate(false);
                    }}
                />
            )}

            {editing && (
                <EditDriverModal
                    driver={editing}
                    stores={stores}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ['drivers'] });
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

function CreateDriverModal({
    stores,
    onClose,
    onCreated,
}: {
    stores: Store[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        store_id: '',
        vehicle_type: 'bike',
    });

    const create = useMutation({
        mutationFn: () =>
            driverApi.create({
                email: form.email,
                password: form.password,
                full_name: form.full_name,
                phone: form.phone || undefined,
                store_id: form.store_id || undefined,
                vehicle_type: form.vehicle_type || undefined,
            }),
        onSuccess: () => {
            toast.success(`Driver ${form.full_name} created`);
            onCreated();
        },
        onError: (e) => {
            toast.error(getErrorMessage(e));
        },
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        create.mutate();
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="New Driver"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={create.isPending}>Create Driver</Button>
                </>
            }
        >
            <form onSubmit={submit}>
                <FormField label="Full name" required>
                    <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
                </FormField>
                <FormField label="Email" required>
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </FormField>
                <FormField label="Password" required hint="Minimum 6 characters">
                    <Input type="password" minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
                </FormField>
                <FormField label="Phone">
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+44…" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Assigned store">
                        <Select value={form.store_id} onChange={(e) => setForm((f) => ({ ...f, store_id: e.target.value }))}>
                            <option value="">— None —</option>
                            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="Vehicle">
                        <Select value={form.vehicle_type} onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}>
                            <option value="bike">Bike</option>
                            <option value="car">Car</option>
                            <option value="van">Van</option>
                        </Select>
                    </FormField>
                </div>
            </form>
        </Modal>
    );
}

function EditDriverModal({
    driver,
    stores,
    onClose,
    onSaved,
}: {
    driver: Driver;
    stores: Store[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({
        full_name: driver.full_name ?? '',
        phone: driver.phone ?? '',
        store_id: driver.store_id ?? '',
        vehicle_type: driver.vehicle_type ?? 'bike',
        is_active: driver.is_active,
    });

    const save = useMutation({
        mutationFn: () =>
            driverApi.update(driver.id, {
                full_name: form.full_name,
                phone: form.phone,
                store_id: form.store_id || undefined,
                vehicle_type: form.vehicle_type,
                is_active: form.is_active,
            }),
        onSuccess: () => {
            toast.success(`Driver ${form.full_name} updated`);
            onSaved();
        },
        onError: (e) => {
            toast.error(getErrorMessage(e));
        },
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        save.mutate();
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Edit Driver"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={save.isPending}>Save Changes</Button>
                </>
            }
        >
            <form onSubmit={submit}>
                <FormField label="Full name" required>
                    <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
                </FormField>
                <FormField label="Phone">
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+44…" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Assigned store">
                        <Select value={form.store_id} onChange={(e) => setForm((f) => ({ ...f, store_id: e.target.value }))}>
                            <option value="">— None —</option>
                            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="Vehicle">
                        <Select value={form.vehicle_type} onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}>
                            <option value="bike">Bike</option>
                            <option value="car">Car</option>
                            <option value="van">Van</option>
                        </Select>
                    </FormField>
                </div>
                <FormField label="Account status">
                    <Toggle
                        checked={form.is_active}
                        onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                        label={form.is_active ? 'Active' : 'Disabled'}
                    />
                </FormField>
            </form>
        </Modal>
    );
}
