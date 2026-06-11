/**
 * Section editor modal for the server-driven Home Layout builder.
 * Authors the per-type `config` JSON and submits create/update.
 */
import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi, categoryApi, mediaApi, getErrorMessage } from '../../services/api';
import type { HomeSection, HomeSectionType, SectionItem, SectionAction, Store, Category } from '../../types';
import { CustomSelect } from '../../components/CustomSelect';
import { Plus, Trash2, Upload, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_LABELS: Record<HomeSectionType, string> = {
    hero_slider: 'Hero Slider',
    banner_strip: 'Banner Strip',
    product_carousel: 'Product Carousel',
    category_grid: 'Category Grid',
    promo_grid: 'Promo Grid',
};

const ACTION_TYPES: { value: string; label: string }[] = [
    { value: 'none', label: 'No action' },
    { value: 'category', label: 'Open category' },
    { value: 'product', label: 'Open product' },
    { value: 'search', label: 'Search query' },
    { value: 'offers', label: 'Offers page' },
    { value: 'url', label: 'External URL' },
];

const SOURCE_TYPES: { value: string; label: string }[] = [
    { value: 'latest', label: 'Latest products' },
    { value: 'category', label: 'By category' },
    { value: 'ids', label: 'Specific IDs' },
    { value: 'offers', label: 'On offer' },
    { value: 'search', label: 'Search query' },
];

const AUTH_OPTIONS: { value: string; label: string }[] = [
    { value: 'any', label: 'Anyone' },
    { value: 'guest', label: 'Guests only' },
    { value: 'customer', label: 'Logged-in customers' },
];

const ITEM_TYPES: HomeSectionType[] = ['hero_slider', 'banner_strip', 'promo_grid'];

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-input, var(--bg-elevated))',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary, var(--text-muted))',
};

function emptyItem(): SectionItem {
    return { image_url: '', title: '', subtitle: '', badge: '', action: { type: 'none', value: '' } };
}

interface Props {
    section: Partial<HomeSection> & { section_type: HomeSectionType };
    onClose: () => void;
    onSubmit: (payload: any, id?: string) => void;
    isSaving?: boolean;
}

export default function SectionEditorModal({ section, onClose, onSubmit, isSaving }: Props) {
    const type = section.section_type;
    const cfg: any = section.config || {};

    // --- Common fields ---
    const [title, setTitle] = useState<string>(section.title || '');
    const [subtitle, setSubtitle] = useState<string>(section.subtitle || '');
    const [storeId, setStoreId] = useState<string>(section.store_id || '');
    const [isActive, setIsActive] = useState<boolean>(section.is_active ?? true);
    const [startsAt, setStartsAt] = useState<string>(toLocalInput(section.starts_at));
    const [endsAt, setEndsAt] = useState<string>(toLocalInput(section.ends_at));
    const [platforms, setPlatforms] = useState<string[]>(
        Array.isArray(section.platforms) ? section.platforms : ['web', 'ios', 'android']
    );
    const [auth, setAuth] = useState<string>(section.audience?.auth || 'any');

    // --- Item-based config (hero_slider/banner_strip/promo_grid) ---
    const [autoplay, setAutoplay] = useState<boolean>(cfg.autoplay ?? true);
    const [intervalMs, setIntervalMs] = useState<string>(String(cfg.interval_ms ?? 5000));
    const [itemColumns, setItemColumns] = useState<string>(cfg.columns != null ? String(cfg.columns) : '');
    const [items, setItems] = useState<SectionItem[]>(
        Array.isArray(cfg.items) && cfg.items.length > 0
            ? cfg.items.map((it: any) => ({
                  image_url: it.image_url || '',
                  title: it.title || '',
                  subtitle: it.subtitle || '',
                  badge: it.badge || '',
                  action: it.action ? { type: it.action.type || 'none', value: it.action.value || '' } : { type: 'none', value: '' },
              }))
            : [emptyItem()]
    );

    // --- product_carousel config ---
    const [sourceType, setSourceType] = useState<string>(cfg.source?.type || 'latest');
    const [sourceValue, setSourceValue] = useState<string>(cfg.source?.value || '');
    const [sourceLimit, setSourceLimit] = useState<string>(cfg.source?.limit != null ? String(cfg.source.limit) : '10');
    const [seeAllType, setSeeAllType] = useState<string>(cfg.see_all?.type || 'none');
    const [seeAllValue, setSeeAllValue] = useState<string>(cfg.see_all?.value || '');

    // --- category_grid config ---
    const [gridColumns, setGridColumns] = useState<string>(cfg.columns != null ? String(cfg.columns) : '4');
    const [categoryIds, setCategoryIds] = useState<string[]>(Array.isArray(cfg.category_ids) ? cfg.category_ids : []);

    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: async () => {
            const res = await storeApi.list();
            const data = res.data;
            return (Array.isArray(data) ? data : data?.items ?? []) as Store[];
        },
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await categoryApi.list();
            return (res.data || []) as Category[];
        },
        enabled: type === 'category_grid',
    });

    // ---- Item editor helpers ----
    const updateItem = (idx: number, patch: Partial<SectionItem>) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };
    const updateItemAction = (idx: number, patch: Partial<SectionAction>) => {
        setItems((prev) =>
            prev.map((it, i) =>
                i === idx ? { ...it, action: { ...(it.action || { type: 'none', value: '' }), ...patch } } : it
            )
        );
    };
    const addItem = () => setItems((prev) => [...prev, emptyItem()]);
    const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

    const handleSlideUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image too large (max 5MB)');
            return;
        }
        setUploadingIdx(idx);
        try {
            const res = await mediaApi.uploadImage(file, 'home');
            updateItem(idx, { image_url: res.data.url });
            toast.success('Image uploaded');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Upload failed'));
        } finally {
            setUploadingIdx(null);
            if (fileInputRefs.current[idx]) fileInputRefs.current[idx]!.value = '';
        }
    };

    const toggleCategory = (id: string) => {
        setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    };

    const buildConfig = (): Record<string, any> => {
        if (ITEM_TYPES.includes(type)) {
            const config: Record<string, any> = {
                autoplay,
                interval_ms: parseInt(intervalMs, 10) || 5000,
                items: items.map((it) => ({
                    image_url: it.image_url || null,
                    title: it.title || null,
                    subtitle: it.subtitle || null,
                    badge: it.badge || null,
                    action:
                        it.action && it.action.type && it.action.type !== 'none'
                            ? { type: it.action.type, value: it.action.value || null }
                            : { type: 'none', value: null },
                })),
            };
            if (itemColumns !== '') config.columns = parseInt(itemColumns, 10) || null;
            return config;
        }
        if (type === 'product_carousel') {
            const source: Record<string, any> = { type: sourceType };
            if (sourceValue) source.value = sourceValue;
            source.limit = parseInt(sourceLimit, 10) || 10;
            const config: Record<string, any> = { source };
            if (seeAllType && seeAllType !== 'none') {
                config.see_all = { type: seeAllType, value: seeAllValue || null };
            }
            return config;
        }
        if (type === 'category_grid') {
            const config: Record<string, any> = { columns: parseInt(gridColumns, 10) || 4 };
            if (categoryIds.length > 0) config.category_ids = categoryIds;
            return config;
        }
        return {};
    };

    const handleSubmit = () => {
        const payload: any = {
            section_type: type,
            title: title || null,
            subtitle: subtitle || null,
            is_active: isActive,
            starts_at: startsAt ? new Date(startsAt).toISOString() : null,
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            platforms: platforms.length > 0 ? platforms : null,
            audience: { auth },
            store_id: storeId || null,
            config: buildConfig(),
        };
        onSubmit(payload, section.id);
    };

    const togglePlatform = (p: string) => {
        setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
    };

    return (
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
                padding: '1.5rem',
            }}
        >
            <div
                style={{
                    background: 'var(--bg-card)',
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    width: '720px',
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>
                        {section.id ? 'Edit' : 'New'} {TYPE_LABELS[type]}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ===== Common fields ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Title</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Subtitle</label>
                            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Store (blank = all stores / global)</label>
                            <CustomSelect
                                options={[{ value: '', label: 'Global (all stores)' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]}
                                value={storeId}
                                onChange={(v) => setStoreId(String(v))}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Audience</label>
                            <CustomSelect options={AUTH_OPTIONS} value={auth} onChange={(v) => setAuth(String(v))} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Starts at</label>
                            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Ends at</label>
                            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div>
                            <label style={labelStyle}>Platforms</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {['web', 'ios', 'android'].map((p) => (
                                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={platforms.includes(p)}
                                            onChange={() => togglePlatform(p)}
                                            style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                                        />
                                        {p}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1.2rem' }}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            Active
                        </label>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

                {/* ===== Type-specific config ===== */}
                {ITEM_TYPES.includes(type) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1.4rem' }}>
                                <input
                                    type="checkbox"
                                    checked={autoplay}
                                    onChange={(e) => setAutoplay(e.target.checked)}
                                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                                Autoplay
                            </label>
                            <div>
                                <label style={labelStyle}>Interval (ms)</label>
                                <input type="number" value={intervalMs} onChange={(e) => setIntervalMs(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Columns (optional)</label>
                                <input type="number" value={itemColumns} onChange={(e) => setItemColumns(e.target.value)} placeholder="auto" style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Slides ({items.length})</h4>
                            <button onClick={addItem} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Plus size={14} /> Add Slide
                            </button>
                        </div>

                        {items.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    background: 'var(--bg-elevated)',
                                    display: 'flex',
                                    gap: '1rem',
                                }}
                            >
                                {/* Image */}
                                <div style={{ width: 120, flexShrink: 0 }}>
                                    <div
                                        style={{
                                            width: 120,
                                            height: 80,
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <ImageIcon size={28} style={{ opacity: 0.3 }} />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={(el) => {
                                            fileInputRefs.current[idx] = el;
                                        }}
                                        onChange={(e) => handleSlideUpload(idx, e)}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => fileInputRefs.current[idx]?.click()}
                                        disabled={uploadingIdx === idx}
                                        style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                                    >
                                        <Upload size={12} /> {uploadingIdx === idx ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>

                                {/* Fields */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <input
                                        value={item.image_url || ''}
                                        onChange={(e) => updateItem(idx, { image_url: e.target.value })}
                                        placeholder="Image URL (or upload)"
                                        style={{ ...inputStyle, fontSize: '0.8rem' }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                        <input value={item.title || ''} onChange={(e) => updateItem(idx, { title: e.target.value })} placeholder="Title" style={inputStyle} />
                                        <input value={item.badge || ''} onChange={(e) => updateItem(idx, { badge: e.target.value })} placeholder="Badge" style={inputStyle} />
                                    </div>
                                    <input value={item.subtitle || ''} onChange={(e) => updateItem(idx, { subtitle: e.target.value })} placeholder="Subtitle" style={inputStyle} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.6rem' }}>
                                        <CustomSelect
                                            options={ACTION_TYPES}
                                            value={item.action?.type || 'none'}
                                            onChange={(v) => updateItemAction(idx, { type: String(v) as SectionAction['type'] })}
                                        />
                                        <input
                                            value={item.action?.value || ''}
                                            onChange={(e) => updateItemAction(idx, { value: e.target.value })}
                                            placeholder={actionValuePlaceholder(item.action?.type)}
                                            disabled={!item.action || item.action.type === 'none' || item.action.type === 'offers'}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeItem(idx)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', alignSelf: 'flex-start' }}
                                    title="Remove slide"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {type === 'product_carousel' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Source</label>
                                <CustomSelect options={SOURCE_TYPES} value={sourceType} onChange={(v) => setSourceType(String(v))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Source value</label>
                                <input
                                    value={sourceValue}
                                    onChange={(e) => setSourceValue(e.target.value)}
                                    placeholder={sourceValuePlaceholder(sourceType)}
                                    disabled={sourceType === 'latest' || sourceType === 'offers'}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Limit</label>
                                <input type="number" value={sourceLimit} onChange={(e) => setSourceLimit(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>"See all" action (optional)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.6rem' }}>
                                <CustomSelect options={ACTION_TYPES} value={seeAllType} onChange={(v) => setSeeAllType(String(v))} />
                                <input
                                    value={seeAllValue}
                                    onChange={(e) => setSeeAllValue(e.target.value)}
                                    placeholder={actionValuePlaceholder(seeAllType)}
                                    disabled={seeAllType === 'none' || seeAllType === 'offers'}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {type === 'category_grid' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ maxWidth: 200 }}>
                            <label style={labelStyle}>Columns</label>
                            <input type="number" value={gridColumns} onChange={(e) => setGridColumns(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Categories (blank = all top-level)</label>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '0.5rem',
                                    maxHeight: 220,
                                    overflowY: 'auto',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem',
                                    background: 'var(--bg-elevated)',
                                }}
                            >
                                {categories.length === 0 ? (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No categories</div>
                                ) : (
                                    categories.map((c) => (
                                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={categoryIds.includes(c.id)}
                                                onChange={() => toggleCategory(c.id)}
                                                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                                            />
                                            {c.name}
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== Footer ===== */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button onClick={onClose} className="btn btn-ghost">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={isSaving}>
                        {section.id ? 'Save Changes' : 'Create Section'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function toLocalInput(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // Build a yyyy-MM-ddTHH:mm string in local time for datetime-local input
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function actionValuePlaceholder(type?: string): string {
    switch (type) {
        case 'category':
            return 'Category ID';
        case 'product':
            return 'Product ID';
        case 'search':
            return 'Search query';
        case 'url':
            return 'https://...';
        default:
            return '';
    }
}

function sourceValuePlaceholder(type: string): string {
    switch (type) {
        case 'category':
            return 'Category ID';
        case 'ids':
            return 'Comma-separated product IDs';
        case 'search':
            return 'Search query';
        default:
            return 'n/a';
    }
}
