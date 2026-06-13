import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, getErrorMessage } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import toast from 'react-hot-toast';
import { MessageSquare, Star, Reply, Eye, EyeOff } from 'lucide-react';
import { PageHeader, Button, Badge, Card, StatCard, FormField, Textarea, Skeleton, EmptyState } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={14}
                    className={s <= rating ? 'text-warning' : 'text-on-surface-variant/40'}
                    fill={s <= rating ? 'currentColor' : 'none'}
                />
            ))}
        </div>
    );
}

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

    const { data: summary } = useQuery({
        queryKey: ['reviews-summary', selectedStore?.id],
        queryFn: async () => {
            if (!selectedStore?.id) return null;
            const res = await reviewApi.summary(selectedStore.id);
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
        return (
            <div>
                <PageHeader title="Customer Reviews" subtitle="Moderate and respond to customer feedback." />
                <Card className="p-0">
                    <EmptyState icon={MessageSquare} title="No store selected" message="Please select a store to manage its reviews." />
                </Card>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Customer Reviews" subtitle="Moderate and respond to customer feedback." />

            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <StatCard icon={Star} label="Average rating" value={Number(summary.average_rating ?? 0).toFixed(1)} tone="amber" />
                    <StatCard icon={MessageSquare} label="Total reviews" value={summary.total_reviews ?? 0} tone="blue" />
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-5">
                            <Skeleton className="h-5 w-48 mb-3" />
                            <Skeleton className="h-16 w-full" />
                        </Card>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <Card className="p-0">
                    <EmptyState icon={MessageSquare} title="No reviews yet" message="This store has not received any customer reviews." />
                </Card>
            ) : (
                <div className="flex flex-col gap-4">
                    {reviews.map((review: any) => (
                        <Card key={review.id} className={`p-5 ${review.is_visible ? '' : 'opacity-60'}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-11 w-11 shrink-0 rounded-full bg-surface-container flex items-center justify-center">
                                        <Star
                                            size={20}
                                            className={review.rating >= 4 ? 'text-warning' : 'text-on-surface-variant'}
                                            fill={review.rating >= 4 ? 'currentColor' : 'none'}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-on-surface truncate">{review.customer_name || 'Anonymous Customer'}</div>
                                        <div className="text-xs text-on-surface-variant">{new Date(review.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge tone={review.is_visible ? 'success' : 'neutral'} dot>{review.is_visible ? 'Visible' : 'Hidden'}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={review.is_visible ? Eye : EyeOff}
                                        onClick={() => toggleVisibility.mutate(review.id)}
                                        className={review.is_visible ? '' : 'text-error'}
                                    >
                                        {review.is_visible ? 'Hide' : 'Unhide'}
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-lg bg-surface-container-low p-4 mb-4">
                                <div className="mb-2"><Stars rating={review.rating} /></div>
                                <div className={`text-sm text-on-surface ${review.comment ? '' : 'italic text-on-surface-variant'}`}>
                                    {review.comment || 'No comment provided.'}
                                </div>
                            </div>

                            {review.store_response ? (
                                <div className="ml-6 rounded-r-lg border-l-4 border-primary bg-primary/5 px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                                        <Reply size={15} /> Store Response
                                    </div>
                                    <div className="text-sm text-on-surface">{review.store_response}</div>
                                </div>
                            ) : (
                                <div className="ml-6">
                                    <Button variant="ghost" size="sm" icon={Reply} onClick={() => setRespondingTo(review)} className="text-primary">
                                        Post Response
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                open={!!respondingTo}
                onClose={() => { setRespondingTo(null); setResponseText(''); }}
                title={respondingTo ? `Respond to ${respondingTo.customer_name || 'review'}` : 'Respond'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setRespondingTo(null); setResponseText(''); }}>Cancel</Button>
                        <Button
                            loading={sendResponse.isPending}
                            disabled={!responseText.trim()}
                            onClick={() => respondingTo && sendResponse.mutate({ id: respondingTo.id, text: responseText })}
                        >
                            Post Response
                        </Button>
                    </>
                }
            >
                {respondingTo && (
                    <>
                        <div className="rounded-lg border-l-2 border-outline-variant bg-surface-container-low px-4 py-3 mb-4 text-sm text-on-surface-variant italic">
                            "{respondingTo.comment || 'No comment provided.'}"
                        </div>
                        <FormField label="Your response">
                            <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Write your response as the store manager…"
                                className="min-h-[120px]"
                            />
                        </FormField>
                    </>
                )}
            </Modal>
        </div>
    );
}
