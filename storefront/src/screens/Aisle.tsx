import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import SmartTransparentImage from '../components/SmartTransparentImage';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../CartContext';
import { catalogApi } from '../services/api';
import { Loader2, Search } from 'lucide-react';

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

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
}

export default function Aisle() {
  const { id } = useParams();
  const { totalItems, totalPrice, selectedStore } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [subCategories, setSubCategories] = useState<Category[]>([]);

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

  // Fetch all categories and filter subcategories
  useEffect(() => {
    if (!id) return;
    catalogApi.getCategories()
      .then(res => {
        const cats = res.data;
        const currentCat = cats.find((c: any) => c.id === id);
        if (currentCat) setCategoryName(currentCat.name);
        
        const children = cats.filter((c: any) => c.parent_id === id);
        setSubCategories(children);
      })
      .catch(() => {});
  }, [id]);

  // Helper for subcategory images (similar to Home.tsx)
  const getSubCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=1E40AF&color=fff&size=400`;
  };

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
        
        {/* Search Bar - Matching user reference */}
        <div className="relative mt-2 mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary/40">
            <Search size={20} strokeWidth={1.5} />
          </div>
          <input 
            type="text" 
            placeholder={`Search in ${categoryName}...`}
            className="w-full bg-white border border-outline-variant/40 rounded-xl py-3 pl-12 pr-4 text-base text-on-surface outline-none focus:border-primary/50 placeholder:text-secondary/40 transition-all shadow-sm"
          />
        </div>


        {/* Subcategory Navigation (Diamond Style) */}
        {subCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
            {subCategories.map((sub, index) => {
              // Same gradient logic as Home.tsx
              const categoryGradients: Record<string, string> = {
                'wine': 'from-purple-800 via-rose-900 to-red-950',
                'spirits': 'from-amber-600 via-orange-700 to-yellow-900',
                'beer': 'from-yellow-600 via-amber-700 to-orange-800',
                'cider': 'from-yellow-600 via-amber-700 to-orange-800',
                'rtd': 'from-pink-500 via-rose-600 to-indigo-700',
                'chilled': 'from-sky-100 via-indigo-200 to-blue-300',
                'dairy': 'from-sky-100 via-indigo-200 to-blue-300',
                'pantry': 'from-orange-500 via-amber-700 to-yellow-900',
                'ambient': 'from-orange-500 via-amber-700 to-yellow-900',
                'bakery': 'from-orange-500 via-amber-700 to-yellow-900',
                'confectionery': 'from-pink-500 via-rose-600 to-red-800',
                'default': 'from-primary via-blue-700 to-indigo-900'
              };

              const subName = sub.name.toLowerCase();
              const gradientKey = Object.keys(categoryGradients).find(k => subName.includes(k)) || 'default';
              const gradientClass = categoryGradients[gradientKey];
              const isLight = gradientKey === 'chilled' || gradientKey === 'dairy';

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/aisle/${sub.id}`} className="group block">
                    <div className="relative h-40 sm:h-44 overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-300 active:scale-[0.98] border border-outline-variant/30">
                      
                      {/* Right side image container - Smart Transparency */}
                      <div className="absolute right-0 top-0 bottom-0 w-[50%] flex items-center justify-center z-0 p-4">
                        <SmartTransparentImage 
                          src={getSubCategoryImage(sub)} 
                          alt={sub.name}
                          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.1]"
                        />
                      </div>

                      {/* Left colored diamond block */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[60%] z-10 flex items-center px-6 sm:px-10 shadow-2xl bg-gradient-to-br ${gradientClass} overflow-hidden`} style={{ clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent mix-blend-overlay"></div>
                        <h3 className={`relative text-3xl sm:text-4xl pr-4 font-black leading-[1] drop-shadow-md z-20 ${isLight ? 'text-primary' : 'text-white'}`}>
                          {sub.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Product Grid - Only show if no subcategories or we are in a subcategory */}
        {subCategories.length === 0 && (
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
        )}

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
