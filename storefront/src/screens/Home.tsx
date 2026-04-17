import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';
import { useCart } from '../CartContext';

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

export default function Home() {
  const { selectedStore } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    catalogApi.getCategories()
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load categories');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      catalogApi.getProducts({ 
        search: searchQuery, 
        store_id: selectedStore?.id,
        limit: 12 
      })
        .then(res => {
          setSearchResults(res.data.items || []);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fallback images for categories without images
  const categoryImages: Record<string, string> = {
    'fruits': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800',
    'dairy': 'https://theloopywhisk.com/wp-content/uploads/2018/04/Are-Eggs-Dairy_663px-2.jpg.webp',
    'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=800',
    'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800',
    'beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
    'frozen': 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=800',
    'household': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    // Try to match by name keyword
    const key = Object.keys(categoryImages).find(k => cat.name.toLowerCase().includes(k));
    return key ? categoryImages[key] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] py-16">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-surface-variant">
          <p className="text-lg mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary font-bold">Try again</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-32">
        {/* Search Section */}
        <section className="mb-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-primary">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search for fresh organic produce..."
              className="w-full bg-surface-container-high border-none rounded-xl py-5 pl-14 pr-6 text-on-surface focus:ring-2 focus:ring-primary/20 placeholder-secondary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-5 flex items-center">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            )}
          </div>
        </section>

        {searchQuery ? (
          /* Search Results Section */
          <section className="mb-20 min-h-[40vh]">
             <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">Search Results</h2>
                <p className="text-secondary font-medium">Found {searchResults.length} items for "{searchQuery}"</p>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {searchResults.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-container-low p-4 rounded-xl border border-outline-variant hover:border-primary transition-all group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface line-clamp-1">{product.name}</h4>
                    <p className="text-secondary text-xs mb-2">Each</p>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-on-surface">£{Number(product.selling_price).toFixed(2)}</span>
                      <Link to={`/aisle/${product.category_id}`} className="text-primary text-[10px] font-bold uppercase tracking-wider">View</Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : !isSearching && (
              <div className="text-center py-10 text-secondary">
                <p>No products found matching your search.</p>
              </div>
            )}
          </section>
        ) : (
          /* Category Grid */
          <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">Aisles & Collections</h2>
              <p className="text-secondary font-medium">Curated selections from the conservatory</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
              >
                <Link to={`/aisle/${category.id}`} className="group block h-full">
                  <div className="relative aspect-square overflow-hidden rounded-[1.8rem] bg-surface-container shadow-sm group-hover:shadow-[0_20px_40px_rgba(44,104,46,0.12)] transition-all duration-700 active:scale-[0.98]">
                    <img 
                      src={getCategoryImage(category)} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[0.9] group-hover:brightness-100"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Compact 'Well-Arranged' Glassmorphism Overlay */}
                    <div className="absolute inset-x-2 bottom-2 rounded-[1.4rem] bg-white/10 backdrop-blur-2xl border border-white/30 p-2 sm:p-2.5 shadow-[inset_0_0_8px_rgba(255,255,255,0.2)]">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[10px] sm:text-[12px] font-bold text-white tracking-tight leading-tight line-clamp-1 flex-1">
                          {category.name}
                        </h3>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-primary flex-shrink-0 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-3.5 sm:h-3.5">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-20 text-on-surface-variant">
              <p className="text-lg">No categories available yet. Check back soon!</p>
            </div>
          )}
        </section>
        )}

        {/* Editorial Block */}
        <section className="my-20">
          <div className="bg-primary rounded-lg overflow-hidden flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-10 md:p-16 text-on-primary">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">Seasonal Guide</span>
              <h2 className="text-4xl font-extrabold tracking-tighter mb-6 leading-tight">The Winter Harvest Kitchen</h2>
              <p className="text-on-primary/80 mb-8 leading-relaxed max-w-md text-lg">
                Discover the best seasonal ingredients arriving at the Central store this week. Fresh from local British farms.
              </p>
              <button className="bg-surface text-primary px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95">
                Read the Journal
              </button>
            </div>
            <div className="w-full md:w-1/2 h-[300px] md:h-full min-h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
                alt="Winter Harvest"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
