import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { navItems } from '../config/nav';
import { customerApi, productApi } from '../services/api';
import type { IconType } from './ui/primitives';

interface Cmd {
    id: string;
    label: string;
    sub?: string;
    group: string;
    icon?: IconType;
    run: () => void;
}

/** Open the palette from anywhere: window.dispatchEvent(new Event('open-command-palette')). */
export default function CommandPalette({ role }: { role: string }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [entities, setEntities] = useState<Cmd[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Global shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
            if (e.key === 'Escape') setOpen(false);
        };
        const onOpen = () => setOpen(true);
        window.addEventListener('keydown', onKey);
        window.addEventListener('open-command-palette', onOpen);
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('open-command-palette', onOpen); };
    }, []);

    useEffect(() => {
        if (open) { setQuery(''); setActive(0); setEntities([]); setTimeout(() => inputRef.current?.focus(), 30); }
    }, [open]);

    // Live entity search (customers + products)
    useEffect(() => {
        if (!open) return;
        const q = query.trim();
        if (q.length < 2) { setEntities([]); return; }
        const t = setTimeout(async () => {
            try {
                const [custRes, prodRes] = await Promise.allSettled([
                    customerApi.list({ search: q, limit: 5 }),
                    productApi.list({ search: q, limit: 5 }),
                ]);
                const out: Cmd[] = [];
                if (custRes.status === 'fulfilled') {
                    const list = custRes.value.data?.items ?? custRes.value.data ?? [];
                    for (const c of list.slice(0, 5)) {
                        out.push({ id: `cust-${c.id}`, group: 'Customers', label: c.full_name || c.name || c.email, sub: c.email, run: () => navigate(`/customers/${c.id}`) });
                    }
                }
                if (prodRes.status === 'fulfilled') {
                    const list = prodRes.value.data?.items ?? prodRes.value.data ?? [];
                    for (const p of list.slice(0, 5)) {
                        out.push({ id: `prod-${p.id}`, group: 'Products', label: p.name, sub: p.sku, run: () => navigate('/products') });
                    }
                }
                setEntities(out);
            } catch { setEntities([]); }
        }, 250);
        return () => clearTimeout(t);
    }, [query, open, navigate]);

    const navCommands: Cmd[] = useMemo(
        () => navItems.filter((n) => n.roles.includes(role)).map((n) => ({
            id: `nav-${n.path}-${n.label}`, group: 'Go to', label: n.label, icon: n.icon, run: () => navigate(n.path),
        })),
        [role, navigate],
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const nav = q ? navCommands.filter((c) => c.label.toLowerCase().includes(q)) : navCommands;
        return [...nav, ...entities];
    }, [query, navCommands, entities]);

    useEffect(() => { setActive(0); }, [results.length]);

    if (!open) return null;

    const choose = (c?: Cmd) => { if (!c) return; setOpen(false); c.run(); };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
    };

    let lastGroup = '';
    return (
        <div className="fixed inset-0 z-[1100] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 border-b border-outline-variant">
                    <Search size={18} className="text-on-surface-variant" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search pages, customers, products…"
                        className="flex-1 h-14 bg-transparent text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none text-base"
                    />
                    <kbd className="hidden sm:inline text-[10px] font-semibold text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5">ESC</kbd>
                </div>
                <div className="max-h-[55vh] overflow-y-auto py-2">
                    {results.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-on-surface-variant">No results for “{query}”.</div>
                    ) : (
                        results.map((c, i) => {
                            const showGroup = c.group !== lastGroup; lastGroup = c.group;
                            const Icon = c.icon;
                            return (
                                <React.Fragment key={c.id}>
                                    {showGroup && <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70">{c.group}</div>}
                                    <button
                                        onMouseEnter={() => setActive(i)}
                                        onClick={() => choose(c)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${i === active ? 'bg-primary/10' : ''}`}
                                    >
                                        <span className={`shrink-0 ${i === active ? 'text-primary' : 'text-on-surface-variant'}`}>{Icon ? <Icon size={18} /> : <Search size={16} />}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm text-on-surface truncate">{c.label}</span>
                                            {c.sub && <span className="block text-xs text-on-surface-variant truncate">{c.sub}</span>}
                                        </span>
                                        {i === active && <CornerDownLeft size={14} className="text-on-surface-variant shrink-0" />}
                                    </button>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
