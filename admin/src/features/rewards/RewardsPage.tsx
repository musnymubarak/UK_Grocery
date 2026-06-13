import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Award } from 'lucide-react';
import { PageHeader, Button, Badge, Card, FormField, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { usePermissions } from '../../features/auth/PermissionContext';

interface Tier {
    id: string;
    name: string;
    threshold_amount: number | string;
    reward_type: string;
    reward_value: number | string;
    expiry_days: number | string;
}

const EMPTY_FORM = {
    name: '',
    threshold_amount: '',
    reward_type: 'flat_discount',
    reward_value: '',
    expiry_days: '30',
};

const rewardLabel = (tier: Tier) =>
    tier.reward_type === 'percentage_discount'
        ? `${tier.reward_value}% Off`
        : tier.reward_type === 'flat_discount'
        ? `£${tier.reward_value} Off`
        : 'Free Delivery';

export default function RewardsPage() {
    const queryClient = useQueryClient();
    const { can } = usePermissions();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Tier | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

    const { data: tiers = [], isLoading } = useQuery({
        queryKey: ['rewards_tiers'],
        queryFn: async () => {
            const res = await rewardsApi.listTiers();
            return res.data as Tier[];
        },
    });

    const saveMutation = useMutation({
        mutationFn: (data: any) =>
            editing ? rewardsApi.updateTier(editing.id, data) : rewardsApi.createTier(data),
        onSuccess: () => {
            toast.success(editing ? 'Reward tier updated' : 'Reward tier created');
            closeForm();
            queryClient.invalidateQueries({ queryKey: ['rewards_tiers'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rewardsApi.deleteTier(id),
        onSuccess: () => {
            toast.success('Tier deleted');
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['rewards_tiers'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const openCreate = () => {
        setEditing(null);
        setFormData(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (tier: Tier) => {
        setEditing(tier);
        setFormData({
            name: tier.name ?? '',
            threshold_amount: String(tier.threshold_amount ?? ''),
            reward_type: tier.reward_type ?? 'flat_discount',
            reward_value: tier.reward_value != null ? String(tier.reward_value) : '',
            expiry_days: String(tier.expiry_days ?? '30'),
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        setFormData(EMPTY_FORM);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isFreeDelivery = formData.reward_type === 'free_delivery';
        saveMutation.mutate({
            ...formData,
            threshold_amount: parseFloat(formData.threshold_amount),
            reward_value: isFreeDelivery ? 0 : parseFloat(formData.reward_value),
            expiry_days: parseInt(formData.expiry_days, 10),
        });
    };

    return (
        <div>
            <PageHeader
                title="Loyalty & Rewards"
                subtitle="Automated spending milestones and point generation levels."
                actions={<Button icon={Plus} onClick={openCreate}>New tier</Button>}
            />

            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            ) : tiers.length === 0 ? (
                <Card className="p-0">
                    <EmptyState
                        icon={Award}
                        title="No reward tiers defined"
                        message="Create one to incentivize your shoppers with automated spending rewards."
                        action={<Button icon={Plus} onClick={openCreate}>New tier</Button>}
                    />
                </Card>
            ) : (
                <div className="flex flex-col gap-4">
                    {tiers.map((tier) => (
                        <Card key={tier.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="h-12 w-12 shrink-0 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                    <Award size={26} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-headline text-lg font-bold text-on-surface truncate">{tier.name}</h3>
                                    <p className="text-sm text-on-surface-variant">
                                        Unlocked at{' '}
                                        <span className="font-semibold text-on-surface">£{tier.threshold_amount}</span> monthly spend
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-[11px] uppercase tracking-wide text-on-surface-variant mb-1">Reward output</div>
                                    <Badge tone="success">{rewardLabel(tier)}</Badge>
                                </div>
                                <div className="flex items-center gap-1 pl-4 border-l border-outline-variant">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(tier)}>Edit</Button>
                                    {can('delete_records') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={Trash2}
                                            onClick={() => setDeleteId(tier.id)}
                                            className="text-error hover:bg-error/10"
                                        />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / edit modal */}
            <Modal
                open={showForm}
                onClose={closeForm}
                title={editing ? 'Edit reward tier' : 'Define new spending tier'}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeForm}>Cancel</Button>
                        <Button onClick={handleSubmit} loading={saveMutation.isPending}>
                            {editing ? 'Save changes' : 'Establish tier'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField label="Tier name" required>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Gold Platter Monthly"
                            />
                        </FormField>
                        <FormField label="Spend threshold trigger (£)" required>
                            <Input
                                required
                                type="number"
                                step="1"
                                value={formData.threshold_amount}
                                onChange={(e) => setFormData({ ...formData, threshold_amount: e.target.value })}
                                placeholder="e.g. 500"
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField label="Reward type" required>
                            <Select
                                value={formData.reward_type}
                                onChange={(e) => setFormData({ ...formData, reward_type: e.target.value })}
                            >
                                <option value="percentage_discount">Percentage Discount (%)</option>
                                <option value="flat_discount">Flat Discount (£)</option>
                                <option value="free_delivery">Free Delivery</option>
                            </Select>
                        </FormField>
                        {formData.reward_type !== 'free_delivery' && (
                            <FormField label="Value" required>
                                <Input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.reward_value}
                                    onChange={(e) => setFormData({ ...formData, reward_value: e.target.value })}
                                />
                            </FormField>
                        )}
                        <FormField label="Coupon lifespan (days)" required>
                            <Input
                                required
                                type="number"
                                value={formData.expiry_days}
                                onChange={(e) => setFormData({ ...formData, expiry_days: e.target.value })}
                            />
                        </FormField>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete tier?"
                message="This reward tier will be removed. Existing issued coupons are unaffected."
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
