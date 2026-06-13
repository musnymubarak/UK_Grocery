import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookApi, getErrorMessage } from '../../services/api';
import { usePermissions } from '../../features/auth/PermissionContext';
import toast from 'react-hot-toast';
import { Webhook, Plus, Trash2, History, Check, AlertCircle } from 'lucide-react';
import { PageHeader, Button, Badge, Card, FormField, Input, Skeleton, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

export default function WebhooksPage() {
    const queryClient = useQueryClient();
    const { can } = usePermissions();
    const [isAdding, setIsAdding] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newSecret, setNewSecret] = useState('');
    const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: webhooks = [], isLoading } = useQuery({
        queryKey: ['webhooks'],
        queryFn: async () => {
            const res = await webhookApi.list();
            return res.data;
        },
    });

    const { data: deliveries = [] } = useQuery({
        queryKey: ['webhooks', selectedWebhook, 'deliveries'],
        queryFn: async () => {
            if (!selectedWebhook) return [];
            const res = await webhookApi.deliveries(selectedWebhook);
            return res.data;
        },
        enabled: !!selectedWebhook,
    });

    const createWebhook = useMutation({
        mutationFn: (data: any) => webhookApi.create(data),
        onSuccess: () => {
            toast.success('Webhook created');
            setNewUrl('');
            setNewSecret('');
            setIsAdding(false);
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteWebhook = useMutation({
        mutationFn: (id: string) => webhookApi.delete(id),
        onSuccess: () => {
            toast.success('Webhook deleted');
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const closeForm = () => { setIsAdding(false); setNewUrl(''); setNewSecret(''); };

    return (
        <div>
            <PageHeader
                title="Webhooks & Events"
                subtitle="Send event notifications to external systems and review delivery history."
                actions={<Button icon={Plus} onClick={() => setIsAdding(true)}>Add webhook</Button>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Webhooks list */}
                <Card className="overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant">
                        <Webhook size={18} className="text-on-surface-variant" />
                        <span className="font-semibold text-on-surface">Active webhooks</span>
                    </div>
                    <div className="p-2">
                        {isLoading ? (
                            <div className="p-2 space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        ) : webhooks.length === 0 ? (
                            <EmptyState icon={Webhook} title="No webhooks" message="Register a webhook to start receiving events." />
                        ) : (
                            webhooks.map((hook: any) => {
                                const active = selectedWebhook === hook.id;
                                return (
                                    <button
                                        key={hook.id}
                                        type="button"
                                        onClick={() => setSelectedWebhook(hook.id)}
                                        className={`w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-3 mb-1 border transition-colors ${active ? 'bg-surface-container border-primary' : 'border-transparent hover:bg-surface-container-low'}`}
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm text-on-surface truncate">{hook.target_url}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                                                <Badge tone={hook.is_active ? 'success' : 'neutral'} dot>{hook.is_active ? 'Active' : 'Disabled'}</Badge>
                                                <span>Created {new Date(hook.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {can('delete_records') && (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                aria-label="Delete webhook"
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(hook.id); }}
                                                className="shrink-0 p-2 rounded-md text-error hover:bg-error/10 cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Delivery log */}
                <Card className="overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant">
                        <History size={18} className="text-on-surface-variant" />
                        <span className="font-semibold text-on-surface">Delivery logs</span>
                    </div>
                    <div className="p-4">
                        {!selectedWebhook ? (
                            <EmptyState icon={History} title="No webhook selected" message="Select a webhook to view its delivery history." />
                        ) : deliveries.length === 0 ? (
                            <EmptyState icon={History} title="No deliveries" message="No delivery logs found for this webhook." />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {deliveries.map((log: any) => {
                                    const ok = log.response_status >= 200 && log.response_status < 300;
                                    return (
                                        <div key={log.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low border border-outline-variant px-3 py-2.5">
                                            <div className={`shrink-0 rounded-full p-1.5 ${ok ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                                                {ok ? <Check size={13} /> : <AlertCircle size={13} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-on-surface truncate">{log.event_type}</div>
                                                <div className="text-xs text-on-surface-variant">{new Date(log.created_at).toLocaleString()}</div>
                                            </div>
                                            <Badge tone={ok ? 'success' : 'danger'}>{log.response_status ?? '—'}</Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Create webhook */}
            <Modal
                open={isAdding}
                onClose={closeForm}
                title="Register new webhook"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeForm}>Cancel</Button>
                        <Button
                            loading={createWebhook.isPending}
                            disabled={!newUrl.trim()}
                            onClick={() => createWebhook.mutate({ target_url: newUrl, secret: newSecret })}
                        >
                            Create webhook
                        </Button>
                    </>
                }
            >
                <FormField label="Target URL" required>
                    <Input type="url" placeholder="https://your-api.com/webhook" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                </FormField>
                <FormField label="Secret token" hint="Optional — used to sign the request payload.">
                    <Input type="password" placeholder="Signature secret" value={newSecret} onChange={(e) => setNewSecret(e.target.value)} />
                </FormField>
            </Modal>

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteWebhook.mutate(deleteId)}
                title="Delete webhook?"
                message="This webhook will stop receiving events. This cannot be undone."
                confirmLabel="Delete"
                loading={deleteWebhook.isPending}
            />
        </div>
    );
}
