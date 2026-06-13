import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { contentApi, getErrorMessage } from '../../services/api';
import { PageHeader, Button, Card, FormField, Input, Textarea } from '../../components/ui';

interface Field { key: string; label: string; default: string; multiline?: boolean }
interface Group { section: string; label: string; fields: Field[] }

export default function ContentEditorPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});

    const { data, isLoading } = useQuery({ queryKey: ['content'], queryFn: async () => (await contentApi.get()).data });
    useEffect(() => { if (data) { setGroups(data.groups ?? []); setValues(data.values ?? {}); } }, [data]);

    const saveMut = useMutation({
        mutationFn: () => contentApi.save(values),
        onSuccess: () => toast.success('Copy saved — live on the storefront within a couple of minutes'),
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });

    const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

    if (isLoading) return <div className="p-8 text-on-surface-variant">Loading…</div>;

    return (
        <div>
            <PageHeader
                title="Storefront Content"
                subtitle="Edit the marketing copy shown across the storefront and mobile app. Changes go live without a deploy."
                actions={<Button icon={Save} onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save changes</Button>}
            />
            <div className="space-y-6">
                {groups.map((g) => (
                    <Card key={g.section} className="p-5">
                        <h3 className="font-headline font-bold text-on-surface mb-4">{g.label}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                            {g.fields.map((f) => {
                                const v = values[f.key] ?? f.default;
                                const changed = v !== f.default;
                                return (
                                    <FormField key={f.key} label={f.label} className={f.multiline ? 'md:col-span-2' : ''}>
                                        {f.multiline
                                            ? <Textarea value={v} onChange={(e) => set(f.key, e.target.value)} />
                                            : <Input value={v} onChange={(e) => set(f.key, e.target.value)} />}
                                        {changed && (
                                            <button type="button" onClick={() => set(f.key, f.default)} className="mt-1 text-xs text-action-blue hover:underline">
                                                Reset to default
                                            </button>
                                        )}
                                    </FormField>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
