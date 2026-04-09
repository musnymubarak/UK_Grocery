export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  isOrganic?: boolean;
  isNewSeason?: boolean;
  isFreshlyBaked?: boolean;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  badge?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'In Progress' | 'Delivered' | 'Cancelled';
  total: number;
  items: CartItem[];
  image: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  openUntil: string;
  isNearest?: boolean;
}
