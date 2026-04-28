/**
 * Axios API client with JWT auth interceptor and 401 auto-logout.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor: attach JWT token and clean params
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('pos_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Automatically remove empty/nullish query parameters to prevent FastAPI 422 errors
        if (config.params) {
            Object.keys(config.params).forEach((key) => {
                const val = config.params[key];
                if (val === '' || val === null || val === undefined) {
                    delete config.params[key];
                }
            });
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('pos_token');
            localStorage.removeItem('pos_user');
            // Only redirect/reload if we aren't already on the login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export function getErrorMessage(err: any, fallback = 'An error occurred'): string {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((e: any) => e.msg || e.type || 'Validation error').join('; ');
    }
    return err?.message || fallback;
}

// --- Auth API ---
export const authApi = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    setup: (data: any) => api.post('/auth/setup', data),
    me: () => api.get('/auth/me'),
    createUser: (data: any) => api.post('/auth/users', data),
    listUsers: () => api.get('/auth/users'),
    updateUser: (id: string, data: any) => api.put(`/auth/users/${id}`, data),
};

// --- Store API ---
export const storeApi = {
    list: () => api.get('/stores'),
    create: (data: any) => api.post('/stores', data),
    get: (id: string) => api.get(`/stores/${id}`),
    update: (id: string, data: any) => api.put(`/stores/${id}`, data),
    delete: (id: string) => api.delete(`/stores/${id}`),
};

// --- Product API ---
export const productApi = {
    list: (params?: any) => api.get('/products', { params }),
    create: (data: any) => api.post('/products', data),
    get: (id: string) => api.get(`/products/${id}`),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
    lowStock: (storeId?: string) => api.get('/products/low-stock', { params: { store_id: storeId } }),
    uploadImage: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post(`/products/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

// --- Category API ---
export const categoryApi = {
    list: () => api.get('/categories'),
    create: (data: any) => api.post('/categories', data),
    update: (id: string, data: any) => api.put(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`),
};

// --- Inventory API ---
export const inventoryApi = {
    getStoreInventory: (storeId: string, params?: any) => api.get(`/inventory/${storeId}`, { params }),
    adjust: (data: any) => api.post('/inventory/adjust', data),
    transfer: (data: any) => api.post('/inventory/transfer', data),
    purchase: (data: any) => api.post('/inventory/purchase', data),
    movements: (storeId: string, params?: any) => api.get(`/inventory/${storeId}/movements`, { params }),
};

// --- Reports API ---
export const reportApi = {
    salesSummary: (params?: any) => api.get('/reports/sales-summary', { params }),
    productPerformance: (params?: any) => api.get('/reports/product-performance', { params }),
    cashierPerformance: (params?: any) => api.get('/reports/cashier-performance', { params }),
    inventoryValuation: (params?: any) => api.get('/reports/inventory-valuation', { params }),
};

// --- Analytics / Audit API ---
export const auditApi = {
    list: (params?: any) => api.get('/audit', { params }),
    export: (params?: any) => api.get('/audit/export', { responseType: 'blob', params }),
};

// --- Orders API ---
export const orderApi = {
    list: (params?: any) => api.get('/orders', { params }),
    get: (id: string) => api.get(`/orders/${id}`),
    updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
    assignDelivery: (id: string, delivery_boy_id: string) => api.patch(`/orders/${id}/assign`, { delivery_boy_id }),
    deliveryList: (params?: any) => api.get('/orders/delivery/my-orders', { params }), // For delivery boys
    rejectSubstitutions: (orderId: string, data: any) => api.post(`/orders/${orderId}/reject-substitutions`, data),
};

// --- Customers API ---
export const customerApi = {
    list: (params?: any) => api.get('/customers', { params }),
    // Additional B2C routes exist, but admin primarily lists
};

// --- Delivery Zones API ---
export const deliveryZoneApi = {
    list: (storeId: string) => api.get(`/delivery-zones`, { params: { store_id: storeId } }),
    create: (storeId: string, data: any) => api.post(`/delivery-zones`, data, { params: { store_id: storeId } }),
};

// --- Coupons API ---
export const couponApi = {
    list: (params?: any) => api.get('/coupons', { params }),
    create: (data: any) => api.post('/coupons', data),
    update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
    delete: (id: string) => api.delete(`/coupons/${id}`),
};

// --- Config & Settings API ---
export const configApi = {
    list: () => api.get('/config/settings'),
    upsert: (data: any) => api.put('/config/settings', data),
};

// --- Feature Flags API ---
export const featureFlagApi = {
    list: () => api.get('/config/flags'),
    upsert: (data: any) => api.put('/config/flags', data),
};

// --- Rewards API ---
export const rewardsApi = {
    listTiers: () => api.get('/rewards/tiers'),
    createTier: (data: any) => api.post('/rewards/tiers', data),
    updateTier: (id: string, data: any) => api.put(`/rewards/tiers/${id}`, data),
    deleteTier: (id: string) => api.delete(`/rewards/tiers/${id}`)
};
// --- Analytics API ---
export const analyticsApi = {
    dashboard: () => api.get('/analytics/dashboard'),
    revenueChart: (params?: any) => api.get('/analytics/revenue-chart', { params }),
};

// --- Webhooks API ---
export const webhookApi = {
    list: () => api.get('/webhooks'),
    create: (data: any) => api.post('/webhooks', data),
    delete: (id: string) => api.delete(`/webhooks/${id}`),
    deliveries: (id: string) => api.get(`/webhooks/${id}/deliveries`),
};

// --- GDPR API ---
export const gdprApi = {
    anonymize: (id: string) => api.post(`/gdpr/admin/anonymize/${id}`),
};

// --- System Health API ---
export const healthApi = {
    check: () => api.get('/system/health'),
    ready: () => api.get('/system/ready'),
    metrics: () => api.get('/system/metrics'),
};

// --- Banners API ---
export const bannerApi = {
    list: () => api.get('/banners'),
    create: (data: any) => api.post('/banners', data),
    update: (id: string, data: any) => api.put(`/banners/${id}`, data),
    delete: (id: string) => api.delete(`/banners/${id}`),
};

// --- Reviews API ---
export const reviewApi = {
    list: (storeId: string) => api.get(`/reviews/store/${storeId}`),
    toggle: (id: string) => api.patch(`/reviews/${id}/toggle`),
    respond: (id: string, response: string) => api.patch(`/reviews/${id}/respond`, { response }),
    summary: (storeId: string) => api.get(`/reviews/store/${storeId}/summary`),
};

// --- Refunds API ---
export const refundApi = {
    list: (params?: any) => api.get('/refunds', { params }),
    processItem: (refundId: string, itemId: string, data: any) => 
        api.post(`/refunds/${refundId}/items/${itemId}/process`, data),
};

// --- Drivers API Expansion ---
export const driverApi = {
    available: (storeId?: string) => api.get('/drivers/available', { params: { store_id: storeId } }),
    updateAvailability: (data: { is_available: boolean }) => api.post('/drivers/me/availability', data),
};
