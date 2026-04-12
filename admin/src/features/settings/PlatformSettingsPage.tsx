import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi, featureFlagApi, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { Settings, Flag, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function PlatformSettingsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'configs' | 'flags'>('configs');

    const { data: configs = [], isLoading: loadingConfigs } = useQuery({
        queryKey: ['configs'],
        queryFn: async () => {
            const res = await configApi.list();
            return res.data;
        },
    });

    const { data: flags = [], isLoading: loadingFlags } = useQuery({
        queryKey: ['flags'],
        queryFn: async () => {
            const res = await featureFlagApi.list();
            return res.data;
        },
    });

    const [formStates, setFormStates] = useState<Record<string, any>>({});

    const handleConfigChange = (key: string, value: any) => {
        setFormStates(prev => ({ ...prev, [key]: value }));
    };

    const configMutation = useMutation({
        mutationFn: (data: any) => configApi.upsert(data),
        onSuccess: () => {
            toast.success('Settings saved successfully');
            queryClient.invalidateQueries({ queryKey: ['configs'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const saveConfig = (key: string, originalValue: any) => {
        const newValue = formStates[key];
        if (newValue === undefined || newValue === originalValue) return;
        
        configMutation.mutate({
            key,
            value: newValue,
            description: null
        });
    };

    const flagMutation = useMutation({
        mutationFn: (data: any) => featureFlagApi.upsert(data),
        onSuccess: () => {
            toast.success('Feature flag updated');
            queryClient.invalidateQueries({ queryKey: ['flags'] });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const toggleFlag = (key: string, currentStatus: boolean, description: string | null) => {
        flagMutation.mutate({
            key,
            is_enabled: !currentStatus,
            description
        });
    };

    // Helper to extract value since it could be anything
    const getValue = (key: string, defaultValue: any) => {
        if (formStates[key] !== undefined) return formStates[key];
        const config = configs.find((c: any) => c.key === key);
        return config ? config.value : defaultValue;
    };

    if (loadingConfigs || loadingFlags) return <div className="page-content">Loading...</div>;

    return (
        <div className="page-content" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 8 }}>Platform Settings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Hot-reload configuration and feature toggles.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <button 
                    onClick={() => setActiveTab('configs')}
                    style={{ 
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600,
                        color: activeTab === 'configs' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'configs' ? '2px solid var(--primary)' : '2px solid transparent',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}
                >
                    <Settings size={18} /> General Setup
                </button>
                <button 
                    onClick={() => setActiveTab('flags')}
                    style={{ 
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600,
                        color: activeTab === 'flags' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'flags' ? '2px solid var(--primary)' : '2px solid transparent',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}
                >
                    <Flag size={18} /> Feature Flags
                </button>
            </div>

            {activeTab === 'configs' && (
                <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: 24 }}>System Parameters</h3>
                    
                    <div className="form-group" style={{ marginBottom: 32 }}>
                        <label className="form-label">Support Email Address</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input 
                                type="email" 
                                className="form-input" 
                                value={getValue('SUPPORT_EMAIL', 'support@ukgrocery.co.uk')}
                                onChange={e => handleConfigChange('SUPPORT_EMAIL', e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={() => saveConfig('SUPPORT_EMAIL', getValue('SUPPORT_EMAIL', ''))}><Save size={16} /> Save</button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Used in automated communications and storefront footer.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 32 }}>
                        <label className="form-label">Default Delivery Fee (£)</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input 
                                type="number" 
                                step="0.5"
                                className="form-input" 
                                value={getValue('DEFAULT_DELIVERY_FEE', 2.50)}
                                onChange={e => handleConfigChange('DEFAULT_DELIVERY_FEE', parseFloat(e.target.value))}
                            />
                            <button className="btn btn-primary" onClick={() => saveConfig('DEFAULT_DELIVERY_FEE', getValue('DEFAULT_DELIVERY_FEE', 2.50))}><Save size={16} /> Save</button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Global fallback if zone-specific pricing is unavailable.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 32 }}>
                        <label className="form-label">Standard Order Surcharge (£)</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input 
                                type="number" 
                                step="0.1"
                                className="form-input" 
                                value={getValue('SERVICE_FEE', 0.50)}
                                onChange={e => handleConfigChange('SERVICE_FEE', parseFloat(e.target.value))}
                            />
                            <button className="btn btn-primary" onClick={() => saveConfig('SERVICE_FEE', getValue('SERVICE_FEE', 0.50))}><Save size={16} /> Save</button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Admin handling fee attached directly to the checkout total.</p>
                    </div>
                </div>
            )}

            {activeTab === 'flags' && (
                <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Feature Flags</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>Enable or disable system modules globally. Requires page refresh for connected clients.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Static list of expected flags, mapped via DB state */}
                        {[
                            { key: 'REWARDS_SYSTEM_ENABLED', label: 'Loyalty & Rewards System', desc: 'Activates tier points accumulation and wallet mechanisms post-checkout.' },
                            { key: 'STRIPE_PAYMENTS_ENABLED', label: 'Stripe Payments', desc: 'Routes customers to the Stripe Elements checkout instead of Cash on Delivery.' },
                            { key: 'SMS_NOTIFICATIONS', label: 'SMS Notifications', desc: 'Triggers Twilio events when orders are dispatched or rejected.' },
                            { key: 'CLICK_AND_COLLECT', label: 'Click & Collect', desc: 'Allows customers to bypass delivery and pick up in store.' }
                        ].map(flagDef => {
                            const dbFlag = flags.find((f: any) => f.key === flagDef.key);
                            const isEnabled = dbFlag ? dbFlag.is_enabled : false;

                            return (
                                <div key={flagDef.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{flagDef.label} <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>{flagDef.key}</span></h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{flagDef.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => toggleFlag(flagDef.key, isEnabled, flagDef.desc)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isEnabled ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 'bold' }}
                                    >
                                        {isEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                        {isEnabled ? 'ACTIVE' : 'OFF'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
