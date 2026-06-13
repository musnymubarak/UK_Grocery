import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Megaphone, X } from 'lucide-react';
import { announcementApi, getErrorMessage, type AnnouncementConfig } from '../../services/api';
import { PageHeader, Button, Card, FormField, Input, Select, Toggle } from '../../components/ui';

const DEFAULT: AnnouncementConfig = {
    enabled: false,
    message: '',
    link_url: '',
    link_label: '',
    variant: 'info',
    dismissible: true,
    starts_at: null,
    ends_at: null,
};

const VARIANTS: { value: AnnouncementConfig['variant']; label: string }[] = [
    { value: 'info', label: 'Info (blue)' },
    { value: 'success', label: 'Success (green)' },
    { value: 'warning', label: 'Warning (amber)' },
    { value: 'promo', label: 'Promo (red)' },
];

const PREVIEW_STYLE: Record<string, string> = {
    info: 'bg-info text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-on-surface',
    promo: 'bg-action-red text-white',
};

/** ISO (UTC, stored) <-> datetime-local input string (admin's local time). */
function isoToLocalInput(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function localInputToIso(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function AnnouncementBarPage() {
    const [cfg, setCfg] = useState<AnnouncementConfig>(DEFAULT);

    const { data, isLoading } = useQuery({ queryKey: ['announcement'], queryFn: async () => (await announcementApi.get()).data });
    useEffect(() => { if (data) setCfg({ ...DEFAULT, ...data }); }, [data]);

    const saveMut = useMutation({
        mutationFn: () => announcementApi.save(cfg),
        onSuccess: () => toast.success('Announcement saved — live on the storefront within a couple of minutes'),
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });

    const set = (patch: Partial<AnnouncementConfig>) => setCfg((c) => ({ ...c, ...patch }));

    if (isLoading) return <div className="p-8 text-on-surface-variant">Loading…</div>;

    const previewStyle = PREVIEW_STYLE[cfg.variant] ?? PREVIEW_STYLE.info;

    return (
        <div>
            <PageHeader
                title="Announcement Bar"
                subtitle="A promo strip shown at the top of every storefront and mobile page. Toggle it on, schedule it, and it goes live without a deploy."
                actions={<Button icon={Save} onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save changes</Button>}
            />

            {/* Live preview */}
            <div className="mb-6">
                <div className="text-xs font-semibold text-on-surface-variant mb-2">Live preview</div>
                {cfg.enabled && cfg.message.trim() ? (
                    <div className={`${previewStyle} rounded-lg text-sm font-semibold`}>
                        <div className="flex items-center justify-center gap-3 px-10 py-2 relative flex-wrap text-center">
                            <span>{cfg.message}</span>
                            {cfg.link_url && <span className="underline font-bold">{cfg.link_label || 'Learn more'} →</span>}
                            {cfg.dismissible && <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2" strokeWidth={2.5} />}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-outline-variant px-4 py-3 text-sm text-on-surface-variant text-center">
                        {cfg.enabled ? 'Add a message to preview the bar.' : 'Bar is off — turn it on to show it to customers.'}
                    </div>
                )}
            </div>

            <Card className="p-5 max-w-3xl">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Megaphone size={20} /></div>
                        <div>
                            <div className="font-headline font-bold text-on-surface">Show announcement bar</div>
                            <div className="text-xs text-on-surface-variant">Master switch for the storefront + mobile strip.</div>
                        </div>
                    </div>
                    <Toggle checked={cfg.enabled} onChange={(v) => set({ enabled: v })} label="Enable announcement" />
                </div>

                <FormField label="Message" hint="Keep it short — one line reads best on mobile.">
                    <Input value={cfg.message} onChange={(e) => set({ message: e.target.value })} placeholder="🚚 Free delivery this weekend on orders over £30" />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                    <FormField label="Link URL" hint="Internal path (/offers) or full URL (https://…). Leave blank for no button.">
                        <Input value={cfg.link_url} onChange={(e) => set({ link_url: e.target.value })} placeholder="/offers" />
                    </FormField>
                    <FormField label="Button label">
                        <Input value={cfg.link_label} onChange={(e) => set({ link_label: e.target.value })} placeholder="Shop offers" />
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                    <FormField label="Style">
                        <Select value={cfg.variant} onChange={(e) => set({ variant: e.target.value as AnnouncementConfig['variant'] })}>
                            {VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="Dismissible">
                        <div className="h-10 flex items-center gap-3">
                            <Toggle checked={cfg.dismissible} onChange={(v) => set({ dismissible: v })} label="Allow dismiss" />
                            <span className="text-sm text-on-surface-variant">Let customers close the bar</span>
                        </div>
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                    <FormField label="Starts at" hint="Optional. Bar hides until this time (your local time).">
                        <Input type="datetime-local" value={isoToLocalInput(cfg.starts_at)} onChange={(e) => set({ starts_at: localInputToIso(e.target.value) })} />
                    </FormField>
                    <FormField label="Ends at" hint="Optional. Bar auto-hides after this time.">
                        <Input type="datetime-local" value={isoToLocalInput(cfg.ends_at)} onChange={(e) => set({ ends_at: localInputToIso(e.target.value) })} />
                    </FormField>
                </div>
            </Card>
        </div>
    );
}
