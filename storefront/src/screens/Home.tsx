import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, Loader2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';
import { useCart } from '../CartContext';
import bakeryImg from '../../images/categories/bakery.png';
import beveragesImg from '../../images/categories/bevarages.png';
import dairyImg from '../../images/categories/dairy&eggs.png';
import foodImg from '../../images/categories/food.png';
import produceImg from '../../images/categories/freshproduce.png';
import frozenImg from '../../images/categories/frozenfood.png';
import householdImg from '../../images/categories/household.png';
import meatImg from '../../images/categories/meat&poultry.png';
import pantryImg from '../../images/categories/pantryessentials.png';

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
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    Promise.all([
      catalogApi.getCategories(),
      catalogApi.getBanners(selectedStore?.id)
    ])
      .then(([catRes, bannerRes]) => {
        setCategories(catRes.data);
        setBanners(bannerRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load application data');
        setLoading(false);
      });
  }, [selectedStore?.id]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

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

  // Local custom images for categories
  const categoryImages: Record<string, string> = {
    'fruits': produceImg,
    'produce': produceImg,
    'dairy': dairyImg,
    'egg': dairyImg,
    'bakery': bakeryImg,
    'poultry': meatImg,
    'meat': meatImg,
    'snacks': foodImg,
    'pantry': pantryImg,
    'frozen': frozenImg,
    'household': householdImg,
    'beverage': beveragesImg,
    // Put 'food' at the end so 'frozen food' matches 'frozen' first
    'food': foodImg,
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    // Try to match by name keyword
    const key = Object.keys(categoryImages).find(k => cat.name.toLowerCase().includes(k));
    return key ? categoryImages[key] : foodImg;
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
        {/* Hero Banners */}
        {banners.length > 0 && (
          <section className="mb-12 relative h-[300px] md:h-[450px] overflow-hidden rounded-3xl group">
            <AnimatePresence mode="wait">
              <motion.div
                key={banners[currentBanner].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img 
                  src={banners[currentBanner].image_url} 
                  alt={banners[currentBanner].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex flex-col justify-center px-10 md:px-20 text-white">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-lg"
                  >
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tighter">
                      {banners[currentBanner].title}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 mb-8 font-medium">
                      {banners[currentBanner].subtitle}
                    </p>
                    <Link 
                      to={banners[currentBanner].link_url || '/browse'}
                      className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                      Shop Now <ArrowRight size={20} />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentBanner(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentBanner ? 'w-8 bg-primary' : 'w-2 bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Search Section */}
        <section className="mb-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-primary">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search for fresh produce..."
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
              <p className="text-secondary font-medium">Curated selections for your kitchen</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {categories.map((category, index) => {
              const bgColorClass = 'bg-gradient-to-br from-primary via-tertiary to-primary-container border-r border-primary-container/20';
              
              return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
              >
                <Link to={`/aisle/${category.id}`} className="group block h-full">
                  <div className="relative h-36 sm:h-44 overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-[0_12px_32px_rgba(30,64,175,0.12)] transition-all duration-300 active:scale-[0.98] border border-outline-variant/30">
                    
                    {/* Right side image container (60% ratio) */}
                    <div className="absolute right-0 top-0 bottom-0 w-[60%] p-5 sm:p-8 flex items-center justify-center">
                      <img 
                        src={getCategoryImage(category)} 
                        alt={category.name}
                        className="w-[85%] h-[85%] object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.15] group-hover:-rotate-2"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Left colored block with sharp diamond edge */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[55%] z-10 flex items-center px-6 sm:px-8 shadow-2xl ${bgColorClass} overflow-hidden`} style={{ clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' }}>
                      {/* Subtle gradient overlay to enhance the colored effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent mix-blend-overlay"></div>
                      <h3 className="relative text-2xl sm:text-3xl lg:text-4xl pr-4 font-black text-white leading-[1.1] drop-shadow-md z-20">
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Floating decorative element (Optional) */}
                    <div className="absolute top-3 right-3 bg-error text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      VIEW
                    </div>
                  </div>
                </Link>
              </motion.div>
            )})}
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
              <h2 className="text-4xl font-extrabold tracking-tighter mb-6 leading-tight">The Winter Kitchen</h2>
              <p className="text-on-primary/80 mb-8 leading-relaxed max-w-md text-lg">
                Discover the best seasonal ingredients arriving at the Central store this week. Fresh from local suppliers.
              </p>
              <button className="bg-surface text-primary px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95">
                Read the Journal
              </button>
            </div>
            <div className="w-full md:w-1/2 h-[300px] md:h-full min-h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
                alt="Winter Kitchen"
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
