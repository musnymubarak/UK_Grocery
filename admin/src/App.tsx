/**
 * App root — routing, auth protection, query provider.
 * Admin Dashboard — staff/admin only.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { AdminStoreProvider } from './features/auth/AdminStoreContext';
import Layout from './components/Layout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductsPage from './features/products/ProductsPage';
import CategoriesPage from './features/categories/CategoriesPage';
import InventoryPage from './features/inventory/InventoryPage';
import ReportsPage from './features/reports/ReportsPage';
import StoresPage from './features/stores/StoresPage';
import UsersPage from './features/users/UsersPage';
import AuditLogPage from './features/audit/AuditLogPage';
import OrdersPage from './features/orders/OrdersPage';
import CustomersPage from './features/customers/CustomersPage';
import DeliveryZonesPage from './features/delivery/DeliveryZonesPage';
import DeliveryBoyDashboard from './features/delivery/DeliveryBoyDashboard';
import CouponsPage from './features/coupons/CouponsPage';
import PlatformSettingsPage from './features/settings/PlatformSettingsPage';
import RewardsPage from './features/rewards/RewardsPage';
import WebhooksPage from './features/webhooks/WebhooksPage';
import BannersPage from './features/banners/BannersPage';
import ReviewsPage from './features/reviews/ReviewsPage';
import RefundsPage from './features/refunds/RefundsPage';
import SystemHealthPage from './features/system/SystemHealthPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    const { isAuthenticated, user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={user?.role === 'delivery_boy' ? <DeliveryBoyDashboard /> : <DashboardPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/delivery-zones" element={<DeliveryZonesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit" element={<AuditLogPage />} />
                <Route path="/settings" element={<PlatformSettingsPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/banners" element={<BannersPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/refunds" element={<RefundsPage />} />
                <Route path="/system" element={<SystemHealthPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AdminStoreProvider>
                    <BrowserRouter>
                        <AppRoutes />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                },
                            }}
                        />
                    </BrowserRouter>
                </AdminStoreProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
