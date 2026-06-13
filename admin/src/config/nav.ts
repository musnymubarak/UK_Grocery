import {
    LayoutDashboard, Package, Warehouse, BarChart3, Users, Tags, MapPin,
    Store as StoreIcon, FileSearch, ShoppingBag, Users2, Truck, Ticket, Tag,
    Megaphone, Settings, Star, Webhook, Image, LayoutGrid, MessageSquare,
    RotateCcw, ShieldAlert, Factory, ClipboardList, KeyRound, Type, Palette,
    ScrollText, Navigation,
} from 'lucide-react';
import type { IconType } from '../components/ui/primitives';

export interface NavItem {
    label: string;
    section: string;
    path: string;
    icon: IconType;
    roles: string[];
}

/** Single source of truth for sidebar + command palette. Order defines grouping. */
export const navItems: NavItem[] = [
    { label: 'Dashboard', section: 'Main', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { label: 'Orders', section: 'Main', path: '/orders', icon: ShoppingBag, roles: ['admin', 'manager', 'cashier'] },
    { label: 'Customers', section: 'Main', path: '/customers', icon: Users2, roles: ['admin', 'manager'] },
    { label: 'Notifications', section: 'Main', path: '/notifications', icon: Megaphone, roles: ['admin', 'manager'] },
    { label: 'My Deliveries', section: 'Delivery', path: '/dashboard', icon: Truck, roles: ['delivery_boy'] },
    { label: 'Dispatch', section: 'Operations', path: '/dispatch', icon: Navigation, roles: ['admin', 'manager'] },
    { label: 'Drivers', section: 'Operations', path: '/drivers', icon: Truck, roles: ['admin', 'manager'] },
    { label: 'Delivery Zones', section: 'Operations', path: '/delivery-zones', icon: MapPin, roles: ['admin', 'manager'] },
    { label: 'Coupons', section: 'Operations', path: '/coupons', icon: Ticket, roles: ['admin', 'manager'] },
    { label: 'Promotions', section: 'Operations', path: '/promotions', icon: Tag, roles: ['admin', 'manager'] },
    { label: 'Rewards', section: 'Operations', path: '/rewards', icon: Star, roles: ['admin', 'manager'] },
    { label: 'Inventory', section: 'Operations', path: '/inventory', icon: Warehouse, roles: ['admin', 'manager'] },
    { label: 'Suppliers', section: 'Procurement', path: '/suppliers', icon: Factory, roles: ['admin', 'manager'] },
    { label: 'Purchase Orders', section: 'Procurement', path: '/purchase-orders', icon: ClipboardList, roles: ['admin', 'manager'] },
    { label: 'Products', section: 'Catalog', path: '/products', icon: Package, roles: ['admin', 'manager'] },
    { label: 'Categories', section: 'Catalog', path: '/categories', icon: Tags, roles: ['admin', 'manager'] },
    { label: 'Reports', section: 'Analytics', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { label: 'Stores', section: 'Admin', path: '/stores', icon: StoreIcon, roles: ['admin'] },
    { label: 'Users', section: 'Admin', path: '/users', icon: Users, roles: ['admin'] },
    { label: 'Roles & Permissions', section: 'Admin', path: '/roles', icon: KeyRound, roles: ['admin'] },
    { label: 'Audit Logs', section: 'Admin', path: '/audit', icon: FileSearch, roles: ['admin', 'manager'] },
    { label: 'Banners', section: 'Admin', path: '/banners', icon: Image, roles: ['admin', 'manager'] },
    { label: 'Home Layout', section: 'Admin', path: '/home-layout', icon: LayoutGrid, roles: ['admin', 'manager'] },
    { label: 'Storefront Content', section: 'Admin', path: '/content', icon: Type, roles: ['admin'] },
    { label: 'Announcement Bar', section: 'Admin', path: '/announcement', icon: Megaphone, roles: ['admin'] },
    { label: 'Branding', section: 'Admin', path: '/branding', icon: Palette, roles: ['admin'] },
    { label: 'Legal Pages', section: 'Admin', path: '/legal', icon: ScrollText, roles: ['admin'] },
    { label: 'Webhooks', section: 'Admin', path: '/webhooks', icon: Webhook, roles: ['admin'] },
    { label: 'Reviews', section: 'Admin', path: '/reviews', icon: MessageSquare, roles: ['admin', 'manager'] },
    { label: 'Refunds', section: 'Admin', path: '/refunds', icon: RotateCcw, roles: ['admin', 'manager'] },
    { label: 'System Health', section: 'Admin', path: '/system', icon: ShieldAlert, roles: ['admin'] },
    { label: 'Settings', section: 'Admin', path: '/settings', icon: Settings, roles: ['admin'] },
];
