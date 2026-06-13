import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './primitives';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: keyof typeof SIZES;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={cn('w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl flex flex-col max-h-[90vh]', SIZES[size])}>
                {title !== undefined && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
                        <h2 className="font-headline text-lg font-bold text-on-surface">{title}</h2>
                        <button onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-on-surface transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="px-6 py-5 overflow-y-auto">{children}</div>
                {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-outline-variant">{footer}</div>}
            </div>
        </div>
    );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true, loading }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
                    <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
                </>
            }
        >
            <p className="text-sm text-on-surface-variant">{message}</p>
        </Modal>
    );
}

export function Drawer({ open, onClose, title, children, footer, width = 420 }: {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: number;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <div className={cn('fixed inset-0 z-[1000]', open ? '' : 'pointer-events-none')}>
            <div className={cn('absolute inset-0 bg-black/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
            <aside
                className={cn('absolute top-0 right-0 h-full bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col transition-transform', open ? 'translate-x-0' : 'translate-x-full')}
                style={{ width }}
            >
                {title !== undefined && (
                    <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                        <h2 className="font-headline text-lg font-bold text-on-surface">{title}</h2>
                        <button onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-on-surface"><X size={20} /></button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="px-5 py-4 border-t border-outline-variant">{footer}</div>}
            </aside>
        </div>
    );
}
