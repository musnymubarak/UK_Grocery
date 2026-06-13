import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bannerApi, mediaApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Plus, Trash2, Edit2, ExternalLink, Upload } from 'lucide-react';
import { PageHeader, Button, Badge, Card, FormField, Input, Toggle, EmptyState, Skeleton } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { usePermissions } from '../../features/auth/PermissionContext';

interface Banner {
    id?: string;
    title: string;
    image_url: string;
    target_url: string;
    is_active: boolean;
}

const EMPTY: Banner = { title: '', image_url: '', target_url: '', is_active: true };

export default function BannersPage() {
    const queryClient = useQueryClient();
    const { can } = usePermissions();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Banner>(EMPTY);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            const res = await bannerApi.list();
            return res.data as Banner[];
        },
    });

    const createBanner = useMutation({
        mutationFn: (data: any) => bannerApi.create(data),
        onSuccess: () => {
            toast.success('Banner created');
            closeForm();
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const updateBanner = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => bannerApi.update(id, data),
        onSuccess: () => {
            toast.success('Banner updated');
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteBanner = useMutation({
        mutationFn: (id: string) => bannerApi.delete(id),
        onSuccess: () => {
            toast.success('Banner removed');
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const openCreate = () => {
        setForm(EMPTY);
        setShowForm(true);
    };
    const openEdit = (banner: Banner) => {
        setForm({ ...EMPTY, ...banner });
        setShowForm(true);
    };
    const closeForm = () => {
        setShowForm(false);
        setForm(EMPTY);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image too large (max 5MB)');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setUploading(true);
        try {
            const res = await mediaApi.uploadImage(file, 'banners');
            setForm((f) => ({ ...f, image_url: res.data.url }));
            toast.success('Image uploaded');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Upload failed'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const submitForm = () => {
        if (form.id) updateBanner.mutate({ id: form.id, data: form }, { onSuccess: closeForm });
        else createBanner.mutate(form);
    };

    return (
        <div>
            <PageHeader
                title="Storefront Banners"
                subtitle="Promotional images shown across the customer storefront."
                actions={<Button icon={Plus} onClick={openCreate}>Add banner</Button>}
            />

            {isLoading ? (
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full" />
                    ))}
                </div>
            ) : banners.length === 0 ? (
                <Card className="p-0">
                    <EmptyState
                        icon={ImageIcon}
                        title="No banners yet"
                        message="Add a promotional banner to feature on the storefront home screen."
                        action={<Button icon={Plus} onClick={openCreate}>Add banner</Button>}
                    />
                </Card>
            ) : (
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {banners.map((banner) => (
                        <Card key={banner.id} className={`overflow-hidden ${banner.is_active ? '' : 'opacity-60'}`}>
                            <div className="relative h-44 bg-surface-container-high">
                                {banner.image_url ? (
                                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-on-surface-variant/50">
                                        <ImageIcon size={44} />
                                    </div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <Badge tone={banner.is_active ? 'success' : 'neutral'} dot>
                                        {banner.is_active ? 'Active' : 'Hidden'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="font-headline text-base font-bold text-on-surface truncate">{banner.title || 'Untitled banner'}</h3>
                                    <Toggle
                                        checked={banner.is_active}
                                        onChange={(v) => banner.id && updateBanner.mutate({ id: banner.id, data: { ...banner, is_active: v } })}
                                        label="Toggle active"
                                    />
                                </div>
                                {banner.target_url && (
                                    <a
                                        href={banner.target_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline truncate max-w-full"
                                    >
                                        <ExternalLink size={13} className="shrink-0" />
                                        <span className="truncate">{banner.target_url}</span>
                                    </a>
                                )}
                                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-outline-variant">
                                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(banner)}>Edit</Button>
                                    {can('delete_records') && banner.id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={Trash2}
                                            onClick={() => setDeleteId(banner.id!)}
                                            className="text-error hover:bg-error/10 ml-auto"
                                        />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / edit modal */}
            <Modal
                open={showForm}
                onClose={closeForm}
                title={form.id ? 'Edit banner' : 'New banner'}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeForm}>Cancel</Button>
                        <Button
                            onClick={submitForm}
                            loading={createBanner.isPending || updateBanner.isPending}
                            disabled={uploading}
                        >
                            {form.id ? 'Save changes' : 'Create banner'}
                        </Button>
                    </>
                }
            >
                <FormField label="Title" required>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </FormField>

                <FormField label="Banner image" hint="Upload an image or paste a URL below.">
                    <div className="flex items-start gap-3">
                        <div className="h-20 w-32 shrink-0 rounded-md overflow-hidden border border-outline-variant bg-surface-container-high flex items-center justify-center">
                            {form.image_url ? (
                                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={26} className="text-on-surface-variant/40" />
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={Upload}
                                loading={uploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? 'Uploading…' : 'Upload image'}
                            </Button>
                            <p className="mt-1 text-xs text-on-surface-variant">PNG or JPG, max 5MB.</p>
                        </div>
                    </div>
                </FormField>

                <FormField label="Image URL">
                    <Input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="https://images.com/banner.jpg"
                    />
                </FormField>

                <FormField label="Target path / URL (optional)">
                    <Input
                        value={form.target_url}
                        onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                        placeholder="/aisle/uuid"
                    />
                </FormField>

                <FormField label="Active">
                    <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Active" />
                </FormField>
            </Modal>

            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteBanner.mutate(deleteId)}
                title="Delete banner?"
                message="This banner will be permanently removed from the storefront."
                confirmLabel="Delete"
                loading={deleteBanner.isPending}
            />
        </div>
    );
}
