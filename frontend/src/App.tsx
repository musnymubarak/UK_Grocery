/**
 * App root — routing, auth protection, query provider.
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
import ShopLayout from './features/shop/ShopLayout';
import ShopHome from './features/shop/ShopHome';
import ShopCart from './features/shop/ShopCart';
import ShopLogin from './features/shop/ShopLogin';
import ShopRegister from './features/shop/ShopRegister';
import DeliveryBoyDashboard from './features/delivery/DeliveryBoyDashboard';

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
            {/* B2C Public Shop Routes */}
            <Route path="/shop" element={<ShopLayout />}>
                <Route index element={<ShopHome />} />
                <Route path="cart" element={<ShopCart />} />
                <Route path="login" element={<ShopLogin />} />
                <Route path="register" element={<ShopRegister />} />
            </Route>

            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
            
            {/* Delivery Boy Mobile Interface could have a different layout, here we simplify to default layout */}
            
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                {/* Conditionally render dashboard based on role entirely */}
                <Route path="/dashboard" element={user?.role === 'delivery_boy' ? <DeliveryBoyDashboard /> : <DashboardPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/delivery-zones" element={<DeliveryZonesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit" element={<AuditLogPage />} />
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
