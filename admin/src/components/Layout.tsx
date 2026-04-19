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
    ShieldAlert,
    Plus,
    HelpCircle
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
                <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="brand-icon">
                            <StoreIcon size={20} />
                        </div>
                        <div>
                            <h1>{selectedStore ? selectedStore.name : 'Main Branch'}</h1>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Premium Curator</div>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="admin-store-selector" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                            <button
                                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <StoreIcon size={14} />
                                    Switch Store
                                </span>
                                <ChevronDown size={14} />
                            </button>

                            {showStoreDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: 4,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    zIndex: 100,
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {stores.map(store => (
                                        <button
                                            key={store.id}
                                            onClick={() => handleStoreChange(store)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '10px 12px',
                                                border: 'none',
                                                background: selectedStore?.id === store.id ? 'var(--primary-50)' : 'transparent',
                                                color: selectedStore?.id === store.id ? 'var(--primary)' : 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
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
                                            <Icon size={20} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginBottom: 24, justifyContent: 'center', padding: '12px' }}
                        onClick={() => toast.success('New Shipment flow coming soon')}
                    >
                        <Plus size={18} />
                        New Shipment
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button className="nav-item" onClick={() => toast.success('Support center loading...')}>
                            <HelpCircle size={20} />
                            Support
                        </button>
                        <button className="nav-item" onClick={logout}>
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <h2 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                            {navItems.find((n) => n.path === location.pathname)?.label || 'Admin Portal'}
                        </h2>
                    </div>

                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-primary)',
                                    width: '240px',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>
                        <div className="user-avatar" style={{ width: 40, height: 40, cursor: 'pointer' }}>
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
