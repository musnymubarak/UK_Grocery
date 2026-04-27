import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../CartContext';
import { catalogApi } from '../services/api';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  unit?: string;
  image_url?: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  stock?: number;
}

export default function Aisle() {
  const { id } = useParams();
  const { totalItems, totalPrice, selectedStore } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    catalogApi.getProducts({ 
      category_id: id,
      store_id: selectedStore?.id 
    })
      .then(res => {
        const items = res.data.items || res.data || [];
        // deduplicate as a safety measure
        const uniqueItems = Array.from(new Map(items.map((item: any) => [item.id, item])).values());
        setProducts(uniqueItems as Product[]);
        if (uniqueItems.length > 0 && (uniqueItems[0] as Product).category_name) {
          setCategoryName((uniqueItems[0] as Product).category_name!);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id, selectedStore?.id]);

  // Also try to get category name if not from products
  useEffect(() => {
    if (!id || categoryName) return;
    catalogApi.getCategories()
      .then(res => {
        const cat = res.data.find((c: { id: string; name: string }) => c.id === id);
        if (cat) setCategoryName(cat.name);
      })
      .catch(() => {});
  }, [id, categoryName]);

  if (loading) {
    return (
      <Layout title="Loading..." showBack>
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={categoryName || 'Products'} showBack>
      <div className="max-w-7xl mx-auto px-6 pb-60">
        {/* Filter Chips */}
        <section className="py-6 overflow-x-auto no-scrollbar flex items-center gap-3">
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold transition-all">
            All Produce
          </button>
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-colors">
            Popular
          </button>
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-colors">
            Price: Low to High
          </button>
        </section>

        {/* Product Grid */}
        <div className="flex flex-col mt-4">
          {products.map(product => (
            <ProductCard key={product.id} product={{
              id: product.id,
              name: product.name,
              price: product.price,
              unit: product.unit || 'each',
              image: product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E40AF&color=fff&size=400`,
              description: product.description || '',
              category: product.category_id || '',
              stock: product.stock,
            }} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant">
            <p className="text-lg">No products in this category yet.</p>
            <Link to="/browse" className="text-primary font-bold mt-4 inline-block">Browse other aisles</Link>
          </div>
        )}

        {/* Sticky Cart Bar - Stacked above nav on mobile */}
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-[112px] md:bottom-6 left-0 w-full px-6 z-40 pointer-events-none"
          >
            <Link 
              to="/cart"
              className="max-w-md mx-auto pointer-events-auto bg-primary rounded-full py-4 px-8 flex justify-between items-center shadow-2xl active:scale-[0.98] transition-transform duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-on-primary font-bold">View Cart</span>
                <span className="w-1 h-1 bg-on-primary/40 rounded-full"></span>
                <span className="text-on-primary/90 text-sm">{totalItems} items</span>
              </div>
              <div className="text-on-primary font-headline font-extrabold text-lg">
                £{totalPrice.toFixed(2)}
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
