import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/api';
import { useAdminStore } from '../auth/AdminStoreContext';
import { CustomSelect } from '../../components/CustomSelect';
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
        <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Analytics Overview</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Performance metrics and business intelligence.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="card" style={{
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {card.label}
                                </div>
                                <div style={{ 
                                    background: `${card.color}15`, 
                                    padding: '10px', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: card.color
                                }}>
                                    <Icon size={20} />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    {card.value}
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    fontSize: '0.9rem', 
                                    fontWeight: 600,
                                    color: card.trend.startsWith('+') ? 'var(--success)' : 'var(--danger)'
                                }}>
                                    <TrendingUp size={14} style={{ transform: card.trend.startsWith('+') ? 'none' : 'rotate(180deg)' }} />
                                    {card.trend}
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs last period</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Revenue Trend</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>Daily revenue performance</p>
                    </div>
                    <CustomSelect
                        options={[
                            { value: 7, label: 'Last 7 Days' },
                            { value: 30, label: 'Last 30 Days' }
                        ]}
                        value={timeRange}
                        onChange={(val) => setTimeRange(Number(val))}
                        style={{ width: '160px' }}
                    />
                </div>
                
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="var(--text-muted)" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                stroke="var(--text-muted)" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `£${value}`} 
                            />
                            <Tooltip 
                                cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                contentStyle={{ 
                                    background: '#fff', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-md)',
                                    color: 'var(--text-primary)',
                                    padding: '12px'
                                }} 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="var(--primary)" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
