import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Upload, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { brandingApi, mediaApi, getErrorMessage } from '../../services/api';
import type { BrandingConfig } from '../../services/api';
import { PageHeader, Button, Card, FormField, Input } from '../../components/ui';

const DEFAULT_CFG: BrandingConfig = {
    app_name: 'Daily Grocer',
    logo_url: '',
    colors: { primary: '#001d3d', action: '#e6203a', accent: '#0056b3' },
};

type ColorKey = keyof BrandingConfig['colors'];

const PALETTE: { key: ColorKey; label: string; hint: string }[] = [
    { key: 'primary', label: 'Primary', hint: 'Brand / navy surfaces' },
    { key: 'action', label: 'Action', hint: 'Call-to-action red' },
    { key: 'accent', label: 'Accent', hint: 'Links / blue' },
];

export default function BrandingPage() {
    const queryClient = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [cfg, setCfg] = useState<BrandingConfig>(DEFAULT_CFG);
    const [uploading, setUploading] = useState(false);

    const { data, isLoading } = useQuery({ queryKey: ['branding'], queryFn: () => brandingApi.get() });
    useEffect(() => {
        if (data?.data) {
            setCfg({
                app_name: data.data.app_name ?? DEFAULT_CFG.app_name,
                logo_url: data.data.logo_url ?? '',
                colors: { ...DEFAULT_CFG.colors, ...(data.data.colors ?? {}) },
            });
        }
    }, [data]);

    const saveMut = useMutation({
        mutationFn: () => brandingApi.save(cfg),
        onSuccess: () => {
            toast.success('Branding saved — live within a couple of minutes');
            queryClient.invalidateQueries({ queryKey: ['branding'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });

    const setColor = (key: ColorKey, value: string) =>
        setCfg((c) => ({ ...c, colors: { ...c.colors, [key]: value } }));

    const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const res = await mediaApi.uploadImage(file, 'branding');
            setCfg((c) => ({ ...c, logo_url: res.data.url }));
        } catch (err) {
            toast.error(getErrorMessage(err, 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-on-surface-variant">Loading…</div>;

    const checkered =
        'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 16px 16px';

    return (
        <div>
            <PageHeader
                title="Branding & Theme"
                subtitle="Set the brand name, logo and palette. Changes recolor the storefront and mobile app live — no deploy needed."
                actions={<Button icon={Save} onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button>}
            />

            <div className="space-y-6">
                {/* Live preview */}
                <Card className="p-5">
                    <h3 className="font-headline font-bold text-on-surface mb-1">Live preview</h3>
                    <p className="text-sm text-on-surface-variant mb-4">A mini storefront header using the colors you pick.</p>
                    <div className="rounded-lg overflow-hidden border border-outline-variant max-w-md">
                        <div
                            className="flex items-center h-14 px-4"
                            style={{ backgroundColor: cfg.colors.primary }}
                        >
                            {cfg.logo_url
                                ? <img src={cfg.logo_url} alt="" className="h-8 w-auto object-contain" />
                                : <span className="font-headline font-bold text-lg" style={{ color: '#ffffff' }}>{cfg.app_name || 'Daily Grocer'}</span>}
                        </div>
                        <div className="bg-surface-container-lowest p-4 flex items-center gap-4">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-semibold text-white"
                                style={{ backgroundColor: cfg.colors.action }}
                            >
                                Add to cart
                            </button>
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium hover:underline" style={{ color: cfg.colors.accent }}>
                                View details
                            </a>
                        </div>
                    </div>
                </Card>

                {/* Identity */}
                <Card className="p-5">
                    <h3 className="font-headline font-bold text-on-surface mb-4">Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                        <FormField label="App name">
                            <Input
                                value={cfg.app_name}
                                onChange={(e) => setCfg((c) => ({ ...c, app_name: e.target.value }))}
                                placeholder="Daily Grocer"
                            />
                        </FormField>

                        <FormField label="Logo">
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
                            <div className="flex items-center gap-4">
                                {cfg.logo_url ? (
                                    <div
                                        className="h-16 w-16 rounded-md border border-outline-variant flex items-center justify-center p-1 shrink-0"
                                        style={{ background: checkered }}
                                    >
                                        <img src={cfg.logo_url} alt="logo preview" className="max-h-full max-w-full object-contain" />
                                    </div>
                                ) : null}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={uploading ? Loader2 : Upload}
                                        disabled={uploading}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {uploading ? 'Uploading…' : cfg.logo_url ? 'Replace' : 'Upload logo'}
                                    </Button>
                                    {cfg.logo_url && !uploading && (
                                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setCfg((c) => ({ ...c, logo_url: '' }))}>
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </FormField>
                    </div>
                </Card>

                {/* Palette */}
                <Card className="p-5">
                    <h3 className="font-headline font-bold text-on-surface mb-4">Palette</h3>
                    <div className="space-y-4 max-w-lg">
                        {PALETTE.map(({ key, label, hint }) => (
                            <div key={key}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        aria-label={`${label} color`}
                                        value={cfg.colors[key]}
                                        onChange={(e) => setColor(key, e.target.value)}
                                        className="h-10 w-12 rounded-md border border-outline-variant cursor-pointer bg-transparent p-0.5"
                                    />
                                    <div className="w-32 shrink-0">
                                        <span className="text-sm font-medium text-on-surface">{label}</span>
                                    </div>
                                    <Input
                                        value={cfg.colors[key]}
                                        onChange={(e) => setColor(key, e.target.value)}
                                        placeholder="#000000"
                                        className="max-w-[140px] font-mono"
                                    />
                                </div>
                                <p className="text-xs text-on-surface-variant mt-1">{hint}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-outline-variant">
                        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setCfg(DEFAULT_CFG)}>
                            Reset to defaults
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
