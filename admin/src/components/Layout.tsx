import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useAdminStore } from '../features/auth/AdminStoreContext';
import { storeApi } from '../services/api';
import { Store as StoreType } from '../types';
import toast from 'react-hot-toast';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    BarChart3,
    Users,
    LogOut,
    Tags,
    MapPin,
    Store as StoreIcon,
    ChevronDown,
    FileSearch,
    ShoppingBag,
    Users2,
    Truck,
    Ticket,
    Settings,
    Star,
    Webhook,
    Image,
    MessageSquare,
    RotateCcw,
    ShieldAlert
} from 'lucide-react';

const navItems = [
    { label: 'Dashboard', section: 'Main', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { label: 'Orders', section: 'Main', path: '/orders', icon: ShoppingBag, roles: ['admin', 'manager', 'cashier'] },
    { label: 'Customers', section: 'Main', path: '/customers', icon: Users2, roles: ['admin', 'manager'] },
    { label: 'My Deliveries', section: 'Delivery', path: '/dashboard', icon: Truck, roles: ['delivery_boy'] }, // We route delivery boys to dashboard for now
    { label: 'Delivery Zones', section: 'Operations', path: '/delivery-zones', icon: MapPin, roles: ['admin', 'manager'] },
    { label: 'Coupons', section: 'Operations', path: '/coupons', icon: Ticket, roles: ['admin', 'manager'] },
    { label: 'Rewards', section: 'Operations', path: '/rewards', icon: Star, roles: ['admin', 'manager'] },
    { label: 'Products', section: 'Catalog', path: '/products', icon: Package, roles: ['admin', 'manager'] },
    { label: 'Categories', section: 'Catalog', path: '/categories', icon: Tags, roles: ['admin', 'manager'] },
    { label: 'Inventory', section: 'Operations', path: '/inventory', icon: Warehouse, roles: ['admin', 'manager'] },
    { label: 'Reports', section: 'Analytics', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { label: 'Stores', section: 'Admin', path: '/stores', icon: StoreIcon, roles: ['admin'] },
    { label: 'Users', section: 'Admin', path: '/users', icon: Users, roles: ['admin'] },
    { label: 'Audit Logs', section: 'Admin', path: '/audit', icon: FileSearch, roles: ['admin', 'manager'] },
    { label: 'Banners', section: 'Admin', path: '/banners', icon: Image, roles: ['admin', 'manager'] },
    { label: 'Webhooks', section: 'Admin', path: '/webhooks', icon: Webhook, roles: ['admin'] },
    { label: 'Reviews', section: 'Admin', path: '/reviews', icon: MessageSquare, roles: ['admin', 'manager'] },
    { label: 'Refunds', section: 'Admin', path: '/refunds', icon: RotateCcw, roles: ['admin', 'manager'] },
    { label: 'System Health', section: 'Admin', path: '/system', icon: ShieldAlert, roles: ['admin'] },
    { label: 'Settings', section: 'Admin', path: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Admin Store Selection
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const { selectedStore, setSelectedStore } = useAdminStore();
    const [stores, setStores] = useState<StoreType[]>([]);
    const [showStoreDropdown, setShowStoreDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch stores for admin dropdown
    useEffect(() => {
        if (isAdmin) {
            storeApi.list().then(res => setStores(res.data)).catch(console.error);
        }
    }, [isAdmin]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowStoreDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStoreChange = (store: StoreType) => {
        setSelectedStore({ id: store.id, name: store.name });
        setShowStoreDropdown(false);
        toast.success(`Switched to ${store.name}`);
    };

    const filteredNav = navItems.filter((item) =>
        user ? item.roles.includes(user.role) : false
    );

    const sections = [...new Set(filteredNav.map((item) => item.section))];

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">G</div>
                    <h1>UK Grocery Admin</h1>
                </div>

                <nav className="sidebar-nav">
                    {sections.map((section) => (
                        <div key={section}>
                            <div className="sidebar-section-title">{section}</div>
                            {filteredNav
                                .filter((item) => item.section === section)
                                .map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.label}
                                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                            onClick={() => navigate(item.path)}
                                        >
                                            <Icon size={18} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{user?.full_name}</div>
                            <div className="user-role">{user?.role}</div>
                        </div>
                    </div>
                    <button className="nav-item" onClick={logout} style={{ marginTop: 8 }}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <h2 className="page-title">
                            {navItems.find((n) => n.path === location.pathname)?.label || 'Admin Portal'}
                        </h2>

                        {isAdmin && (
                            <div className="admin-store-selector" ref={dropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 16px',
                                        borderRadius: 20,
                                        border: 'none',
                                        color: '#fff',
                                        background: selectedStore ? 'var(--primary)' : 'var(--warning)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <StoreIcon size={16} />
                                    {selectedStore ? selectedStore.name : 'No Store Selected'}
                                    <ChevronDown size={14} />
                                </button>

                                {showStoreDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: 8,
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        minWidth: 200,
                                        zIndex: 100,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                                            Select operating store
                                        </div>
                                        {stores.map(store => (
                                            <button
                                                key={store.id}
                                                onClick={() => handleStoreChange(store)}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '10px 16px',
                                                    border: 'none',
                                                    background: selectedStore?.id === store.id ? 'var(--primary-light)' : 'transparent',
                                                    color: selectedStore?.id === store.id ? '#fff' : 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                                onMouseOver={(e) => {
                                                    if (selectedStore?.id !== store.id) {
                                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                                    }
                                                }}
                                                onMouseOut={(e) => {
                                                    if (selectedStore?.id !== store.id) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                {store.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
