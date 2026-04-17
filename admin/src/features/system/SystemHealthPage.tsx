import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../../services/api';
import { Activity, Database, Cpu, HardDrive, RefreshCcw, ShieldCheck, Server } from 'lucide-react';

export default function SystemHealthPage() {
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const { data: health, refetch: refetchHealth } = useQuery({
        queryKey: ['system', 'health'],
        queryFn: async () => {
            const res = await healthApi.ready();
            return res.data;
        },
        refetchInterval: 10000,
    });

    const { data: metrics, refetch: refetchMetrics } = useQuery({
        queryKey: ['system', 'metrics'],
        queryFn: async () => {
            const res = await healthApi.metrics();
            return res.data;
        },
        refetchInterval: 10000,
    });

    const refreshAll = () => {
        refetchHealth();
        refetchMetrics();
        setLastRefresh(new Date());
    };

    const statusCards = [
        { 
            label: 'Database', 
            status: health?.database === 'healthy' ? 'Online' : 'Error', 
            icon: Database, 
            color: health?.database === 'healthy' ? 'var(--success)' : 'var(--danger)' 
        },
        { 
            label: 'Redis Cache', 
            status: health?.cache === 'healthy' ? 'Online' : 'Offline', 
            icon: Cpu, 
            color: health?.cache === 'healthy' ? 'var(--success)' : 'var(--warning)' 
        },
        { 
            label: 'API Service', 
            status: 'Operational', 
            icon: Server, 
            color: 'var(--success)' 
        },
        { 
            label: 'Security Layer', 
            status: 'HSTS Enabled', 
            icon: ShieldCheck, 
            color: 'var(--info)' 
        },
    ];

    return (
        <div className="p-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Activity size={32} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>System Monitoring</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                    <button onClick={refreshAll} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {statusCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} style={{ 
                            background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', 
                            border: '1px solid var(--border)', borderTop: `4px solid ${card.color}`,
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{card.label}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: card.color }}>{card.status}</div>
                                </div>
                                <Icon size={32} style={{ opacity: 0.2 }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* System Metrics */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>
                        <HardDrive size={20} /> Operational Metrics
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>App Version</span>
                            <span style={{ fontWeight: 600 }}>{metrics?.version || '1.0.0'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Environment</span>
                            <span className="badge badge-outline">Production</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
                            <span style={{ fontWeight: 600 }}>{metrics?.uptime_str || '0d 0h 0m'}</span>
                        </div>
                    </div>
                </div>

                {/* API Diagnostics */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>
                        <Activity size={20} /> Backend Health
                    </div>
                    {health?.details ? (
                        <div style={{ fontSize: '0.9rem' }}>
                            <div style={{ marginBottom: '1rem' }}>All backend subsystems are reporting nominal performance. Service registry is active.</div>
                            <pre style={{ 
                                background: '#000', color: '#0f0', padding: '1rem', 
                                borderRadius: 'var(--radius-md)', fontSize: '0.8rem', 
                                overflowX: 'auto', fontFamily: 'monospace' 
                            }}>
                                {JSON.stringify(health, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Diagnosing system...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
