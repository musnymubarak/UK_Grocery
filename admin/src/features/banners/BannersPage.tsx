import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bannerApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Image, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

export default function BannersPage() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<any>(null);

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            const res = await bannerApi.list();
            return res.data;
        },
    });

    const createBanner = useMutation({
        mutationFn: (data: any) => bannerApi.create(data),
        onSuccess: () => {
            toast.success('Banner created');
            setIsEditing(null);
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const updateBanner = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => bannerApi.update(id, data),
        onSuccess: () => {
            toast.success('Banner updated');
            setIsEditing(null);
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteBanner = useMutation({
        mutationFn: (id: string) => bannerApi.delete(id),
        onSuccess: () => {
            toast.success('Banner removed');
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    if (isLoading) return <div className="p-8">Loading banners...</div>;

    return (
        <div className="p-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Image size={32} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Storefront Banners</h2>
                </div>
                <button 
                    onClick={() => setIsEditing({ title: '', image_url: '', target_url: '', is_active: true })}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Add Banner
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {banners.map((banner: any) => (
                    <div key={banner.id} style={{ 
                        background: 'var(--bg-card)', 
                        borderRadius: 'var(--radius-lg)', 
                        border: '1px solid var(--border)', 
                        overflow: 'hidden',
                        opacity: banner.is_active ? 1 : 0.6,
                        transition: 'opacity 0.2s'
                    }}>
                        <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                            {banner.image_url ? (
                                <img src={banner.image_url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <Image size={48} />
                                </div>
                            )}
                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    onClick={() => setIsEditing(banner)}
                                    style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--border)', cursor: 'pointer' }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => deleteBanner.mutate(banner.id)}
                                    style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--danger)' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{banner.title}</h3>
                                <button 
                                    onClick={() => updateBanner.mutate({ id: banner.id, data: { ...banner, is_active: !banner.is_active } })}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: banner.is_active ? 'var(--success)' : 'var(--text-muted)' }}
                                >
                                    {banner.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                            </div>
                            {banner.target_url && (
                                <a 
                                    href={banner.target_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                                >
                                    <ExternalLink size={14} /> {banner.target_url}
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', zIndex: 1000 
                }}>
                    <div style={{ 
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
                        width: '500px', border: '1px solid var(--border)' 
                    }}>
                        <h3 style={{ marginTop: 0 }}>{isEditing.id ? 'Edit Banner' : 'New Banner'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Title</label>
                                <input 
                                    value={isEditing.title}
                                    onChange={(e) => setIsEditing({...isEditing, title: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Image URL</label>
                                <input 
                                    value={isEditing.image_url}
                                    onChange={(e) => setIsEditing({...isEditing, image_url: e.target.value})}
                                    placeholder="https://images.com/banner.jpg"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Target Path / URL (Optional)</label>
                                <input 
                                    value={isEditing.target_url}
                                    onChange={(e) => setIsEditing({...isEditing, target_url: e.target.value})}
                                    placeholder="/aisle/uuid"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button onClick={() => setIsEditing(null)} className="btn btn-ghost">Cancel</button>
                            <button 
                                onClick={() => {
                                    if(isEditing.id) updateBanner.mutate({ id: isEditing.id, data: isEditing });
                                    else createBanner.mutate(isEditing);
                                }}
                                className="btn btn-primary"
                            >
                                {isEditing.id ? 'Save Changes' : 'Create Banner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
