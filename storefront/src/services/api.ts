/**
 * Storefront API client — communicates with backend endpoints.
 * Public endpoints (browsing) require no auth.
 * Customer endpoints (orders, profile) require customer JWT.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach customer JWT if present
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_data');
      // Don't force redirect — let the UI handle it gracefully
      window.dispatchEvent(new Event('auth_expired'));
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Public Storefront Endpoints (no auth) ────────────────────────

export const catalogApi = {
  getProducts: (params?: {
    category_id?: string;
    store_id?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }) => api.get('/storefront/products', { params }),

  getProduct: (id: string) => api.get(`/storefront/products/${id}`),

  getCategories: () => api.get('/storefront/categories'),

  getStores: () => api.get('/storefront/stores'),

  getStoreStock: (storeId: string, params?: {
    category_id?: string;
    skip?: number;
    limit?: number;
  }) => api.get(`/storefront/stores/${storeId}/stock`, { params }),

  calculateDeliveryFee: (data: {
    store_id: string;
    postcode: string;
  }) => api.post('/delivery/calculate-fee', data),
};

// ─── Customer Auth Endpoints ──────────────────────────────────────

export const customerAuthApi = {
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post('/customers/register', data),

  login: (data: {
    email: string;
    password: string;
  }) => api.post('/customers/login', data),

  getProfile: () => api.get('/customers/me'),

  updateProfile: (data: {
    name?: string;
    full_name?: string;
    phone?: string;
  }) => api.put('/customers/me', {
    full_name: data.full_name || data.name,
    phone: data.phone
  }),

  addAddress: (data: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postcode: string;
    is_default?: boolean;
  }) => api.post('/customers/me/addresses', {
    street: data.line1 + (data.line2 ? `, ${data.line2}` : ''),
    city: data.city,
    state: data.state || '',
    postcode: data.postcode,
    is_default: data.is_default || false
  }),

  removeAddress: (id: string) => api.delete(`/customers/me/addresses/${id}`),
  
  setDefaultAddress: (id: string) => api.put(`/customers/me/addresses/${id}/default`),
};

// ─── Customer Order Endpoints (auth required) ────────────────────

export const orderApi = {
  checkout: (storeId: string, data: {
    items: Array<{
      product_id: string;
      quantity: number;
    }>;
    delivery_address_id?: string;
    delivery_address?: string;
    delivery_postcode?: string;
    payment_method?: string;
    coupon_code?: string;
    notes?: string;
  }) => api.post(`/orders/checkout?store_id=${storeId}`, data),

  myOrders: () => api.get('/orders/me'),
  
  getMyOrder: (id: string) => api.get(`/orders/me/${id}`),
};

export const couponApi = {
  validate: (data: {
    code: string;
    store_id: string;
    subtotal: number;
    delivery_fee: number;
  }) => api.post('/coupons/validate', data),
};

export const rewardsApi = {
  myProgress: () => api.get('/rewards/me/progress'),
};

// ─── Helpers ─────────────────────────────────────────────────────

export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((e: { msg?: string; type?: string }) => e.msg || e.type || 'Validation error').join('; ');
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
// ─── Wallet Endpoints ────────────────────────────────────────────
export const walletApi = {
  getBalance: () => api.get('/wallet/me'),
};

// ─── Notification Endpoints ──────────────────────────────────────
export const notificationApi = {
  list: () => api.get('/notifications/me'),
  getCount: () => api.get('/notifications/me/count'),
};

// ─── Review Endpoints ────────────────────────────────────────────
export const reviewApi = {
  submit: (data: any) => api.post('/reviews', data),
  getStoreReviews: (storeId: string) => api.get(`/reviews/store/${storeId}`),
  getStoreSummary: (storeId: string) => api.get(`/reviews/store/${storeId}/summary`),
};

// ─── Refund Endpoints ────────────────────────────────────────────
export const refundApi = {
  request: (data: any) => api.post('/refunds/request', data),
};

// ─── GDPR Endpoints ─────────────────────────────────────────────
export const gdprApi = {
  export: () => api.get('/gdpr/export', { responseType: 'blob' }),
  forgetMe: () => api.delete('/gdpr/forget-me'),
};

// ─── Order Expansion ────────────────────────────────────────────
// Note: orderApi was already defined, adding cancel method to it
export const orderActionsApi = {
  cancel: (id: string) => api.post(`/orders/me/${id}/cancel`),
};
