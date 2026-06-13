import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { legalApi, getErrorMessage } from '../../services/api';
import { PageHeader, Button, Card, FormField, Input, Textarea } from '../../components/ui';

interface LegalPage { slug: string; label: string; default_title: string }
interface LegalValue { title: string; body: string; updated_at: string | null }
interface DraftValue { title: string; body: string }

export default function LegalPagesPage() {
    const queryClient = useQueryClient();
    const [pages, setPages] = useState<LegalPage[]>([]);
    const [drafts, setDrafts] = useState<Record<string, DraftValue>>({});
    const [updatedAt, setUpdatedAt] = useState<Record<string, string | null>>({});
    const [activeSlug, setActiveSlug] = useState<string>('privacy');

    const { data, isLoading } = useQuery({ queryKey: ['legal'], queryFn: async () => (await legalApi.get()).data });

    useEffect(() => {
        if (!data) return;
        const nextPages: LegalPage[] = data.pages ?? [];
        const values: Record<string, LegalValue> = data.values ?? {};
        setPages(nextPages);
        const nextDrafts: Record<string, DraftValue> = {};
        const nextUpdated: Record<string, string | null> = {};
        for (const p of nextPages) {
            const v = values[p.slug];
            nextDrafts[p.slug] = { title: v?.title ?? '', body: v?.body ?? '' };
            nextUpdated[p.slug] = v?.updated_at ?? null;
        }
        setDrafts(nextDrafts);
        setUpdatedAt(nextUpdated);
        if (nextPages.length && !nextPages.some((p) => p.slug === activeSlug)) {
            setActiveSlug(nextPages[0].slug);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const saveMut = useMutation({
        mutationFn: () => legalApi.save(activeSlug, drafts[activeSlug]),
        onSuccess: () => {
            toast.success('Saved — live on the storefront');
            queryClient.invalidateQueries({ queryKey: ['legal'] });
        },
        onError: (e) => toast.error(getErrorMessage(e, 'Failed to save')),
    });

    const setField = (slug: string, key: keyof DraftValue, value: string) =>
        setDrafts((s) => ({ ...s, [slug]: { ...s[slug], [key]: value } }));

    if (isLoading) return <div className="p-8 text-on-surface-variant">Loading…</div>;

    const draft = drafts[activeSlug] ?? { title: '', body: '' };
    const activePage = pages.find((p) => p.slug === activeSlug);
    const activeUpdatedAt = updatedAt[activeSlug];

    return (
        <div>
            <PageHeader
                title="Legal Pages"
                subtitle="Edit Privacy, Terms, and Cookie page copy. Leave a page blank to use the built-in default."
                actions={<Button icon={Save} onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button>}
            />

            <div className="flex gap-1 border-b border-outline mb-6">
                {pages.map((p) => {
                    const isActive = p.slug === activeSlug;
                    return (
                        <button
                            key={p.slug}
                            type="button"
                            onClick={() => setActiveSlug(p.slug)}
                            className={
                                'px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ' +
                                (isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-on-surface-variant hover:text-on-surface')
                            }
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>

            <Card className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="font-headline font-bold text-on-surface">{activePage?.label ?? 'Page'}</h3>
                    {activeUpdatedAt && (
                        <span className="text-xs text-on-surface-variant">
                            Last updated {new Date(activeUpdatedAt).toLocaleString()}
                        </span>
                    )}
                </div>

                <FormField label="Title">
                    <Input
                        value={draft.title}
                        placeholder={activePage?.default_title ?? ''}
                        onChange={(e) => setField(activeSlug, 'title', e.target.value)}
                    />
                </FormField>

                <FormField label="Body">
                    <Textarea
                        className="min-h-[420px] font-mono text-[13px]"
                        value={draft.body}
                        onChange={(e) => setField(activeSlug, 'body', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-on-surface-variant">
                        Markdown supported — # heading, **bold**, - list, [text](url).
                    </p>
                </FormField>
            </Card>
        </div>
    );
}
