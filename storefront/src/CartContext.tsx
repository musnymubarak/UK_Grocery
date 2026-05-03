import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
  unit: string;
  is_age_restricted?: boolean;
}

export interface SelectedStore {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  openUntil: string;
  is_open: boolean;
  lat?: number;
  lng?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  hasAgeRestrictedItems: boolean;
  selectedStore: SelectedStore | null;
  setSelectedStore: (store: SelectedStore) => void;
}

const CART_KEY = 'dg_cart';
const STORE_KEY = 'dg_store';

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage(CART_KEY, []));
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(() => loadFromStorage(STORE_KEY, null));

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Persist selected store to localStorage on every change
  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem(STORE_KEY, JSON.stringify(selectedStore));
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  }, [selectedStore]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_KEY);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasAgeRestrictedItems = cart.some(item => item.is_age_restricted);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, hasAgeRestrictedItems, selectedStore, setSelectedStore }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
