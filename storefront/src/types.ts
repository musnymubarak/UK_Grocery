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
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  is_active?: boolean;
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
}
