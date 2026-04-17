import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    AreaChart, 
    Area 
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, CreditCard } from 'lucide-react';

export default function AnalyticsSummary() {
    const { selectedStore } = useAdminStore();
    const [timeRange, setTimeRange] = React.useState(7);

    const { data: stats } = useQuery({
        queryKey: ['analytics', 'dashboard', selectedStore?.id],
        queryFn: async () => {
            const res = await analyticsApi.dashboard();
            return res.data;
        },
    });

    const { data: revenueData } = useQuery({
        queryKey: ['analytics', 'revenue', selectedStore?.id, timeRange],
        queryFn: async () => {
            const res = await analyticsApi.revenueChart({ days: timeRange });
            return res.data;
        },
    });

    if (!stats) return null;

    const cards = [
        { 
            label: 'Total Revenue', 
            value: `£${Number(stats.revenue?.total || 0).toLocaleString()}`, 
            icon: TrendingUp, 
            color: 'var(--success)',
            trend: '+12.5%' 
        },
        { 
            label: 'Total Orders', 
            value: Number(stats.orders?.total || 0).toLocaleString(), 
            icon: ShoppingBag, 
            color: 'var(--primary)',
            trend: '+5.2%' 
        },
        { 
            label: 'New Customers (30d)', 
            value: Number(stats.customers?.new_last_30d || 0).toLocaleString(), 
            icon: Users, 
            color: 'var(--info)',
            trend: '+1.4%' 
        },
        { 
            label: 'Avg Order Value', 
            value: `£${(Number(stats.revenue?.total || 0) / (Number(stats.orders?.total) || 1)).toFixed(2)}`, 
            icon: CreditCard, 
            color: 'var(--warning)',
            trend: '-0.8%' 
        },
    ];

    return (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} style={{
                            background: 'var(--bg-card)',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ background: `${card.color}15`, padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                    <Icon size={24} color={card.color} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: card.trend.startsWith('+') ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                    {card.trend}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{card.label}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{card.value}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ 
                background: 'var(--bg-card)', 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border)',
                height: '400px'
            }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 600 }}>Revenue Trend (Last {timeRange} Days)</h3>
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(Number(e.target.value))}
                        style={{ 
                            background: 'var(--bg-elevated)', 
                            border: '1px solid var(--border)', 
                            padding: '0.4rem 0.75rem', 
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                    </select>
                </div>
                
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={revenueData || []}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="var(--text-muted)" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="var(--text-muted)" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `£${value}`} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                                background: 'var(--bg-elevated)', 
                                border: '1px solid var(--border)', 
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)'
                            }} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="var(--primary)" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRev)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
