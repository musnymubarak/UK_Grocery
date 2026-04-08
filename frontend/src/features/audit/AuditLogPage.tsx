import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import { auditApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { useAdminStore } from '../auth/AdminStoreContext';
import { useAuth } from '../auth/AuthContext';

export default function AuditLogPage() {
    const { user } = useAuth();
    const { selectedStore } = useAdminStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const effectiveStoreId = isAdmin ? selectedStore?.id : user?.store_id;

    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const limit = 50;
    const skip = (page - 1) * limit;

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['auditLogs', effectiveStoreId, actionFilter, page],
        queryFn: async () => {
            const params: any = { skip, limit };
            if (effectiveStoreId) params.store_id = effectiveStoreId;
            if (actionFilter) params.action = actionFilter;
            const res = await auditApi.list(params);
            return res.data;
        },
    });

    const handleExport = async () => {
        try {
            const params: any = {};
            if (effectiveStoreId) params.store_id = effectiveStoreId;
            if (actionFilter) params.action = actionFilter;

            const res = await auditApi.export(params);

            // Auto download blob
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to export logs'));
        }
    };

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-muted">Track system events and changes.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => refetch()}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={handleExport}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div className="form-group" style={{ flex: 1, maxWidth: 300 }}>
                        <label>Filter by Action</label>
                        <select
                            className="input"
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Actions</option>
                            <option value="AUTH_LOGIN_SUCCESS">Login Success</option>
                            <option value="SALE_CREATED">Sale Created</option>
                            <option value="SALE_VOIDED">Sale Voided</option>
                            <option value="PRODUCT_CREATED">Product Created</option>
                            <option value="PRODUCT_UPDATED">Product Updated</option>
                            <option value="STOCK_ADJUSTED">Stock Adjusted</option>
                            <option value="PREORDER_CREATED">Pre-Order Created</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                                </tr>
                            ) : data?.items?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No logs found.</td>
                                </tr>
                            ) : (
                                data?.items.map((log: any) => (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => toggleRow(log.id)}
                                        >
                                            <td>
                                                {expandedRows[log.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>
                                            <td>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</td>
                                            <td>
                                                {log.user_name}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user_role}</div>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: 'var(--primary-light)', color: '#fff' }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>
                                                {log.entity_type || '-'}
                                                {log.entity_id && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {log.entity_id.split('-')[0]}...</div>}
                                            </td>
                                            <td>{log.ip_address || '-'}</td>
                                        </tr>
                                        {expandedRows[log.id] && (
                                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                                <td colSpan={6} style={{ padding: 16 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
                                                        {log.old_value && (
                                                            <div className="card">
                                                                <h4 style={{ marginBottom: 8, fontSize: '0.85rem', color: 'var(--danger)' }}>Old Value</h4>
                                                                <pre style={{ fontSize: '0.8rem', overflowX: 'auto', background: 'var(--bg-primary)', padding: 8, borderRadius: 4 }}>
                                                                    {JSON.stringify(log.old_value, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {log.new_value && (
                                                            <div className="card">
                                                                <h4 style={{ marginBottom: 8, fontSize: '0.85rem', color: 'var(--success)' }}>New Value</h4>
                                                                <pre style={{ fontSize: '0.8rem', overflowX: 'auto', background: 'var(--bg-primary)', padding: 8, borderRadius: 4 }}>
                                                                    {JSON.stringify(log.new_value, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {log.notes && (
                                                        <div style={{ marginTop: 16, fontSize: '0.9rem' }}>
                                                            <strong>Notes:</strong> {log.notes}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Placeholder */}
            {data && data.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                    <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {data.pages}</span>
                    <button className="btn btn-outline" disabled={page === data.pages} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
