import { motion, AnimatePresence } from 'motion/react';
import SmartTransparentImage from '../components/SmartTransparentImage';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import DeliveryFeeModal from '../components/DeliveryFeeModal';
import { ChevronLeft, ChevronRight, Bike, Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';
import { useCart } from '../CartContext';
import bakeryImg from '../../images/categories/bakery_clean.webp';
import beveragesImg from '../../images/categories/bevarages_clean.webp';
import dairyImg from '../../images/categories/dairy&eggs_clean.webp';
import foodImg from '../../images/categories/food_clean.webp';
import produceImg from '../../images/categories/freshproduce_clean.webp';
import frozenImg from '../../images/categories/frozenfood_clean.webp';
import householdImg from '../../images/categories/household_clean.webp';
import meatImg from '../../images/categories/meat&poultry_clean.webp';

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
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
      catalogApi.getBanners(selectedStore?.id),
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
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const categoryImages: Record<string, string> = {
    produce: produceImg,
    dairy: dairyImg,
    egg: dairyImg,
    bakery: bakeryImg,
    meat: meatImg,
    poultry: meatImg,
    frozen: frozenImg,
    household: householdImg,
    beverage: beveragesImg,
    grocery: foodImg,
    confectionery: foodImg,
    baby: produceImg,
    snacks: foodImg,
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    const key = Object.keys(categoryImages).find((k) => cat.name.toLowerCase().includes(k));
    return key ? categoryImages[key] : foodImg;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-surface-variant">
          <p className="text-base mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-action-blue font-semibold">
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        {/* Store header strip */}
        <div className="flex md:hidden items-center justify-center py-3 px-4 bg-surface-container-lowest border-b border-outline-variant">
          <h2 className="text-base font-bold tracking-tight text-text-main truncate">
            {selectedStore?.name || 'Daily Grocer Local'}
          </h2>
        </div>

        <div className="px-4 py-4 pb-24 flex flex-col gap-5">
          {/* Hero Banner Carousel */}
          {banners.length > 0 ? (
            <section className="relative">
              <div className="relative rounded-xl overflow-hidden h-[180px] md:h-[300px] lg:h-[400px] bg-surface-container group">
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
                  </motion.div>
                </AnimatePresence>

                {banners.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-container-lowest border border-outline-variant rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-container-lowest border border-outline-variant rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {banners.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentBanner(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            i === currentBanner ? 'w-4 bg-action-red' : 'w-1.5 bg-surface-container-lowest/80'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          ) : (
            // Reference-style default promotional hero
            <section>
              <div className="relative bg-action-blue rounded-xl overflow-hidden min-h-[160px] flex flex-col justify-center p-5 text-on-primary">
                <div className="relative z-10 w-full xs:w-[90%] md:w-2/3 pr-4 md:pr-0">
                  <h2 className="text-[20px] xs:text-2xl md:text-headline-lg-mobile font-extrabold text-on-primary mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    Free Delivery Today!
                  </h2>
                  <p className="text-body-md opacity-90 mb-3">On all orders over £30. Stock up now.</p>
                  <button className="bg-action-red text-on-primary text-label-bold font-semibold px-4 py-2 rounded-md hover:bg-secondary-container transition-colors">
                    Shop Now
                  </button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-black/20 to-transparent z-0" />
              </div>
            </section>
          )}

          {/* Promotions & Pricing Row (Desktop) / Stack (Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pricing info chip */}
            <div
              onClick={() => setIsPricingModalOpen(true)}
              className="ref-card p-4 flex flex-row md:flex-col items-center md:items-start justify-between cursor-pointer hover:bg-surface-container-low transition-colors h-full"
            >
              <div className="flex items-center gap-3 md:mb-4">
                <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center text-action-blue shrink-0">
                  <Bike size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Pricing Info
                  </p>
                  <p className="text-sm font-bold text-text-main mt-0.5">£1.99 - £5.99</p>
                </div>
              </div>
              <div className="flex w-full justify-end md:justify-between items-center">
                <span className="hidden md:block text-xs font-semibold text-action-blue">View details</span>
                <Info size={18} className="text-on-surface-variant" />
              </div>
            </div>

            {/* Promotional stack items */}
            <div className="rounded-xl border border-outline-variant bg-action-blue text-on-primary p-5 relative overflow-hidden h-full flex flex-col justify-center">
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-label-bold font-semibold tracking-tight uppercase">daily grocer rewards</span>
                </div>
                <h3 className="text-[20px] xs:text-2xl md:text-headline-lg-mobile font-extrabold mb-3 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  Get Rewards in a Snap!
                </h3>
                <button className="bg-action-red text-on-primary text-xs font-semibold px-4 py-2 rounded-md hover:bg-secondary transition-colors w-fit">
                  Find out more
                </button>
              </div>
              <div className="absolute right-[-10%] top-[-10%] bottom-0 w-[50%] bg-on-primary/10 rounded-full blur-2xl" />
            </div>

            <div className="rounded-xl border border-outline-variant bg-action-red text-on-primary p-5 flex items-center gap-4 relative overflow-hidden h-full">
              <div className="bg-on-primary text-action-red rounded-md p-3 transform -rotate-3 shadow-md z-10 shrink-0 border border-outline-variant">
                <h3 className="text-[20px] lg:text-[24px] font-extrabold leading-[0.9] tracking-tight text-center uppercase">
                  Free
                  <br />
                  Delivery
                </h3>
              </div>
              <div className="flex-1 z-10">
                <h3 className="text-base xs:text-lg lg:text-xl font-extrabold leading-tight tracking-tight uppercase text-right whitespace-nowrap overflow-hidden text-ellipsis">
                  ON ALL ORDERS OVER £40
                </h3>
              </div>
            </div>
          </div>

          {/* Categories Grid — modern image-forward tiles */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-headline-lg-mobile text-primary">Categories</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">Browse fresh picks across the store</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {categories
                .filter((c) => !c.parent_id)
                .map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link
                      to={`/aisle/${category.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest transition-all duration-200 hover:-translate-y-0.5 hover:border-action-blue hover:shadow-lg"
                    >
                      <div className="relative flex aspect-[5/4] items-center justify-center p-4">
                        <SmartTransparentImage
                          src={getCategoryImage(category)}
                          alt={category.name}
                          className="h-full w-full object-contain drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-110"
                        />
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-outline-variant/60 px-3 py-2.5">
                        <span className="text-label-bold text-text-main leading-tight line-clamp-2 group-hover:text-action-blue transition-colors">
                          {category.name}
                        </span>
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-on-surface-variant transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-action-blue"
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-16 text-on-surface-variant">
                <p>No categories available yet. Check back soon!</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <DeliveryFeeModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        minOrder={selectedStore?.min_order_value || '10.00'}
      />
    </Layout>
  );
}
