/**
 * Home Layout builder — manages the server-driven home layout sections.
 * List ordered by position, reorder via up/down arrows, create/edit/delete sections.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeLayoutApi, getErrorMessage } from '../../services/api';
import type { HomeSection, HomeSectionType } from '../../types';
import SectionEditorModal from './SectionEditorModal';
import toast from 'react-hot-toast';
import {
    LayoutGrid,
    Plus,
    Trash2,
    Edit2,
    ToggleLeft,
    ToggleRight,
    ChevronUp,
    ChevronDown,
    Clock,
    X,
} from 'lucide-react';

const TYPE_META: Record<HomeSectionType, { label: string; color: string }> = {
    hero_slider: { label: 'Hero Slider', color: 'var(--primary)' },
    banner_strip: { label: 'Banner Strip', color: '#0ea5e9' },
    product_carousel: { label: 'Product Carousel', color: '#8b5cf6' },
    category_grid: { label: 'Category Grid', color: '#f59e0b' },
    promo_grid: { label: 'Promo Grid', color: '#ec4899' },
};

const SECTION_TYPES: HomeSectionType[] = ['hero_slider', 'banner_strip', 'product_carousel', 'category_grid', 'promo_grid'];

function formatWindow(starts?: string | null, ends?: string | null): string | null {
    if (!starts && !ends) return null;
    const fmt = (s: string) => {
        const d = new Date(s);
        return isNaN(d.getTime()) ? s : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    };
    if (starts && ends) return `${fmt(starts)} → ${fmt(ends)}`;
    if (starts) return `From ${fmt(starts)}`;
    return `Until ${fmt(ends!)}`;
}

export default function HomeLayoutPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<(Partial<HomeSection> & { section_type: HomeSectionType }) | null>(null);
    const [showTypePicker, setShowTypePicker] = useState(false);

    const { data: sections = [], isLoading } = useQuery({
        queryKey: ['home-layout', 'sections'],
        queryFn: async () => {
            const res = await homeLayoutApi.list();
            const list = (res.data || []) as HomeSection[];
            return [...list].sort((a, b) => a.position - b.position);
        },
    });

    const createSection = useMutation({
        mutationFn: (data: any) => homeLayoutApi.create(data),
        onSuccess: () => {
            toast.success('Section created');
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['home-layout'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const updateSection = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => homeLayoutApi.update(id, data),
        onSuccess: () => {
            toast.success('Section updated');
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['home-layout'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteSection = useMutation({
        mutationFn: (id: string) => homeLayoutApi.delete(id),
        onSuccess: () => {
            toast.success('Section removed');
            queryClient.invalidateQueries({ queryKey: ['home-layout'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const reorderSections = useMutation({
        mutationFn: (orderedIds: string[]) => homeLayoutApi.reorder(orderedIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['home-layout'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    // Toggle active without opening the editor — send full config back.
    const toggleActive = (section: HomeSection) => {
        updateSection.mutate({ id: section.id, data: { is_active: !section.is_active } });
    };

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= sections.length) return;
        const ids = sections.map((s) => s.id);
        [ids[index], ids[target]] = [ids[target], ids[index]];
        reorderSections.mutate(ids);
    };

    const handleSubmit = (payload: any, id?: string) => {
        if (id) updateSection.mutate({ id, data: payload });
        else createSection.mutate(payload);
    };

    const startCreate = (type: HomeSectionType) => {
        setShowTypePicker(false);
        setEditing({ section_type: type, is_active: true });
    };

    if (isLoading) return <div className="p-8">Loading home layout...</div>;

    return (
        <div className="p-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LayoutGrid size={32} color="var(--primary)" />
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Home Layout</h2>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Server-driven storefront & app home sections, in display order
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowTypePicker(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Add Section
                </button>
            </div>

            {sections.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border)',
                    }}
                >
                    No home sections yet. Click "Add Section" to build your home layout.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sections.map((section, idx) => {
                        const meta = TYPE_META[section.section_type] || { label: section.section_type, color: 'var(--text-muted)' };
                        const windowLabel = formatWindow(section.starts_at, section.ends_at);
                        const itemCount = Array.isArray(section.config?.items) ? section.config.items.length : null;
                        return (
                            <div
                                key={section.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                    opacity: section.is_active ? 1 : 0.6,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                {/* Reorder controls */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        padding: '0 0.5rem',
                                        borderRight: '1px solid var(--border)',
                                        background: 'var(--bg-elevated)',
                                    }}
                                >
                                    <button
                                        onClick={() => move(idx, -1)}
                                        disabled={idx === 0 || reorderSections.isPending}
                                        title="Move up"
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                            color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                            opacity: idx === 0 ? 0.4 : 1,
                                        }}
                                    >
                                        <ChevronUp size={18} />
                                    </button>
                                    <span style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                        {section.position}
                                    </span>
                                    <button
                                        onClick={() => move(idx, 1)}
                                        disabled={idx === sections.length - 1 || reorderSections.isPending}
                                        title="Move down"
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer',
                                            color: idx === sections.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                            opacity: idx === sections.length - 1 ? 0.4 : 1,
                                        }}
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div style={{ flex: 1, padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.03em',
                                                color: '#fff',
                                                background: meta.color,
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '999px',
                                            }}
                                        >
                                            {meta.label}
                                        </span>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                                            {section.title || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Untitled</span>}
                                        </h3>
                                        {itemCount != null && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {itemCount} item{itemCount === 1 ? '' : 's'}
                                            </span>
                                        )}
                                    </div>
                                    {section.subtitle && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{section.subtitle}</div>
                                    )}
                                    {windowLabel && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={13} /> {windowLabel}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.25rem' }}>
                                    <button
                                        onClick={() => toggleActive(section)}
                                        title={section.is_active ? 'Active' : 'Inactive'}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: section.is_active ? 'var(--success)' : 'var(--text-muted)' }}
                                    >
                                        {section.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                    </button>
                                    <button
                                        onClick={() => setEditing(section)}
                                        className="btn-icon"
                                        title="Edit"
                                        style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--border)', cursor: 'pointer' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this section?')) deleteSection.mutate(section.id);
                                        }}
                                        title="Delete"
                                        style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--danger)' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== Type picker ===== */}
            {showTypePicker && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '480px', maxWidth: '100%', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Choose a section type</h3>
                            <button onClick={() => setShowTypePicker(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {SECTION_TYPES.map((t) => {
                                const meta = TYPE_META[t];
                                return (
                                    <button
                                        key={t}
                                        onClick={() => startCreate(t)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-elevated)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                                        {meta.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Section editor ===== */}
            {editing && (
                <SectionEditorModal
                    section={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={handleSubmit}
                    isSaving={createSection.isPending || updateSection.isPending}
                />
            )}
        </div>
    );
}
