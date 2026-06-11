export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  image_url?: string;
  category_id?: string;
  category_name?: string;
  is_active?: boolean;

  // shop.md extensions
  member_price?: number;
  promo_price?: number;
  is_age_restricted?: boolean;
  allergens?: string[];
  nutritional_info?: any;
  weight_unit?: string;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  is_active?: boolean;

  // shop.md extensions
  slug?: string;
  store_type?: string;
  logo_url?: string;
  banner_url?: string;
  delivery_fee?: number;
  free_delivery_threshold?: number;
  min_order_value?: number;
  is_open?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
  unit: string;
}

export interface Order {
  id: string;
  status: string;
  total_amount?: number;
  created_at: string;
  items?: Array<{
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price?: number;
  }>;

  // shop.md extensions
  order_type: string;
  service_fee: number;
  tip_amount: number;
  coupon_code?: string;
}

// ─── Server-Driven Home Layout ───────────────────────────────────
// Mirrors the backend contract for GET /storefront/home-layout.

export type SectionActionType =
  | 'category'
  | 'product'
  | 'search'
  | 'offers'
  | 'url'
  | 'none';

export interface SectionAction {
  type: SectionActionType;
  value?: string | null;
  label?: string | null;
}

export interface SectionItem {
  image_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  badge?: string | null;
  action?: SectionAction | null;
}

// Resolved category as returned inside a category_grid section config.
export interface SectionCategory {
  id: string;
  name: string;
  image_url?: string | null;
  parent_id?: string | null;
}

// Config payloads differ per section type; the renderer narrows by `type`.
export interface SectionConfig {
  // hero_slider | banner_strip | promo_grid
  autoplay?: boolean;
  interval_ms?: number;
  aspect_ratio?: string | null;
  columns?: number | null;
  items?: any[]; // SectionItem[] | SectionCategory[] | Product[] depending on type
  // product_carousel
  source?: Record<string, any>;
  see_all?: SectionAction | null;
}

// A fully resolved section ready to render (ResolvedSection in the contract).
export interface HomeSection {
  id: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  config: SectionConfig;
}

export interface HomeLayout {
  sections: HomeSection[];
}
