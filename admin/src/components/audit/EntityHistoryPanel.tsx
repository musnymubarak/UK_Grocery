import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X, History, ChevronRight, ChevronDown } from 'lucide-react';
import { auditApi } from '../../services/api';
import { useAuth } from '../../features/auth/AuthContext';
import { useAdminStore } from '../../features/auth/AdminStoreContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    entityType: string;
    entityId: string;
    entityName?: string;
}

export default function EntityHistoryPanel({ isOpen, onClose, entityType, entityId, entityName }: Props) {
    const { user } = useAuth();
    const { selectedStore } = useAdminStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const effectiveStoreId = isAdmin ? selectedStore?.id : user?.store_id;

    const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

    const { data, isLoading } = useQuery({
        queryKey: ['entityHistory', entityType, entityId, effectiveStoreId],
        queryFn: async () => {
            if (!entityId || !entityType) return [];
            const params: any = { entity_type: entityType, entity_id: entityId, limit: 100 };
            if (effectiveStoreId) params.store_id = effectiveStoreId;
            const res = await auditApi.list(params);
            return res.data?.items || [];
        },
        enabled: isOpen && !!entityId,
    });

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
            <div
                className="slide-panel"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: '500px', maxWidth: '100%',
                    background: 'var(--bg-primary)',
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
                    <div>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <History size={18} /> History: {entityName || entityType}
                        </h3>
                        {entityId && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>ID: {entityId}</p>}
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading history...</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No history found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {data.map((log: any) => (
                                <div key={log.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', padding: 12,
                                            background: 'var(--bg-secondary)', cursor: 'pointer',
                                            borderBottom: expandedRows[log.id] ? '1px solid var(--border)' : 'none'
                                        }}
                                        onClick={() => toggleRow(log.id)}
                                    >
                                        <div style={{ marginRight: 12, marginTop: 2 }}>
                                            {expandedRows[log.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <span className="badge" style={{ background: 'var(--primary-light)', color: '#fff' }}>{log.action}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>{log.user_name}</strong> {log.notes ? `- ${log.notes}` : ''}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedRows[log.id] && (
                                        <div style={{ padding: 12, background: 'var(--bg-primary)' }}>
                                            {log.old_value && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>Old Value</div>
                                                    <pre style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: 8, borderRadius: 4, overflowX: 'auto', margin: 0 }}>
                                                        {JSON.stringify(log.old_value, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {log.new_value && (
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>New Value</div>
                                                    <pre style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: 8, borderRadius: 4, overflowX: 'auto', margin: 0 }}>
                                                        {JSON.stringify(log.new_value, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
