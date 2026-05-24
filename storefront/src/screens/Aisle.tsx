import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import SmartTransparentImage from '../components/SmartTransparentImage';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../CartContext';
import { catalogApi } from '../services/api';
import { Search } from 'lucide-react';

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
  const { selectedStore } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [subCategories, setSubCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    catalogApi
      .getProducts({
        category_id: id,
        store_id: selectedStore?.id,
      })
      .then((res) => {
        const items = res.data.items || res.data || [];
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

  useEffect(() => {
    if (!id) return;
    catalogApi
      .getCategories()
      .then((res) => {
        const cats = res.data;
        const currentCat = cats.find((c: any) => c.id === id);
        if (currentCat) setCategoryName(currentCat.name);

        const children = cats.filter((c: any) => c.parent_id === id);
        setSubCategories(children);
      })
      .catch(() => {});
  }, [id]);

  const getSubCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=001d3d&color=fff&size=400`;
  };

  if (loading) {
    return (
      <Layout title={categoryName || 'Products'} showBack>
        <div className="flex items-center justify-center min-h-[60vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={categoryName || 'Products'} showBack>
      <div className="px-4 py-4 pb-32">
        {/* Search bar */}
        <div className="relative mb-5">
          <span className="absolute inset-y-0 left-3 flex items-center text-outline">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={`Search in ${categoryName || 'this aisle'}...`}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-3 pl-10 pr-3 text-[15px] text-text-main outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue placeholder:text-outline transition-colors"
          />
        </div>

        {/* Subcategory grid (reference card style) */}
        {subCategories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {subCategories.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  to={`/aisle/${sub.id}`}
                  className="group ref-card-xl overflow-hidden flex flex-col items-center justify-center p-3 hover:border-action-blue transition-colors h-full min-h-[150px] sm:min-h-[180px]"
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-surface-container-low flex items-center justify-center overflow-hidden mb-2 p-2">
                    <SmartTransparentImage
                      src={getSubCategoryImage(sub)}
                      alt={sub.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-label-bold text-text-main text-center group-hover:text-action-blue transition-colors line-clamp-2 leading-tight">
                    {sub.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Product grid */}
        {subCategories.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  unit: product.unit || 'each',
                  image: product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=001d3d&color=fff&size=400`,
                  description: product.description || '',
                  category: product.category_id || '',
                  stock: product.stock,
                  is_age_restricted: product.is_age_restricted,
                }}
              />
            ))}
          </div>
        )}

        {subCategories.length === 0 && products.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="text-base">No products in this category yet.</p>
            <Link to="/browse" className="text-action-blue font-semibold mt-3 inline-block">
              Browse other aisles
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
