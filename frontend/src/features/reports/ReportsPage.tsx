/**
 * Reports page — advanced analytics with period filtering, Recharts, and heatmap.
 */
import React, { useState, useEffect } from 'react';
import { reportApi, storeApi } from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import {
    BarChart3, Users, Package, DollarSign, Calendar, Download, Printer, TrendingUp, TrendingDown,
    Clock, AlertTriangle, CalendarClock
} from 'lucide-react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart
} from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const fmtCurrency = (v: number) => `$${Number(v).toFixed(2)}`;

const getInitialDates = (period: string) => {
    const today = new Date();
    switch (period) {
        case 'today': return { from: fmtDate(today), to: fmtDate(today) };
        case 'yesterday': {
            const y = new Date(today); y.setDate(y.getDate() - 1);
            return { from: fmtDate(y), to: fmtDate(y) };
        }
        case 'thisWeek': {
            const d = new Date(today);
            const day = d.getDay() || 7;
            d.setDate(d.getDate() - day + 1);
            return { from: fmtDate(d), to: fmtDate(today) };
        }
        case 'lastWeek': {
            const end = new Date(today);
            const day = end.getDay() || 7;
            end.setDate(end.getDate() - day);
            const start = new Date(end);
            start.setDate(start.getDate() - 6);
            return { from: fmtDate(start), to: fmtDate(end) };
        }
        case 'thisMonth': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: fmtDate(start), to: fmtDate(today) };
        }
        case 'lastMonth': {
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return { from: fmtDate(start), to: fmtDate(end) };
        }
        default: return { from: fmtDate(today), to: fmtDate(today) };
    }
};

export default function ReportsPage() {
    const { isManager } = useAuth();
    const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'cashiers' | 'valuation'>('sales');
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState('');

    // Date Filter State
    const [period, setPeriod] = useState('thisMonth');
    const [dateFrom, setDateFrom] = useState(getInitialDates('thisMonth').from);
    const [dateTo, setDateTo] = useState(getInitialDates('thisMonth').to);

    // Data State
    const [salesSummary, setSalesSummary] = useState<any>(null);
    const [productPerf, setProductPerf] = useState<any>(null);
    const [cashierPerf, setCashierPerf] = useState<any[]>([]);
    const [valuation, setValuation] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadStores(); }, []);

    useEffect(() => {
        if (period !== 'custom') {
            const dates = getInitialDates(period);
            setDateFrom(dates.from);
            setDateTo(dates.to);
        }
    }, [period]);

    useEffect(() => {
        loadReport();
    }, [activeTab, selectedStore, dateFrom, dateTo]);

    const loadStores = async () => {
        try {
            const res = await storeApi.list();
            setStores(res.data || []);
            if (res.data?.length > 0) setSelectedStore(res.data[0].id);
        } catch (err) { console.error(err); }
    };

    const loadReport = async () => {
        if (!selectedStore && activeTab !== 'valuation' && activeTab !== 'sales' && activeTab !== 'products' && activeTab !== 'cashiers') return;
        setLoading(true);
        const params = {
            store_id: selectedStore || undefined,
            date_from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
            date_to: dateTo ? `${dateTo}T00:00:00` : undefined
        };

        try {
            switch (activeTab) {
                case 'sales': {
                    const res = await reportApi.salesSummary(params);
                    setSalesSummary(res.data);
                    break;
                }
                case 'products': {
                    const res = await reportApi.productPerformance({ ...params, limit: 10 });
                    setProductPerf(res.data);
                    break;
                }
                case 'cashiers': {
                    const res = await reportApi.cashierPerformance(params);
                    setCashierPerf(res.data || []);
                    break;
                }
                case 'valuation': {
                    const res = await reportApi.inventoryValuation(params);
                    setValuation(res.data);
                    break;
                }
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleExportCSV = () => {
        let csv = '';
        if (activeTab === 'sales' && salesSummary) {
            csv += 'Date,Revenue,Transactions\n';
            salesSummary.trendLine?.forEach((t: any) => csv += `${t.date},${t.revenue},${t.transactions}\n`);
        } else if (activeTab === 'products' && productPerf) {
            csv += 'Rank,Product,SKU,Category,Units Sold,Revenue,Margin %\n';
            productPerf.topProducts?.forEach((p: any, i: number) =>
                csv += `${i + 1},"${p.product_name}","${p.product_sku}","${p.category_name}",${p.total_quantity},${p.total_revenue},${p.margin_percent}\n`);
        } else if (activeTab === 'cashiers') {
            csv += 'Cashier,Store,Total Sales,Total Revenue,Total Refunds,Refund Amount\n';
            cashierPerf?.forEach((c: any) => csv += `"${c.cashier_name}","${c.store_name}",${c.total_sales},${c.total_revenue},${c.total_refunds},${c.refund_amount}\n`);
        } else if (activeTab === 'valuation' && valuation) {
            csv += 'Product,Category,Store,Stock,Cost Price,Retail Price,Stock Value,Retail Value\n';
            valuation.inventoryTable?.forEach((i: any) => csv += `"${i.product}","${i.category}","${i.store}",${i.stock},${i.cost},${i.retail},${i.stock_value},${i.retail_value}\n`);
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retail_report_${activeTab}_${dateFrom}_${dateTo}.csv`;
        a.click();
    };

    const tabs = [
        { key: 'sales' as const, label: 'Sales Summary', icon: DollarSign },
        { key: 'products' as const, label: 'Product Performance', icon: Package },
        { key: 'cashiers' as const, label: 'Cashier Performance', icon: Users },
        { key: 'valuation' as const, label: 'Inventory Valuation', icon: BarChart3 },
    ];

    return (
        <div className="reports-page-wrapper">
            <div className="reports-header" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }} data-html2canvas-ignore>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.key} className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                    onClick={() => setActiveTab(tab.key)}>
                                    <Icon size={14} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><Printer size={14} /> PDF</button>
                        <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}><Download size={14} /> CSV</button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, background: 'var(--bg-card)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '6px 10px', width: 140 }}>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="thisWeek">This Week</option>
                            <option value="lastWeek">Last Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="lastMonth">Last Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {period === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="date" className="form-input" style={{ width: 140, padding: '4px 8px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            <span style={{ color: 'var(--text-muted)' }}>to</span>
                            <input type="date" className="form-input" style={{ width: 140, padding: '4px 8px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    )}

                    <div style={{ marginLeft: 'auto', borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
                        <select className="form-select" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} style={{ width: 200, padding: '6px 10px' }} disabled={isManager}>
                            {!isManager && <option value="">All Stores</option>}
                            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner" style={{ height: 300 }}><div className="spinner" /></div>
            ) : (
                <div className="reports-content receipt-print">
                    {/* SALES TAB */}
                    {activeTab === 'sales' && salesSummary && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="stat-grid" style={{ marginBottom: 0 }}>
                                <div className="stat-card">
                                    <div className="stat-icon purple"><DollarSign size={22} /></div>
                                    <div><div className="stat-value">{fmtCurrency(salesSummary.total_revenue)}</div><div className="stat-label">Total Revenue</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan"><BarChart3 size={22} /></div>
                                    <div><div className="stat-value">{salesSummary.total_sales}</div><div className="stat-label">Total Sales</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon red"><TrendingDown size={22} /></div>
                                    <div><div className="stat-value">{fmtCurrency(salesSummary.total_refunds_amount)} ({salesSummary.total_refunds_count})</div><div className="stat-label">Refunds</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green"><Package size={22} /></div>
                                    <div><div className="stat-value">{salesSummary.average_items?.toFixed(1)}</div><div className="stat-label">Avg Items / Sale</div></div>
                                </div>
                            </div>

                            <div className="stat-grid" style={{ marginBottom: 0 }}>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}><CalendarClock size={20} /></div>
                                    <div><div className="stat-value" style={{ fontSize: '1.2rem' }}>{salesSummary.po_active_count || 0}</div><div className="stat-label">Active Pre-Orders</div></div>
                                </div>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}><DollarSign size={20} /></div>
                                    <div>
                                        <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmtCurrency(salesSummary.po_active_deposits || 0)}</div>
                                        <div className="stat-label">Pre-Order Deposits Held</div>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}><TrendingUp size={20} /></div>
                                    <div>
                                        <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmtCurrency((salesSummary.po_active_total || 0) - (salesSummary.po_active_deposits || 0))}</div>
                                        <div className="stat-label">Pending Balances Due</div>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-icon cyan"><Package size={20} /></div>
                                    <div><div className="stat-value" style={{ fontSize: '1.2rem' }}>{salesSummary.po_completed_count || 0}</div><div className="stat-label">Completed Pre-Orders</div></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Revenue & Transactions Trend</h3></div>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={salesSummary.trendLine || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                                <Legend />
                                                <Bar yAxisId="right" dataKey="transactions" name="Transactions" fill="var(--bg-elevated)" barSize={20} radius={[4, 4, 0, 0]} />
                                                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Payment Methods</h3></div>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={salesSummary.paymentMethods || []} dataKey="amount" nameKey="method" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                                    {(salesSummary.paymentMethods || []).map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} /> Hourly Sales Heatmap</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: 2, minWidth: 800 }}>
                                        <div />
                                        {Array.from({ length: 24 }).map((_, h) => (
                                            <div key={`h-${h}`} style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h}h</div>
                                        ))}
                                        {DAYS.map((dayName, dIndex) => {
                                            // server dow: 1=Mon..7=Sun
                                            const dayData = (salesSummary.hourlyHeatmap || []).filter((h: any) => h.day === dIndex + 1);
                                            return (
                                                <React.Fragment key={dayName}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', alignSelf: 'center' }}>{dayName}</div>
                                                    {Array.from({ length: 24 }).map((_, h) => {
                                                        const match = dayData.find((hm: any) => hm.hour === h);
                                                        const intensity = match ? Math.min(match.sales / 10, 1) : 0;
                                                        const bg = match ? `rgba(99, 102, 241, ${0.1 + (intensity * 0.9)})` : 'var(--bg-input)';
                                                        return (
                                                            <div key={`${dIndex}-${h}`} title={`${dayName} ${h}h: ${match ? match.sales : 0} sales`}
                                                                style={{ height: 28, background: bg, borderRadius: 2, transition: 'var(--transition)' }} />
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === 'products' && productPerf && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Top 10 Products by Revenue</h3></div>
                                    <div style={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={productPerf.topProducts || []} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis dataKey="product_name" type="category" width={120} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                                                <Bar dataKey="total_revenue" name="Revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Category Split</h3></div>
                                    <div style={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={productPerf.categoryBreakdown || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                                                    {(productPerf.categoryBreakdown || []).map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Top Movers Data</h3></div>
                                    <div className="table-container" style={{ maxHeight: 300 }}>
                                        <table className="table">
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Rank</th><th>Product</th><th>Qty</th><th>Margin</th></tr></thead>
                                            <tbody>
                                                {(productPerf.topProducts || []).map((p: any, i: number) => (
                                                    <tr key={p.product_id || i}>
                                                        <td>{i + 1}</td>
                                                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.product_name} <br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{p.category_name}</span></td>
                                                        <td>{p.total_quantity}</td>
                                                        <td style={{ color: p.margin_percent < 20 ? 'var(--danger)' : 'var(--success)' }}>{p.margin_percent.toFixed(1)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                    <div className="card-header"><h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}><AlertTriangle size={16} /> Slow / Non-Movers</h3></div>
                                    <div className="table-container" style={{ maxHeight: 300 }}>
                                        <table className="table">
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Product</th><th>Category</th><th>In Stock</th></tr></thead>
                                            <tbody>
                                                {(productPerf.slowMovers || []).map((p: any) => (
                                                    <tr key={p.product_id}>
                                                        <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                                                        <td>{p.category_name}</td>
                                                        <td><span className="badge badge-warning">{p.current_stock} pcs</span></td>
                                                    </tr>
                                                ))}
                                                {(!productPerf.slowMovers || productPerf.slowMovers.length === 0) && (
                                                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20 }}>No slow runners detected in this period.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CASHIERS TAB */}
                    {activeTab === 'cashiers' && cashierPerf && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="card">
                                <div className="card-header"><h3 className="card-title">Revenue by Cashier</h3></div>
                                <div style={{ height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={cashierPerf} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="cashier_name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                            <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                                            <Legend />
                                            <Bar dataKey="total_revenue" name="Total Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="card">
                                <div className="table-container">
                                    <table className="table">
                                        <thead><tr><th>Cashier</th>{!selectedStore && <th>Store</th>}<th>Transactions</th><th>Revenue</th><th>Avg Sale</th><th>Refund Rate</th></tr></thead>
                                        <tbody>
                                            {cashierPerf.map((c: any) => (
                                                <tr key={c.user_id}>
                                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.cashier_name}</td>
                                                    {!selectedStore && <td>{c.store_name}</td>}
                                                    <td>{c.total_sales}</td>
                                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmtCurrency(c.total_revenue)}</td>
                                                    <td>{fmtCurrency(c.avg_sale)}</td>
                                                    <td style={{ color: c.refund_rate > 5 ? 'var(--danger)' : 'var(--text-secondary)' }}>{c.refund_rate.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            {cashierPerf.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VALUATION TAB */}
                    {activeTab === 'valuation' && valuation && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="stat-grid" style={{ marginBottom: 0 }}>
                                <div className="stat-card">
                                    <div className="stat-icon purple"><Package size={22} /></div>
                                    <div><div className="stat-value">{valuation.summary.total_units}</div><div className="stat-label">Total Stock Units</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan"><TrendingDown size={22} /></div>
                                    <div><div className="stat-value">{fmtCurrency(valuation.summary.total_cost_value)}</div><div className="stat-label">Stock Value (Cost)</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green"><TrendingUp size={22} /></div>
                                    <div><div className="stat-value">{fmtCurrency(valuation.summary.total_retail_value)}</div><div className="stat-label">Retail Value</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon amber"><DollarSign size={22} /></div>
                                    <div><div className="stat-value">{fmtCurrency(valuation.summary.potential_profit)}</div><div className="stat-label">Potential Gross Profit</div></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Stock Movements</h3></div>
                                    <div style={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={valuation.stockMovements || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                                <XAxis dataKey="type" stroke="var(--text-muted)" tickLine={false} axisLine={false} style={{ textTransform: 'capitalize' }} />
                                                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                                                <Bar dataKey="quantity" name="Quantity Moved" fill="var(--primary-light)" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                                    {(valuation.stockMovements || []).map((m: any, idx: number) => (
                                                        <Cell key={`cell-${idx}`} fill={m.quantity < 0 ? 'var(--danger)' : 'var(--success)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                                    <div className="card-header"><h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)' }}><AlertTriangle size={16} /> Low Stock Alerts</h3></div>
                                    <div className="table-container" style={{ maxHeight: 320 }}>
                                        <table className="table">
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Product</th><th>On Hand</th><th>Min</th></tr></thead>
                                            <tbody>
                                                {(valuation.lowStockAlerts || []).map((p: any) => (
                                                    <tr key={p.product_id}>
                                                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                                                        <td style={{ color: p.quantity <= 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>{p.quantity}</td>
                                                        <td>{p.threshold}</td>
                                                    </tr>
                                                ))}
                                                {(!valuation.lowStockAlerts || valuation.lowStockAlerts.length === 0) && (
                                                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20 }}>No low stock alerts.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header"><h3 className="card-title">Inventory Ledger</h3></div>
                                <div className="table-container" style={{ maxHeight: 400 }}>
                                    <table className="table">
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Product</th><th>Category</th><th>Store</th><th>Qty</th><th>Cost</th><th>Retail</th><th>Total Cost</th><th>Total Retail</th><th>Margin</th></tr></thead>
                                        <tbody>
                                            {(valuation.inventoryTable || []).map((r: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.product}</td>
                                                    <td>{r.category}</td>
                                                    <td>{r.store}</td>
                                                    <td style={{ fontWeight: 600 }}>{r.stock}</td>
                                                    <td>{fmtCurrency(r.cost)}</td>
                                                    <td>{fmtCurrency(r.retail)}</td>
                                                    <td>{fmtCurrency(r.stock_value)}</td>
                                                    <td>{fmtCurrency(r.retail_value)}</td>
                                                    <td style={{ color: 'var(--success)' }}>{r.margin.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            {(!valuation.inventoryTable || valuation.inventoryTable.length === 0) && (
                                                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No inventory data</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
