import { Category, Product, Store, Order } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'fruits-veg',
    name: 'Fruits & Vegetables',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800',
    badge: 'New Season'
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    image: 'https://theloopywhisk.com/wp-content/uploads/2018/04/Are-Eggs-Dairy_663px-2.jpg.webp'
  },
  {
    id: 'bakery',
    name: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    badge: 'Freshly Baked'
  },
  {
    id: 'meat-seafood',
    name: 'Meat & Seafood',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'snacks',
    name: 'Snacks',
    image: 'https://zbga.shopsuki.ph/cdn/shop/files/108977447_3211d965-ae89-44ab-bff0-22c4e13c42ef_1024x.jpg?v=1759749524'
  },
  {
    id: 'beverages',
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'frozen',
    name: 'Frozen Foods',
    image: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'household',
    name: 'Household',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Fairtrade Organic Bananas',
    description: 'Bunch of 5 • approx 500g',
    price: 1.20,
    unit: 'bunch',
    image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg',
    isOrganic: true
  },
  {
    id: '2',
    name: 'Baby Leaf Spinach',
    description: '250g bag',
    price: 1.85,
    unit: 'bag',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg',
    isOrganic: true
  },
  {
    id: '3',
    name: 'Heritage Vine Tomatoes',
    description: '400g pack',
    price: 3.50,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg',
    isNewSeason: true
  },
  {
    id: '4',
    name: 'British Asparagus Spears',
    description: '250g bundle',
    price: 2.20,
    unit: 'bundle',
    image: 'https://images.unsplash.com/photo-1515471204579-475f82e90e27?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg'
  },
  {
    id: '5',
    name: 'Conference Pears',
    description: 'Pack of 4',
    price: 2.00,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1631160299919-6a175aa6d189?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg'
  },
  {
    id: '6',
    name: 'Organic Blueberries',
    description: '150g punnet',
    price: 3.15,
    unit: 'punnet',
    image: 'https://images.unsplash.com/photo-1497534446932-c946e7316a33?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg',
    isOrganic: true
  },
  {
    id: '7',
    name: 'Artisan Sourdough',
    description: '800g Loaf • Freshly Baked',
    price: 4.50,
    unit: 'loaf',
    image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80&w=800',
    category: 'bakery',
    isFreshlyBaked: true
  },
  {
    id: '8',
    name: 'Organic Heritage Carrots',
    description: '500g Bundle • Locally Sourced',
    price: 2.49,
    unit: 'bundle',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800',
    category: 'fruits-veg',
    isOrganic: true
  },
  {
    id: '9',
    name: 'Cold Pressed Olive Oil',
    description: '500ml • Extra Virgin',
    price: 12.99,
    unit: 'bottle',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800',
    category: 'household'
  }
];

export const STORES: Store[] = [
  {
    id: 'central',
    name: 'Harvest & Hearth - Central',
    address: '12 Mayfair Lane',
    city: 'London',
    postcode: 'SW1A 1AA',
    openUntil: '10 PM',
    isNearest: true
  },
  {
    id: 'kensington',
    name: 'The Conservatory - Kensington',
    address: '84 High Street',
    city: 'London',
    postcode: 'W8 4SG',
    openUntil: '11 PM'
  },
  {
    id: 'chelsea',
    name: 'Botanical Pantry - Chelsea',
    address: "21 King's Road",
    city: 'London',
    postcode: 'SW3 4TR',
    openUntil: '10 PM'
  }
];

export const ORDERS: Order[] = [
  {
    id: 'TC-88219',
    date: 'March 14, 2024',
    status: 'In Progress',
    total: 54.20,
    items: [],
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'TC-87902',
    date: 'March 08, 2024',
    status: 'Delivered',
    total: 32.15,
    items: [],
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'TC-87544',
    date: 'Feb 28, 2024',
    status: 'Delivered',
    total: 128.50,
    items: [],
    image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&q=80&w=800'
  }
];
