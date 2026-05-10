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
  is_age_restricted?: boolean;
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
              is_age_restricted: product.is_age_restricted
            }} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant">
            <p className="text-lg">No products in this category yet.</p>
            <Link to="/browse" className="text-primary font-bold mt-4 inline-block">Browse other aisles</Link>
          </div>
        )}


      </div>
    </Layout>
  );
}
