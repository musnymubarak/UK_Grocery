/**
 * UI constants — static content and configuration.
 * Product/category/store data is now fetched from the backend API.
 */

// Placeholder images for categories without uploaded images
export const CATEGORY_IMAGES: Record<string, string> = {
  'fruits-veg': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800',
  'dairy-eggs': 'https://theloopywhisk.com/wp-content/uploads/2018/04/Are-Eggs-Dairy_663px-2.jpg.webp',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
  'meat-seafood': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=800',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800',
  'beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
  'frozen': 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=800',
  'household': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
};

// App configuration
export const APP_CONFIG = {
  name: 'The Conservatory',
  tagline: 'Fresh groceries delivered to your door',
  currency: '£',
  deliveryFee: 3.99,
  freeDeliveryThreshold: 50,
};
