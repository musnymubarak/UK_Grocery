import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Webhook, Plus, Trash2, History, Check, X, AlertCircle } from 'lucide-react';

export default function WebhooksPage() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newSecret, setNewSecret] = useState('');
    const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

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
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    return (
        <div className="p-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Webhook size={32} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Webhooks & Events</h2>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} /> Add Webhook
                    </button>
                )}
            </div>

            {isAdding && (
                <div style={{ 
                    background: 'var(--bg-card)', 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid var(--border)',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Register New Webhook</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Target URL</label>
                            <input 
                                type="url" 
                                placeholder="https://your-api.com/webhook"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Secret Token (Optional)</label>
                            <input 
                                type="password" 
                                placeholder="Signature secret"
                                value={newSecret}
                                onChange={(e) => setNewSecret(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setIsAdding(false)} className="btn btn-ghost">Cancel</button>
                        <button 
                            disabled={!newUrl || createWebhook.isPending}
                            onClick={() => createWebhook.mutate({ target_url: newUrl, secret: newSecret })}
                            className="btn btn-primary"
                        >
                            {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Webhooks List */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Active Webhooks</div>
                    <div style={{ padding: '0.5rem' }}>
                        {isLoading ? (
                            <div className="p-4 text-center">Loading hooks...</div>
                        ) : webhooks.length === 0 ? (
                            <div className="p-8 text-center text-muted">No webhooks registered</div>
                        ) : (
                            webhooks.map((hook: any) => (
                                <div 
                                    key={hook.id}
                                    onClick={() => setSelectedWebhook(hook.id)}
                                    style={{ 
                                        padding: '1rem', 
                                        borderRadius: 'var(--radius-md)', 
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer',
                                        border: '1px solid transparent',
                                        background: selectedWebhook === hook.id ? 'var(--bg-elevated)' : 'transparent',
                                        borderColor: selectedWebhook === hook.id ? 'var(--primary)' : 'transparent',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {hook.target_url}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {hook.is_active ? 'Active' : 'Disabled'} | Created: {new Date(hook.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(confirm('Are you sure?')) deleteWebhook.mutate(hook.id); }}
                                        style={{ padding: '0.5rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Delivery History */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={18} /> Delivery Logs
                    </div>
                    <div style={{ padding: '1rem' }}>
                        {!selectedWebhook ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Select a webhook to view delivery history
                            </div>
                        ) : deliveries.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No delivery logs found for this hook
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {deliveries.map((log: any) => (
                                    <div key={log.id} style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--radius-md)', 
                                        background: 'var(--bg-elevated)', 
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        {log.response_status >= 200 && log.response_status < 300 ? (
                                            <div style={{ background: 'var(--success)', borderRadius: '50%', padding: '4px' }}><Check size={12} color="white" /></div>
                                        ) : (
                                            <div style={{ background: 'var(--danger)', borderRadius: '50%', padding: '4px' }}><AlertCircle size={12} color="white" /></div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.event_type}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attempted: {new Date(log.created_at).toLocaleString()}</div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: log.response_status >= 400 ? 'var(--danger)' : 'var(--success)' }}>
                                            {log.response_status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
