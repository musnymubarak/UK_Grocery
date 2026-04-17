import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, getErrorMessage } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import toast from 'react-hot-toast';
import { MessageSquare, Star, Reply, Eye, EyeOff, Search } from 'lucide-react';

export default function ReviewsPage() {
    const { selectedStore } = useAdminStore();
    const queryClient = useQueryClient();
    const [respondingTo, setRespondingTo] = useState<any>(null);
    const [responseText, setResponseText] = useState('');

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return [];
            const res = await reviewApi.list(selectedStore.id);
            return res.data;
        },
        enabled: !!selectedStore?.id,
    });

    const toggleVisibility = useMutation({
        mutationFn: (id: string) => reviewApi.toggle(id),
        onSuccess: () => {
            toast.success('Review visibility toggled');
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const sendResponse = useMutation({
        mutationFn: ({ id, text }: { id: string; text: string }) => reviewApi.respond(id, text),
        onSuccess: () => {
            toast.success('Response posted');
            setRespondingTo(null);
            setResponseText('');
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    if (!selectedStore) {
        return <div className="p-8">Please select a store to manage reviews.</div>;
    }

    if (isLoading) return <div className="p-8">Loading reviews...</div>;

    return (
        <div className="p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <MessageSquare size={32} color="var(--primary)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Customer Reviews</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {reviews.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        No reviews found for this store.
                    </div>
                ) : (
                    reviews.map((review: any) => (
                        <div key={review.id} style={{ 
                            background: 'var(--bg-card)', 
                            padding: '1.5rem', 
                            borderRadius: 'var(--radius-lg)', 
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)',
                            opacity: review.is_visible ? 1 : 0.6
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '50%' }}>
                                        <Star size={20} color={review.rating >= 4 ? 'var(--warning)' : 'var(--text-muted)'} fill={review.rating >= 4 ? 'var(--warning)' : 'transparent'} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{review.customer_name || 'Anonymous Customer'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(review.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => toggleVisibility.mutate(review.id)}
                                        className="btn btn-ghost"
                                        style={{ color: review.is_visible ? 'var(--text-primary)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                                    >
                                        {review.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                        {review.is_visible ? 'Hide' : 'Unhide'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                                    {[1,2,3,4,5].map(s => (
                                        <Star key={s} size={14} fill={s <= review.rating ? 'var(--warning)' : 'transparent'} color={s <= review.rating ? 'var(--warning)' : 'var(--text-muted)'} />
                                    ))}
                                </div>
                                <div style={{ color: 'var(--text-primary)', fontStyle: review.comment ? 'normal' : 'italic' }}>
                                    {review.comment || 'No comment provided.'}
                                </div>
                            </div>

                            {review.store_response ? (
                                <div style={{ marginLeft: '2rem', padding: '1rem', borderLeft: '4px solid var(--primary)', background: 'var(--glass-bg)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        <Reply size={16} /> Store Response
                                    </div>
                                    <div style={{ fontSize: '0.9rem' }}>{review.store_response}</div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setRespondingTo(review)}
                                    className="btn btn-ghost"
                                    style={{ marginLeft: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)' }}
                                >
                                    <Reply size={16} /> Post Response
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {respondingTo && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', zIndex: 1000 
                }}>
                    <div style={{ 
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
                        width: '600px', border: '1px solid var(--border)' 
                    }}>
                        <h3 style={{ marginTop: 0 }}>Respond to {respondingTo.customer_name}'s Review</h3>
                        <div style={{ padding: '1rem', borderLeft: '3px solid var(--border)', background: 'var(--bg-elevated)', margin: '1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            "{respondingTo.comment}"
                        </div>
                        <textarea 
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response as the store manager..."
                            style={{ 
                                width: '100%', minHeight: '120px', padding: '1rem', 
                                borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', 
                                border: '1px solid var(--border)', color: 'var(--text-primary)',
                                outline: 'none', resize: 'vertical'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button onClick={() => { setRespondingTo(null); setResponseText(''); }} className="btn btn-ghost">Cancel</button>
                            <button 
                                disabled={!responseText.trim() || sendResponse.isPending}
                                onClick={() => sendResponse.mutate({ id: respondingTo.id, text: responseText })}
                                className="btn btn-primary"
                            >
                                {sendResponse.isPending ? 'Posting...' : 'Post Response'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
