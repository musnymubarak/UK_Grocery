import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useAdminStore } from '../features/auth/AdminStoreContext';
import { storeApi } from '../services/api';
import { Store as StoreType } from '../types';
import toast from 'react-hot-toast';
import {
    Menu, PanelLeftClose, PanelLeft, Search, Sun, Moon, ChevronDown,
    LogOut, Store as StoreIcon, HelpCircle, X,
} from 'lucide-react';
import { navItems } from '../config/nav';
import { usePermissions } from '../features/auth/PermissionContext';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/cn';
import CommandPalette from './CommandPalette';
import NotificationsMenu from './NotificationsMenu';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggle: toggleTheme } = useTheme();

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const { selectedStore, setSelectedStore } = useAdminStore();
    const [stores, setStores] = useState<StoreType[]>([]);
    const [storeOpen, setStoreOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('pos_sidebar_collapsed') === '1');

    const storeRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    useEffect(() => { localStorage.setItem('pos_sidebar_collapsed', collapsed ? '1' : '0'); }, [collapsed]);

    useEffect(() => {
        if (!isAdmin) return;
        storeApi.list().then((res) => {
            const data = res.data;
            setStores(Array.isArray(data) ? data : data?.items ?? []);
        }).catch(() => undefined);
    }, [isAdmin]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    // Close mobile drawer on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const { isHidden } = usePermissions();
    const role = user?.role ?? '';
    const filteredNav = navItems.filter((item) => item.roles.includes(role) && !isHidden(item.path));
    const sections = [...new Set(filteredNav.map((i) => i.section))];
    const pageTitle = navItems.find((n) => n.path === location.pathname)?.label
        ?? (location.pathname.startsWith('/customers/') ? 'Customer' : 'Daily Grocer');

    return (
        <div className="min-h-screen bg-background text-on-surface font-body">
            {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

            {/* Sidebar (navy brand surface) */}
            <aside
                data-collapsed={collapsed}
                className={cn(
                    'admin-sidebar fixed top-0 left-0 z-50 h-screen flex flex-col text-white',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                )}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 h-16 px-4 border-b border-white/10 shrink-0">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-white/10 ring-1 ring-white/15 text-white flex items-center justify-center">
                        <StoreIcon size={18} />
                    </div>
                    <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
                        <div className="font-headline font-extrabold text-white leading-tight truncate">{selectedStore ? selectedStore.name : 'Daily Grocer'}</div>
                        <div className="text-[11px] text-white/50">Admin Portal</div>
                    </div>
                    <button className="ml-auto lg:hidden text-white/70" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
                </div>

                {/* Store switcher (admins) */}
                {isAdmin && stores.length > 0 && (
                    <div className={cn('px-3 pt-3', collapsed && 'lg:hidden')} ref={storeRef}>
                        <div className="relative">
                            <button onClick={() => setStoreOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3 h-9 rounded-md border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors">
                                <span className="flex items-center gap-2 truncate"><StoreIcon size={14} className="text-white/70" />{selectedStore ? selectedStore.name : 'All stores'}</span>
                                <ChevronDown size={14} className="text-white/60" />
                            </button>
                            {storeOpen && (
                                <div className="absolute left-0 right-0 mt-1 z-20 max-h-60 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-md shadow-2xl">
                                    <button onClick={() => { setSelectedStore(null); setStoreOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container">All stores</button>
                                    {stores.map((s) => (
                                        <button key={s.id} onClick={() => { setSelectedStore({ id: s.id, name: s.name }); setStoreOpen(false); toast.success(`Switched to ${s.name}`); }}
                                            className={cn('block w-full text-left px-3 py-2 text-sm hover:bg-surface-container', selectedStore?.id === s.id ? 'text-primary font-semibold bg-primary/5' : 'text-on-surface')}>
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-3">
                    {sections.map((section) => (
                        <div key={section} className="mb-1">
                            <div className={cn('px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/35', collapsed && 'lg:hidden')}>{section}</div>
                            {filteredNav.filter((i) => i.section === section).map((item) => {
                                const Icon = item.icon;
                                const active = location.pathname === item.path;
                                return (
                                    <button key={item.label} onClick={() => navigate(item.path)} title={collapsed ? item.label : undefined}
                                        className={cn(
                                            'relative w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors mb-0.5',
                                            active ? 'bg-white/10 text-white font-semibold' : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
                                            collapsed && 'lg:justify-center lg:px-0',
                                        )}>
                                        {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-action-red" />}
                                        <Icon size={19} className={active ? 'text-white' : 'text-white/70'} />
                                        <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="border-t border-white/10 p-3 shrink-0">
                    <button onClick={() => toast('Support: support@dailygrocer.co.uk')} title="Support"
                        className={cn('w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm font-medium text-white/65 hover:bg-white/[0.07] hover:text-white', collapsed && 'lg:justify-center lg:px-0')}>
                        <HelpCircle size={19} /><span className={cn(collapsed && 'lg:hidden')}>Support</span>
                    </button>
                    <button onClick={logout} title="Sign out"
                        className={cn('w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm font-medium text-white/65 hover:bg-action-red/20 hover:text-white', collapsed && 'lg:justify-center lg:px-0')}>
                        <LogOut size={19} /><span className={cn(collapsed && 'lg:hidden')}>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div data-collapsed={collapsed} className="admin-main flex flex-col min-h-screen">
                <header className="sticky top-0 z-30 h-16 flex items-center gap-2 px-4 lg:px-6 border-b border-outline-variant backdrop-blur"
                    style={{ background: 'color-mix(in srgb, var(--bg-secondary) 82%, transparent)' }}>
                    <button className="lg:hidden text-on-surface-variant p-1" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
                    <button className="hidden lg:inline-flex text-on-surface-variant p-1 hover:text-on-surface" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
                        {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                    <h1 className="font-headline text-lg font-extrabold text-on-surface truncate">{pageTitle}</h1>

                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container text-sm">
                            <Search size={16} />
                            <span className="hidden md:inline">Search</span>
                            <kbd className="hidden md:inline text-[10px] font-semibold border border-outline-variant rounded px-1 ml-1">⌘K</kbd>
                        </button>
                        <NotificationsMenu />
                        <button onClick={toggleTheme} aria-label="Toggle theme"
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-on-surface-variant border border-outline-variant bg-surface-container-lowest hover:bg-surface-container hover:text-on-surface">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* User menu */}
                        <div className="relative" ref={userRef}>
                            <button onClick={() => setUserOpen((o) => !o)} className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md hover:bg-surface-container">
                                <span className="h-7 w-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">{user?.full_name?.charAt(0).toUpperCase() ?? 'U'}</span>
                                <ChevronDown size={14} className="text-on-surface-variant hidden sm:inline" />
                            </button>
                            {userOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-2xl z-[1000] overflow-hidden">
                                    <div className="px-4 py-3 border-b border-outline-variant">
                                        <div className="text-sm font-semibold text-on-surface truncate">{user?.full_name}</div>
                                        <div className="text-xs text-on-surface-variant capitalize">{user?.role}</div>
                                    </div>
                                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container">
                                        <LogOut size={16} /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            <CommandPalette role={role} />
        </div>
    );
}
