import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, Button, Badge, Card, FormField, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { usePermissions } from '../../features/auth/PermissionContext';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage_discount' | 'flat_discount' | 'free_delivery' | string;
    discount_value: number | string;
    minimum_order_value?: number | string | null;
    max_redemptions?: number | null;
    current_redemptions: number;
    max_per_customer: number;
    is_active: boolean;
}

const DISCOUNT_TYPE_LABEL: Record<string, string> = {
    percentage_discount: 'Percentage',
    flat_discount: 'Flat',
    free_delivery: 'Free Delivery',
};

const EMPTY_FORM = {
    code: '',
    discount_type: 'percentage_discount',
    discount_value: '',
    minimum_order_value: '',
    max_redemptions: '',
    max_per_customer: '1',
};

function describeDiscount(c: Coupon) {
    if (c.discount_type === 'percentage_discount') return `${c.discount_value}%`;
    if (c.discount_type === 'flat_discount') return `£${c.discount_value}`;
    return 'Waives Delivery Fee';
}

export default function CouponsPage() {
    const queryClient = useQueryClient();
    const { can } = usePermissions();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Coupon | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

    const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
        queryKey: ['coupons'],
        queryFn: async () => {
            const res = await couponApi.list();
            return res.data;
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => couponApi.update(id, { is_active: active }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => couponApi.delete(id),
        onSuccess: () => {
            toast.success('Coupon deleted');
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (c: Coupon) => { setEditing(c); setShowForm(true); };

    return (
        <div>
            <PageHeader
                title="Coupons & Promotions"
                subtitle="Manage promotional codes, discounts, and free delivery offers."
                actions={<Button icon={Plus} onClick={openCreate}>New Coupon</Button>}
            />

            {isLoading ? (
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
                </div>
            ) : coupons.length === 0 ? (
                <Card>
                    <EmptyState icon={Tag} title="No coupons yet" message="Create one to get started." />
                </Card>
            ) : (
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {coupons.map((coupon) => (
                        <Card key={coupon.id} className="relative flex flex-col p-6">
                            <div className="absolute top-4 right-4">
                                <Badge tone={coupon.is_active ? 'success' : 'neutral'} dot>{coupon.is_active ? 'Active' : 'Inactive'}</Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-5">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <Tag size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-mono tracking-wide text-on-surface m-0">{coupon.code}</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        {DISCOUNT_TYPE_LABEL[coupon.discount_type] ?? coupon.discount_type}: {describeDiscount(coupon)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 text-sm text-on-surface-variant space-y-3">
                                <div className="flex justify-between">
                                    <span>Used</span>
                                    <span className="font-semibold text-on-surface">{coupon.current_redemptions} {coupon.max_redemptions ? `/ ${coupon.max_redemptions}` : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Per Customer Limit</span>
                                    <span className="font-semibold text-on-surface">{coupon.max_per_customer}</span>
                                </div>
                                {coupon.minimum_order_value != null && coupon.minimum_order_value !== '' && (
                                    <div className="flex justify-between">
                                        <span>Min. Order Value</span>
                                        <span className="font-semibold text-on-surface">£{coupon.minimum_order_value}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-outline-variant flex items-center justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={coupon.is_active ? ToggleRight : ToggleLeft}
                                    title={coupon.is_active ? 'Disable' : 'Enable'}
                                    onClick={() => toggleMutation.mutate({ id: coupon.id, active: !coupon.is_active })}
                                    className={coupon.is_active ? 'text-success' : ''}
                                />
                                <Button variant="ghost" size="sm" icon={Edit2} title="Edit" onClick={() => openEdit(coupon)} />
                                {can('delete_records') && (
                                    <Button variant="ghost" size="sm" icon={Trash2} title="Delete" onClick={() => setDeleteTarget(coupon)} className="text-error hover:bg-error/10" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showForm && (
                <CouponFormModal
                    editing={editing}
                    onClose={() => setShowForm(false)}
                    onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ['coupons'] });
                        setShowForm(false);
                    }}
                />
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                title="Delete coupon?"
                message={deleteTarget ? `Coupon "${deleteTarget.code}" will be permanently removed.` : ''}
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}

function CouponFormModal({
    editing,
    onClose,
    onSaved,
}: {
    editing: Coupon | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [formData, setFormData] = useState({
        code: editing?.code ?? EMPTY_FORM.code,
        discount_type: editing?.discount_type ?? EMPTY_FORM.discount_type,
        discount_value: editing != null ? String(editing.discount_value ?? '') : EMPTY_FORM.discount_value,
        minimum_order_value: editing?.minimum_order_value != null ? String(editing.minimum_order_value) : EMPTY_FORM.minimum_order_value,
        max_redemptions: editing?.max_redemptions != null ? String(editing.max_redemptions) : EMPTY_FORM.max_redemptions,
        max_per_customer: editing?.max_per_customer != null ? String(editing.max_per_customer) : EMPTY_FORM.max_per_customer,
    });

    const saveMutation = useMutation({
        mutationFn: (data: any) => editing ? couponApi.update(editing.id, data) : couponApi.create(data),
        onSuccess: () => {
            toast.success(editing ? 'Coupon updated' : 'Coupon created');
            onSaved();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            discount_value: formData.discount_type === 'free_delivery' ? 0 : parseFloat(formData.discount_value),
            minimum_order_value: formData.minimum_order_value ? parseFloat(formData.minimum_order_value) : null,
            max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions, 10) : null,
            max_per_customer: parseInt(formData.max_per_customer, 10),
        };
        saveMutation.mutate(payload);
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={editing ? 'Edit Coupon' : 'Create New Coupon'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} loading={saveMutation.isPending}>{editing ? 'Update' : 'Create Coupon'}</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Coupon Code" required>
                        <Input
                            required
                            type="text"
                            className="uppercase"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. SUMMER20"
                        />
                    </FormField>
                    <FormField label="Discount Type">
                        <Select value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })}>
                            <option value="percentage_discount">Percentage Discount (%)</option>
                            <option value="flat_discount">Flat Discount (£)</option>
                            <option value="free_delivery">Free Delivery</option>
                        </Select>
                    </FormField>
                    {formData.discount_type !== 'free_delivery' && (
                        <FormField label="Discount Value" required>
                            <Input required type="number" step="0.01" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} placeholder="e.g. 10" />
                        </FormField>
                    )}
                    <FormField label="Minimum Order Value (£)">
                        <Input type="number" step="0.01" value={formData.minimum_order_value} onChange={e => setFormData({ ...formData, minimum_order_value: e.target.value })} placeholder="Optional" />
                    </FormField>
                    <FormField label="Total Global Uses">
                        <Input type="number" value={formData.max_redemptions} onChange={e => setFormData({ ...formData, max_redemptions: e.target.value })} placeholder="Optional limit (e.g. first 100 uses)" />
                    </FormField>
                    <FormField label="Max Per Customer">
                        <Input type="number" min="1" value={formData.max_per_customer} onChange={e => setFormData({ ...formData, max_per_customer: e.target.value })} />
                    </FormField>
                </div>
            </form>
        </Modal>
    );
}
