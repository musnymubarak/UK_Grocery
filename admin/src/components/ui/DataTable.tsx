import React, { useMemo, useState } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, Inbox } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Skeleton, EmptyState, Button } from './primitives';

export interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    /** Plain value for sorting + CSV export (defaults to row[key]). */
    accessor?: (row: T) => string | number | null | undefined;
    sortable?: boolean;
    align?: 'left' | 'right' | 'center';
    className?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    rowKey: (row: T) => string;
    loading?: boolean;
    /** Client-side search across these accessors. */
    searchKeys?: Array<(row: T) => string | null | undefined>;
    searchPlaceholder?: string;
    /** Extra filter controls rendered in the toolbar. */
    toolbar?: React.ReactNode;
    pageSize?: number;
    selectable?: boolean;
    bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
    onRowClick?: (row: T) => void;
    /** Enables a CSV export button of the (filtered) rows. */
    exportFilename?: string;
    emptyTitle?: string;
    emptyMessage?: string;
}

function val(v: unknown): string | number {
    if (v == null) return '';
    if (typeof v === 'number') return v;
    return String(v);
}

export function DataTable<T>({
    data,
    columns,
    rowKey,
    loading,
    searchKeys,
    searchPlaceholder = 'Search…',
    toolbar,
    pageSize = 12,
    selectable,
    bulkActions,
    onRowClick,
    exportFilename,
    emptyTitle = 'Nothing here yet',
    emptyMessage,
}: DataTableProps<T>) {
    const [query, setQuery] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const accessorFor = (col: Column<T>) => col.accessor ?? ((row: T) => (row as Record<string, unknown>)[col.key] as never);

    const filtered = useMemo(() => {
        let rows = data;
        if (query && searchKeys?.length) {
            const q = query.toLowerCase();
            rows = rows.filter((r) => searchKeys.some((k) => (k(r) ?? '').toString().toLowerCase().includes(q)));
        }
        if (sortKey) {
            const col = columns.find((c) => c.key === sortKey);
            if (col) {
                const acc = accessorFor(col);
                rows = [...rows].sort((a, b) => {
                    const av = val(acc(a)); const bv = val(acc(b));
                    if (av < bv) return sortDir === 'asc' ? -1 : 1;
                    if (av > bv) return sortDir === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        }
        return rows;
    }, [data, query, searchKeys, sortKey, sortDir, columns]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

    const toggleSort = (col: Column<T>) => {
        if (!col.sortable) return;
        if (sortKey === col.key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(col.key); setSortDir('asc'); }
    };

    const clearSel = () => setSelected(new Set());
    const toggleRow = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const pageIds = pageRows.map(rowKey);
    const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const toggleAll = () => setSelected((s) => {
        const n = new Set(s);
        if (allOnPage) pageIds.forEach((id) => n.delete(id)); else pageIds.forEach((id) => n.add(id));
        return n;
    });

    const selectedRows = filtered.filter((r) => selected.has(rowKey(r)));

    const exportCsv = () => {
        const headers = columns.map((c) => c.header);
        const lines = [headers.join(',')];
        for (const r of filtered) {
            const cells = columns.map((c) => {
                const raw = val(accessorFor(c)(r)).toString().replace(/"/g, '""');
                return /[",\n]/.test(raw) ? `"${raw}"` : raw;
            });
            lines.push(cells.join(','));
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${exportFilename}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const colSpan = columns.length + (selectable ? 1 : 0);

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                {searchKeys?.length ? (
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                            placeholder={searchPlaceholder}
                            className="w-full h-10 pl-9 pr-3 rounded-md bg-surface-container-lowest border border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-action-blue focus:ring-2 focus:ring-action-blue/20"
                        />
                    </div>
                ) : null}
                <div className="flex items-center gap-2 ml-auto">
                    {toolbar}
                    {exportFilename && (
                        <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={!filtered.length}>Export</Button>
                    )}
                </div>
            </div>

            {/* Bulk bar */}
            {selectable && selected.size > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-md bg-primary/10 border border-primary/20">
                    <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
                    <div className="flex items-center gap-2">
                        {bulkActions?.(selectedRows, clearSel)}
                        <Button variant="ghost" size="sm" onClick={clearSel}>Clear</Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest elev-card">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low/70">
                            {selectable && (
                                <th className="w-10 px-4 py-3">
                                    <input type="checkbox" checked={allOnPage} onChange={toggleAll} className="accent-action-blue cursor-pointer" aria-label="Select all on page" />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => toggleSort(col)}
                                    className={cn(
                                        'px-4 py-3 text-xs font-bold uppercase tracking-wide text-on-surface-variant whitespace-nowrap',
                                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                                        col.sortable && 'cursor-pointer select-none hover:text-on-surface',
                                    )}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="border-t border-outline-variant">
                                    {selectable && <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>}
                                    {columns.map((c) => <td key={c.key} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>)}
                                </tr>
                            ))
                        ) : pageRows.length === 0 ? (
                            <tr><td colSpan={colSpan}><EmptyState icon={Inbox} title={emptyTitle} message={emptyMessage} /></td></tr>
                        ) : (
                            pageRows.map((row) => {
                                const id = rowKey(row);
                                return (
                                    <tr
                                        key={id}
                                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                                        className={cn('border-t border-outline-variant transition-colors hover:bg-surface-container-low', onRowClick && 'cursor-pointer', selected.has(id) && 'bg-primary/5')}
                                    >
                                        {selectable && (
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={selected.has(id)} onChange={() => toggleRow(id)} className="accent-action-blue cursor-pointer" aria-label="Select row" />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key} className={cn('px-4 py-3 text-sm text-on-surface', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left', col.className)}>
                                                {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
                <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>
                        {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-outline-variant disabled:opacity-40 hover:bg-surface-container disabled:hover:bg-transparent"><ChevronLeft size={16} /></button>
                        <span className="px-2">Page {safePage + 1} / {pageCount}</span>
                        <button disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-outline-variant disabled:opacity-40 hover:bg-surface-container disabled:hover:bg-transparent"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}
