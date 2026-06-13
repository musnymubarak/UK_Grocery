import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, ShieldCheck } from 'lucide-react';
import { roleApi, getErrorMessage } from '../../services/api';
import { navItems } from '../../config/nav';
import { PageHeader, Button, Card, Toggle, Badge } from '../../components/ui';

interface Cap { key: string; label: string }
interface RoleEntry { capabilities: string[]; hidden_pages: string[] }
type RolesMap = Record<string, RoleEntry>;

const ROLE_ORDER = ['super_admin', 'admin', 'manager', 'cashier', 'delivery_boy'];
const ROLE_LABEL: Record<string, string> = { super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager', cashier: 'Cashier', delivery_boy: 'Delivery' };
const ALWAYS_ALLOWED = new Set(['super_admin', 'admin']);

export default function RolePermissionsPage() {
    const [caps, setCaps] = useState<Cap[]>([]);
    const [config, setConfig] = useState<RolesMap>({});

    const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: async () => (await roleApi.get()).data });
    useEffect(() => { if (data) { setCaps(data.capabilities ?? []); setConfig(data.roles ?? {}); } }, [data]);

    const saveMut = useMutation({
        mutationFn: () => roleApi.save(config),
        onSuccess: () => toast.success('Permissions saved — users see changes on next sign-in/refresh'),
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });

    const roles = useMemo(() => ROLE_ORDER.filter((r) => config[r]), [config]);
    const pages = useMemo(() => {
        const seen = new Set<string>();
        return navItems.filter((n) => n.path !== '/roles' && !seen.has(n.path) && seen.add(n.path)).map((n) => ({ label: n.label, path: n.path }));
    }, []);

    const toggleCap = (role: string, cap: string, on: boolean) => setConfig((c) => {
        const entry = c[role] ?? { capabilities: [], hidden_pages: [] };
        const set = new Set(entry.capabilities);
        on ? set.add(cap) : set.delete(cap);
        return { ...c, [role]: { ...entry, capabilities: [...set] } };
    });
    const toggleHidden = (role: string, path: string, hidden: boolean) => setConfig((c) => {
        const entry = c[role] ?? { capabilities: [], hidden_pages: [] };
        const set = new Set(entry.hidden_pages);
        hidden ? set.add(path) : set.delete(path);
        return { ...c, [role]: { ...entry, hidden_pages: [...set] } };
    });

    if (isLoading) return <div className="p-8 text-on-surface-variant">Loading…</div>;

    return (
        <div>
            <PageHeader
                title="Roles & Permissions"
                subtitle="Control what each role can see and do. Enforced in the admin UI; Admin & Super Admin always keep full access."
                actions={<Button icon={Save} onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save changes</Button>}
            />

            {/* Capability matrix */}
            <Card className="p-0 overflow-x-auto mb-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface-container-low">
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant sticky left-0 bg-surface-container-low">Capability</th>
                            {roles.map((r) => (
                                <th key={r} className="px-3 py-3 text-center text-xs font-bold uppercase text-on-surface-variant whitespace-nowrap">{ROLE_LABEL[r] ?? r}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {caps.map((cap) => (
                            <tr key={cap.key} className="border-t border-outline-variant">
                                <td className="px-4 py-3 text-on-surface sticky left-0 bg-surface-container-lowest">{cap.label}</td>
                                {roles.map((r) => {
                                    const locked = ALWAYS_ALLOWED.has(r);
                                    const on = locked || (config[r]?.capabilities ?? []).includes(cap.key);
                                    return (
                                        <td key={r} className="px-3 py-3 text-center">
                                            <div className="flex justify-center">
                                                <Toggle checked={on} disabled={locked} onChange={(v) => toggleCap(r, cap.key, v)} />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Page visibility */}
            <h3 className="font-headline font-bold text-on-surface mb-3">Page visibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {roles.filter((r) => !ALWAYS_ALLOWED.has(r)).map((r) => {
                    const hidden = new Set(config[r]?.hidden_pages ?? []);
                    return (
                        <Card key={r} className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck size={16} className="text-primary" />
                                <span className="font-semibold text-on-surface">{ROLE_LABEL[r] ?? r}</span>
                                <Badge tone="neutral" className="ml-auto">{pages.length - hidden.size} visible</Badge>
                            </div>
                            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                {pages.map((p) => (
                                    <label key={p.path} className="flex items-center justify-between gap-2 text-sm py-0.5">
                                        <span className="text-on-surface-variant">{p.label}</span>
                                        <input type="checkbox" className="accent-action-blue" checked={!hidden.has(p.path)} onChange={(e) => toggleHidden(r, p.path, !e.target.checked)} />
                                    </label>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>
            {ALWAYS_ALLOWED.size > 0 && (
                <p className="mt-4 text-xs text-on-surface-variant">Admin & Super Admin always see every page and keep all capabilities (safety backstop).</p>
            )}
        </div>
    );
}
