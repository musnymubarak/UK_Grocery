/**
 * Core TypeScript types for the POS system.
 */

// --- Auth ---
export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: User;
}

// --- User ---
export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'manager' | 'cashier' | 'super_admin' | 'delivery_boy';
    phone?: string;
    organization_id: string;
    store_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// --- Organization ---
export interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    contact_email?: string;
    created_at: string;
}

// --- Store ---
export interface Store {
    id: string;
    organization_id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
}

// --- Category ---
export interface Category {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    parent_id?: string;
    sort_order: number;
    created_at: string;
}

// --- Product ---
export interface Product {
    id: string;
    organization_id: string;
    category_id?: string;
    name: string;
    description?: string;
    sku: string;
    barcode?: string;
    qr_code_data?: string;
    cost_price: number;
    selling_price: number;
    tax_rate: number;
    unit: string;
    low_stock_threshold: number;
    image_url?: string;
    created_at: string;
    updated_at: string;
}

// --- Inventory ---
export interface InventoryItem {
    id: string;
    product_id: string;
    store_id: string;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    product_name?: string;
    product_sku?: string;
    created_at: string;
}

// --- Sale ---
export interface SaleItemCreate {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
}

export interface SaleCreate {
    store_id: string;
    items: SaleItemCreate[];
    discount_amount: number;
    payment_method: string;
    notes?: string;
    client_id?: string;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id?: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    created_at: string;
}

export interface Sale {
    id: string;
    store_id: string;
    user_id?: string;
    invoice_number: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    status: string;
    payment_method: string;
    notes?: string;
    client_id?: string;
    items: SaleItem[];
    created_at: string;
}

// --- PreOrder ---
export interface PreOrderItem {
    id: string;
    preorder_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes?: string;
    created_at: string;
}

export interface PreOrder {
    id: string;
    store_id: string;
    preorder_number: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    notes?: string;
    status: 'pending' | 'ready' | 'completed' | 'cancelled';
    pickup_date: string;
    pickup_time?: string;
    total_amount: number;
    deposit_paid: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    items: PreOrderItem[];
}

// --- Cart (local) ---
export interface CartItem {
    product: Product;
    quantity: number;
    discount_amount: number;
}

// --- Sync ---
export interface SyncAction {
    id: string;
    action_type: string;
    entity_type: string;
    payload: Record<string, any>;
    timestamp: string;
    client_entity_id?: string;
    sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
}

// --- Paginated ---
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}
