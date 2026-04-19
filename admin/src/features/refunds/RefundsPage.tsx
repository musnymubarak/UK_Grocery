import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Undo2, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Eye, ShoppingBag, User, CreditCard } from 'lucide-react';

export default function RefundsPage() {
    const queryClient = useQueryClient();
    const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
    const [processingItem, setProcessingItem] = useState<{refundId: string, itemId: string} | null>(null);
    const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
    const [notes, setNotes] = useState('');

    const { data: refunds = [], isLoading } = useQuery({
        queryKey: ['refunds'],
        queryFn: async () => {
            const res = await refundApi.list();
            return res.data;
        },
    });

    const processItem = useMutation({
        mutationFn: ({ refundId, itemId, status, notes }: { refundId: string, itemId: string, status: string, notes: string }) => 
            refundApi.processItem(refundId, itemId, { status, admin_notes: notes }),
        onSuccess: (res) => {
            toast.success(`Item ${action} successfully`);
            setProcessingItem(null);
            setAction(null);
            setNotes('');
            queryClient.invalidateQueries({ queryKey: ['refunds'] });
            
            // Update local state for the selected refund to show immediate feedback
            if (selectedRefund) {
                const updatedItems = selectedRefund.items.map((it: any) => 
                    it.id === res.data.id ? res.data : it
                );
                setSelectedRefund({ ...selectedRefund, items: updatedItems });
            }
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    if (isLoading) return <div className="p-8">Loading refund requests...</div>;

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'pending': return { label: 'Pending', icon: Clock, color: 'var(--warning)', bg: 'var(--warning)15' };
            case 'approved': return { label: 'Approved', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success)15' };
            case 'rejected': return { label: 'Rejected', icon: XCircle, color: 'var(--danger)', bg: 'var(--danger)15' };
            case 'partially_approved': return { label: 'Partial', icon: CheckCircle, color: 'var(--primary)', bg: 'var(--primary)15' };
            default: return { label: status, icon: Clock, color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
        }
    };

    return (
        <div className="p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--primary)15', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <Undo2 size={24} color="var(--primary)" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Refund Requests</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review and process item-level refund claims</p>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Order Ref</th>
                            <th>Customer</th>
                            <th>Approved Total</th>
                            <th>Dest.</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <div>No refund requests found.</div>
                                </td>
                            </tr>
                        ) : (
                            refunds.map((refund: any) => {
                                const status = getStatusStyle(refund.status);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={refund.id}>
                                        <td>{new Date(refund.created_at).toLocaleDateString()}</td>
                                        <td><span className="badge badge-outline">{refund.order_reference || 'REF-'+refund.order_id.slice(0,8)}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={14} />
                                                </div>
                                                {refund.customer_name || 'Customer'}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: refund.total_amount > 0 ? 'var(--success)' : 'inherit' }}>
                                            £{Number(refund.total_amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {refund.destination === 'wallet' ? <ShoppingBag size={14} /> : <CreditCard size={14} />}
                                                {refund.destination === 'wallet' ? 'Wallet' : 'Original'}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem' }}>{refund.items?.length || 0} items</span>
                                        </td>
                                        <td>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                                                color: status.color, background: status.bg, 
                                                padding: '0.25rem 0.6rem', borderRadius: '1rem',
                                                fontWeight: 600, fontSize: '0.8rem' 
                                            }}>
                                                <StatusIcon size={14} /> {status.label}
                                            </div>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => setSelectedRefund(refund)}
                                                className="btn btn-sm btn-ghost"
                                                style={{ gap: '0.5rem' }}
                                            >
                                                <Eye size={16} /> Review
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Refund Details & Processing Modal */}
            {selectedRefund && (
                <div className="modal-overlay" onClick={() => setSelectedRefund(null)}>
                    <div className="modal" style={{ width: '800px', maxWidth: '95vw', height: '80vh' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Refund Claim: {selectedRefund.order_reference || selectedRefund.id.slice(0,8)}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Requested on {new Date(selectedRefund.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedRefund(null)} className="btn btn-ghost">Close</button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Customer</div>
                                    <div style={{ fontWeight: 600 }}>{selectedRefund.customer_name || 'System User'}</div>
                                </div>
                                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Method</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                        {selectedRefund.destination === 'wallet' ? <ShoppingBag size={18} /> : <CreditCard size={18} />}
                                        {selectedRefund.destination === 'wallet' ? 'Wallet Credit' : 'Original Payment Method'}
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Current Approved Total</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success)' }}>£{Number(selectedRefund.total_amount).toFixed(2)}</div>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: '1rem' }}>Requested Items ({selectedRefund.items?.length || 0})</h4>
                            <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <table className="table" style={{ margin: 0 }}>
                                    <thead style={{ background: 'var(--bg-elevated)' }}>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Refund Amount</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRefund.items?.map((item: any) => {
                                            const itemStatus = getStatusStyle(item.status);
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{item.product_name || 'Order Item'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.id.slice(0,8)}</div>
                                                    </td>
                                                    <td>{item.quantity}</td>
                                                    <td style={{ fontWeight: 600 }}>£{Number(item.amount).toFixed(2)}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>
                                                        <div className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{item.reason.replace('_', ' ')}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ color: itemStatus.color, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                                            <itemStatus.icon size={14} /> {itemStatus.label}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {item.status === 'pending' ? (
                                                            <button 
                                                                onClick={() => { setProcessingItem({refundId: selectedRefund.id, itemId: item.id}); setAction('approved'); }}
                                                                className="btn btn-xs btn-primary"
                                                            >
                                                                Decide
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => item.admin_notes && toast(`Notes: ${item.admin_notes}`)}
                                                                className="btn btn-xs btn-ghost"
                                                                disabled={!item.admin_notes}
                                                            >
                                                                <FileText size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Item Decision Modal */}
            {processingItem && action && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal" style={{ width: '450px' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <AlertTriangle color="var(--warning)" size={24} />
                            <h3 style={{ margin: 0 }}>Review Item Claim</h3>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
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

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Decision Note</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add internal notes about this decision..."
                                style={{ 
                                    width: '100%', minHeight: '80px', padding: '0.75rem', 
                                    borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', 
                                    border: '1px solid var(--border)', color: 'var(--text-primary)',
                                    outline: 'none', fontSize: '0.9rem'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button onClick={() => { setProcessingItem(null); setAction(null); setNotes(''); }} className="btn btn-ghost">Cancel</button>
                                <button 
                                    disabled={processItem.isPending}
                                    onClick={() => processItem.mutate({ 
                                        refundId: processingItem.refundId, 
                                        itemId: processingItem.itemId, 
                                        status: action, 
                                        notes 
                                    })}
                                    className="btn btn-primary"
                                    style={{ 
                                        background: action === 'approved' ? 'var(--success)' : 'var(--danger)', 
                                        borderColor: action === 'approved' ? 'var(--success)' : 'var(--danger)',
                                        minWidth: '120px'
                                    }}
                                >
                                    {processItem.isPending ? 'Saving...' : `Confirm ${action}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
