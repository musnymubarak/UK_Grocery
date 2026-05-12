import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import DeliveryFeeModal from '../components/DeliveryFeeModal';
import { ChevronLeft, ChevronRight, ArrowRight, Info, Bike } from 'lucide-react';
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
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

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
      <div className="bg-white min-h-screen">
        
        {/* Store Header */}
        <div className="flex items-center justify-between py-4 px-4 bg-white border-b border-outline-variant/10">
          <div className="flex-1 flex justify-center">
            <h2 className="text-[17px] font-black tracking-tight text-on-surface">
              {selectedStore?.name || "Daily Grocer Local"}
            </h2>
          </div>
          {/* Space for layout balance if needed, otherwise empty */}
          <div className="w-[22px]"></div>
        </div>

        <div className="max-w-4xl mx-auto pb-32">
          {/* Hero Banners Carousel (Full bleed on mobile) */}
          {banners.length > 0 && (
            <section className="relative h-[220px] md:h-[300px] group overflow-hidden md:rounded-b-2xl md:mx-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={banners[currentBanner].id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <img 
                    src={banners[currentBanner].image_url} 
                    alt={banners[currentBanner].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle overlay for text readability if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {banners.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface shadow-sm opacity-90 transition-all hover:bg-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface shadow-sm opacity-90 transition-all hover:bg-white"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Indicators - Snappy style (small dots) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {banners.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentBanner(i)}
                        className={`h-1.5 rounded-full transition-all ${i === currentBanner ? 'w-1.5 bg-primary' : 'w-1.5 bg-white/70'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          <div className="px-4 mt-4">
            {/* Pricing Information Block */}
            <div 
              onClick={() => setIsPricingModalOpen(true)}
              className="mb-4 border border-dashed border-primary/30 rounded-xl p-3 flex items-center justify-between bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-primary">
                  <Bike size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-on-surface-variant leading-tight">Pricing Information</p>
                  <p className="text-[15px] font-black text-on-surface leading-tight mt-0.5">£1.99 - £5.99</p>
                </div>
              </div>
              {/* Icon removed */}
            </div>

            {/* Static Promotional Banners Stack */}
            <div className="flex flex-col gap-3 mb-8">
              {/* Rewards Banner */}
              <div className="relative rounded-xl overflow-hidden bg-blue-700 text-white p-5 shadow-sm">
                <div className="relative z-10 w-[70%]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="font-extrabold text-sm tracking-tight">daily grocer rewards</span>
                  </div>
                  <h3 className="text-2xl font-black leading-tight mb-4 tracking-tighter">Get Rewards in a Snap!</h3>
                  <button className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Find out more
                  </button>
                </div>
                {/* Decorative floating elements */}
                <div className="absolute right-[-10%] top-[-10%] bottom-0 w-[50%] bg-blue-800/40 rounded-full blur-2xl"></div>
              </div>

              {/* Free Delivery Banner */}
              <div className="rounded-xl overflow-hidden bg-[#e6203a] text-white p-5 flex items-center gap-4 shadow-sm relative">
                <div className="bg-white text-[#e6203a] rounded-2xl p-3 transform -rotate-3 shadow-lg z-10 shrink-0 border-b-4 border-gray-200">
                  <h3 className="text-[28px] font-black leading-[0.9] tracking-tighter text-center uppercase">Free<br/>Delivery</h3>
                </div>
                <div className="flex-1 z-10">
                  <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tighter uppercase text-right">ON ALL ORDERS OVER £40</h3>
                </div>
              </div>
            </div>


        {/* Category Grid */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">Aisles & Collections</h2>
              <p className="text-secondary font-medium">Curated selections for your kitchen</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {categories.map((category, index) => {
              // Dynamic gradients based on category keywords
              const categoryGradients: Record<string, string> = {
                'alcohol': 'from-amber-700 via-red-800 to-rose-950',
                'baby': 'from-sky-400 via-indigo-500 to-violet-600',
                'bakery': 'from-orange-500 via-amber-700 to-yellow-900',
                'beverage': 'from-blue-600 via-cyan-700 to-teal-600',
                'dairy': 'from-sky-100 via-indigo-200 to-blue-300', // Note: keep text dark for light bg
                'frozen': 'from-cyan-500 via-blue-600 to-indigo-800',
                'produce': 'from-emerald-500 via-green-700 to-lime-800',
                'meat': 'from-rose-700 via-red-800 to-stone-950',
                'household': 'from-violet-500 via-purple-700 to-fuchsia-800',
                'health': 'from-teal-400 via-emerald-600 to-cyan-700',
                'food': 'from-orange-600 via-red-700 to-amber-800',
              };

              const catName = category.name.toLowerCase();
              const gradientKey = Object.keys(categoryGradients).find(k => catName.includes(k)) || 'food';
              const gradientClass = categoryGradients[gradientKey];
              const isLight = gradientKey === 'dairy';

              return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
              >
                <Link to={`/aisle/${category.id}`} className="group block h-full">
                  <div className="relative h-36 sm:h-44 overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-300 active:scale-[0.98] border border-outline-variant/30">
                    
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
                    <div className={`absolute left-0 top-0 bottom-0 w-[55%] z-10 flex items-center px-6 sm:px-8 shadow-2xl bg-gradient-to-br ${gradientClass} overflow-hidden`} style={{ clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' }}>
                      {/* Subtle gradient overlay to enhance the colored effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent mix-blend-overlay"></div>
                      <h3 className={`relative text-2xl sm:text-3xl lg:text-4xl pr-4 font-black leading-[1.1] drop-shadow-md z-20 ${isLight ? 'text-primary' : 'text-white'}`}>
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Floating decorative element (Optional) */}
                    <div className={`absolute top-3 right-3 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-primary' : 'bg-black/20 backdrop-blur-sm'}`}>
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

          </div>
        </div>
      </div>
      
      <DeliveryFeeModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)}
        minOrder={selectedStore?.min_order_value || "10.00"}
      />
    </Layout>
  );
}
