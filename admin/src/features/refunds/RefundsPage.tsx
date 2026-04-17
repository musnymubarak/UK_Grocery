import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Undo2, CheckCircle, XCircle, Clock, AlertTriangle, FileText } from 'lucide-react';

export default function RefundsPage() {
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
    const [notes, setNotes] = useState('');

    const { data: refunds = [], isLoading } = useQuery({
        queryKey: ['refunds'],
        queryFn: async () => {
            const res = await refundApi.list();
            return res.data;
        },
    });

    const processRefund = useMutation({
        mutationFn: ({ id, status, notes }: { id: string, status: string, notes: string }) => 
            refundApi.process(id, { status, admin_notes: notes }),
        onSuccess: () => {
            toast.success('Refund request processed');
            setProcessingId(null);
            setAction(null);
            setNotes('');
            queryClient.invalidateQueries({ queryKey: ['refunds'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    if (isLoading) return <div className="p-8">Loading refund requests...</div>;

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'pending': return { label: 'Pending', icon: Clock, color: 'var(--warning)' };
            case 'approved': return { label: 'Approved', icon: CheckCircle, color: 'var(--success)' };
            case 'rejected': return { label: 'Rejected', icon: XCircle, color: 'var(--danger)' };
            default: return { label: status, icon: Clock, color: 'var(--text-muted)' };
        }
    };

    return (
        <div className="p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <Undo2 size={32} color="var(--primary)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Refund Requests</h2>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Request Date</th>
                            <th>Order Ref</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No refund requests found.
                                </td>
                            </tr>
                        ) : (
                            refunds.map((refund: any) => {
                                const status = getStatusLabel(refund.status);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={refund.id}>
                                        <td>{new Date(refund.created_at).toLocaleDateString()}</td>
                                        <td><span className="badge badge-outline">{refund.order_reference}</span></td>
                                        <td>{refund.customer_name}</td>
                                        <td style={{ fontWeight: 600 }}>£{Number(refund.amount).toFixed(2)}</td>
                                        <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '2px' }}>{refund.reason}</div>
                                            <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {refund.details}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: status.color, fontWeight: 600, fontSize: '0.9rem' }}>
                                                <StatusIcon size={16} /> {status.label}
                                            </div>
                                        </td>
                                        <td>
                                            {refund.status === 'pending' ? (
                                                <button 
                                                    onClick={() => { setProcessingId(refund.id); setAction('approved'); }}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Process
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => toast(`Admin Notes: ${refund.admin_notes || 'No notes'}`)}
                                                    className="btn btn-sm btn-ghost"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {processingId && action && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', zIndex: 1000 
                }}>
                    <div style={{ 
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
                        width: '500px', border: '1px solid var(--border)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <AlertTriangle size={32} color="var(--warning)" />
                            <h3 style={{ margin: 0 }}>Review Refund Request</h3>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button 
                                onClick={() => setAction('approved')}
                                style={{ 
                                    flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', 
                                    border: `2px solid ${action === 'approved' ? 'var(--success)' : 'var(--border)'}`,
                                    background: action === 'approved' ? 'var(--success)10' : 'transparent',
                                    color: action === 'approved' ? 'var(--success)' : 'var(--text-muted)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                <CheckCircle /> Approve
                            </button>
                            <button 
                                onClick={() => setAction('rejected')}
                                style={{ 
                                    flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', 
                                    border: `2px solid ${action === 'rejected' ? 'var(--danger)' : 'var(--border)'}`,
                                    background: action === 'rejected' ? 'var(--danger)10' : 'transparent',
                                    color: action === 'rejected' ? 'var(--danger)' : 'var(--text-muted)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                <XCircle /> Reject
                            </button>
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Internal Admin Notes</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={action === 'approved' ? 'Reason for approval (e.g. valid damage)' : 'Reason for rejection...'}
                            style={{ 
                                width: '100%', minHeight: '100px', padding: '0.75rem', 
                                borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', 
                                border: '1px solid var(--border)', color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button onClick={() => { setProcessingId(null); setAction(null); setNotes(''); }} className="btn btn-ghost">Cancel</button>
                            <button 
                                disabled={processRefund.isPending}
                                onClick={() => processRefund.mutate({ id: processingId, status: action, notes })}
                                className="btn btn-primary"
                                style={{ background: action === 'approved' ? 'var(--success)' : 'var(--danger)', borderColor: action === 'approved' ? 'var(--success)' : 'var(--danger)' }}
                            >
                                {processRefund.isPending ? 'Processing...' : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
