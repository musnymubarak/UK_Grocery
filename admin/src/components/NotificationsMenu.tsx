import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationAdminApi } from '../services/api';

interface Note { id: string; title?: string; body?: string; notification_type?: string; created_at?: string }

export default function NotificationsMenu() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await notificationAdminApi.recent(20);
            const list = res.data?.items ?? res.data ?? [];
            setItems(Array.isArray(list) ? list : []);
        } catch { /* non-fatal */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        if (!open) return;
        load();
        const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const hasRecent = items.length > 0;

    return (
        <div className="relative" ref={ref}>
            <button
                aria-label="Notifications"
                onClick={() => setOpen((o) => !o)}
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-on-surface-variant border border-outline-variant bg-surface-container-lowest hover:bg-surface-container hover:text-on-surface transition-colors"
            >
                <Bell size={18} />
                {hasRecent && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-action-red ring-2 ring-surface-container-lowest" />}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface-container-lowest border border-outline-variant rounded-lg shadow-2xl z-[1000] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                        <span className="font-headline font-bold text-on-surface">Notifications</span>
                        <button onClick={() => { setOpen(false); navigate('/notifications'); }} className="text-xs font-semibold text-action-blue hover:underline">View all</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-sm text-on-surface-variant">Loading…</div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-on-surface-variant">
                                <Inbox size={32} className="opacity-50 mb-2" />
                                <span className="text-sm">You're all caught up</span>
                            </div>
                        ) : (
                            items.map((n) => (
                                <div key={n.id} className="px-4 py-3 border-b border-outline-variant/60 last:border-0 hover:bg-surface-container-low">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-on-surface">{n.title || n.notification_type || 'Notification'}</p>
                                        {n.created_at && <span className="text-[11px] text-on-surface-variant shrink-0">{safeAgo(n.created_at)}</span>}
                                    </div>
                                    {n.body && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function safeAgo(iso: string): string {
    try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ''; }
}
