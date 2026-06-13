import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryZoneApi, getErrorMessage } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import { usePermissions } from '../../features/auth/PermissionContext';
import toast from 'react-hot-toast';
import { Edit2, Trash2, MapPin } from 'lucide-react';
import { PageHeader, Button, Badge, Card, FormField, Input, Textarea, Select, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface Zone {
    id: string;
    name: string;
    base_fee: number | string;
    per_km_fee?: number | string;
    min_order_for_free_delivery: number | string;
    is_active: boolean;
    postcode_patterns: string[];
}

const gbp = (n: any) => `£${Number(n || 0).toFixed(2)}`;

export default function DeliveryZonesPage() {
    const { selectedStore } = useAdminStore();
    const { can } = usePermissions();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [baseFee, setBaseFee] = useState(0);
    const [freeDeliveryOver, setFreeDeliveryOver] = useState(0);
    const [postcodes, setPostcodes] = useState('');

    const [editZone, setEditZone] = useState<Zone | null>(null);
    const [editForm, setEditForm] = useState({ name: '', baseFee: 0, freeDeliveryOver: 0, postcodes: '', is_active: true });
    const [deleteZone, setDeleteZone] = useState<Zone | null>(null);

    const { data: zones = [], isLoading } = useQuery({
        queryKey: ['delivery_zones', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await deliveryZoneApi.list(selectedStore.id);
            return res.data as Zone[];
        },
        enabled: !!selectedStore?.id,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => deliveryZoneApi.create(selectedStore!.id, data),
        onSuccess: () => {
            toast.success('Zone created');
            queryClient.invalidateQueries({ queryKey: ['delivery_zones'] });
            setName('');
            setBaseFee(0);
            setFreeDeliveryOver(0);
            setPostcodes('');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => deliveryZoneApi.update(editZone!.id, data),
        onSuccess: () => {
            toast.success('Zone updated');
            queryClient.invalidateQueries({ queryKey: ['delivery_zones'] });
            setEditZone(null);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to update zone'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deliveryZoneApi.delete(id),
        onSuccess: () => {
            toast.success('Zone deleted');
            queryClient.invalidateQueries({ queryKey: ['delivery_zones'] });
            setDeleteZone(null);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to delete zone'));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const patterns = postcodes.split(',').map((s) => s.trim()).filter(Boolean);
        if (!name || patterns.length === 0) {
            toast.error('Name and at least one postcode are required');
            return;
        }
        createMutation.mutate({
            name,
            base_fee: baseFee,
            per_km_fee: 0,
            min_order_for_free_delivery: freeDeliveryOver,
            is_active: true,
            postcode_patterns: patterns,
        });
    };

    const openEdit = (z: Zone) => {
        setEditZone(z);
        setEditForm({
            name: z.name,
            baseFee: Number(z.base_fee),
            freeDeliveryOver: Number(z.min_order_for_free_delivery),
            postcodes: (z.postcode_patterns || []).join(', '),
            is_active: z.is_active,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        const patterns = editForm.postcodes.split(',').map((s) => s.trim()).filter(Boolean);
        if (!editForm.name || patterns.length === 0) {
            toast.error('Name and at least one postcode are required');
            return;
        }
        updateMutation.mutate({
            name: editForm.name,
            base_fee: editForm.baseFee,
            per_km_fee: 0,
            min_order_for_free_delivery: editForm.freeDeliveryOver,
            is_active: editForm.is_active,
            postcode_patterns: patterns,
        });
    };

    const columns: Column<Zone>[] = [
        {
            key: 'name', header: 'Zone name', sortable: true, accessor: (z) => z.name,
            render: (z) => <span className="font-semibold text-on-surface">{z.name}</span>,
        },
        { key: 'base_fee', header: 'Base fee', align: 'right', sortable: true, accessor: (z) => Number(z.base_fee), render: (z) => gbp(z.base_fee) },
        {
            key: 'free_over', header: 'Free delivery ≥', align: 'right', sortable: true,
            accessor: (z) => Number(z.min_order_for_free_delivery), render: (z) => gbp(z.min_order_for_free_delivery),
        },
        {
            key: 'postcodes', header: 'Coverage (postcodes)',
            accessor: (z) => (z.postcode_patterns || []).join(' '),
            render: (z) => (
                <div className="flex flex-wrap gap-1">
                    {(z.postcode_patterns || []).map((p, idx) => (
                        <Badge key={idx} tone="primary">{p}</Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'status', header: 'Status', align: 'center', accessor: (z) => (z.is_active ? 'Active' : 'Inactive'),
            render: (z) => <Badge tone={z.is_active ? 'success' : 'neutral'} dot>{z.is_active ? 'Active' : 'Inactive'}</Badge>,
        },
        {
            key: 'actions', header: '', align: 'right',
            render: (z) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(z)} />
                    {can('delete_records') && (
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteZone(z)} className="text-error hover:bg-error/10" />
                    )}
                </div>
            ),
        },
    ];

    if (!selectedStore) {
        return (
            <div>
                <PageHeader title="Delivery Zones" subtitle="Configure delivery fees and coverage per store." />
                <Card>
                    <EmptyState icon={MapPin} title="Select a store" message="Choose a store to manage its delivery zones." />
                </Card>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Delivery Zones" subtitle={`Delivery fees and coverage for ${selectedStore.name}.`} />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <DataTable
                    data={zones}
                    columns={columns}
                    rowKey={(z) => z.id}
                    loading={isLoading}
                    searchKeys={[(z) => z.name, (z) => (z.postcode_patterns || []).join(' ')]}
                    searchPlaceholder="Search zones…"
                    {...(can('export_data') ? { exportFilename: 'delivery-zones' } : {})}
                    emptyTitle="No delivery zones"
                    emptyMessage="No delivery zones configured for this store yet."
                />

                <Card className="p-5 h-fit">
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-4">Add new zone</h3>
                    <form onSubmit={handleSubmit}>
                        <FormField label="Zone name" required>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Central London, SW Region" required />
                        </FormField>
                        <FormField label="Base fee (£)" required>
                            <Input type="number" step="0.01" value={baseFee} onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)} required />
                        </FormField>
                        <FormField label="Free delivery for orders over (£)" required>
                            <Input type="number" step="0.01" value={freeDeliveryOver} onChange={(e) => setFreeDeliveryOver(parseFloat(e.target.value) || 0)} required />
                        </FormField>
                        <FormField label="Covered postcodes (comma separated)" required hint="Supports exact match or wildcard * (e.g., SW1*, E*)">
                            <Textarea value={postcodes} onChange={(e) => setPostcodes(e.target.value)} placeholder="SW1A*, E1 6AN, N1*" rows={3} required />
                        </FormField>
                        <Button type="submit" className="w-full" loading={createMutation.isPending}>Create zone</Button>
                    </form>
                </Card>
            </div>

            {/* Edit zone */}
            <Modal
                open={!!editZone}
                onClose={() => setEditZone(null)}
                title={editZone ? `Edit zone — ${editZone.name}` : 'Edit zone'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditZone(null)}>Cancel</Button>
                        <Button onClick={handleUpdate} loading={updateMutation.isPending}>Save changes</Button>
                    </>
                }
            >
                <form onSubmit={handleUpdate}>
                    <FormField label="Zone name" required>
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Base fee (£)" required>
                            <Input type="number" step="0.01" value={editForm.baseFee} onChange={(e) => setEditForm({ ...editForm, baseFee: parseFloat(e.target.value) || 0 })} required />
                        </FormField>
                        <FormField label="Free delivery over (£)" required>
                            <Input type="number" step="0.01" value={editForm.freeDeliveryOver} onChange={(e) => setEditForm({ ...editForm, freeDeliveryOver: parseFloat(e.target.value) || 0 })} required />
                        </FormField>
                    </div>
                    <FormField label="Covered postcodes (comma separated)" required hint="Supports exact match or wildcard * (e.g., SW1*, E*)">
                        <Textarea value={editForm.postcodes} onChange={(e) => setEditForm({ ...editForm, postcodes: e.target.value })} placeholder="SW1A*, E1 6AN, N1*" rows={3} required />
                    </FormField>
                    <FormField label="Status">
                        <Select value={editForm.is_active ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === '1' })}>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </Select>
                    </FormField>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!deleteZone}
                onClose={() => setDeleteZone(null)}
                onConfirm={() => deleteZone && deleteMutation.mutate(deleteZone.id)}
                title="Delete zone?"
                message={deleteZone ? `${deleteZone.name} will be permanently removed.` : ''}
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
