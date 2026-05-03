import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Tag, Ticket, Percent, Sparkles, Gift, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { couponApi, rewardsApi, catalogApi } from '../services/api';
import { useCart } from '../CartContext';

export default function Offers() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any>(null);
  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const { selectedStore } = useCart();

  useEffect(() => {
    Promise.all([
      rewardsApi.myProgress().catch(() => ({ data: { total_spend: 0, events: [] } })),
      catalogApi.getOffers(selectedStore?.id).catch(() => ({ data: [] }))
    ])
    .then(([rewardsRes, offersRes]) => {
      setRewards(rewardsRes.data);
      setPromoProducts(offersRes.data);
    })
    .finally(() => setLoading(false));
  }, [selectedStore?.id]);

  const featuredOffers = [
    {
      id: 1,
      title: "Complimentary Delivery",
      description: "On all orders over £30.00 this weekend.",
      code: "FREESHIP",
      gradient: "from-primary via-tertiary to-primary-container",
      icon: <Gift className="text-white" size={24} />
    },
    {
      id: 2,
      title: "Seasonal Deals",
      description: "15% off all fresh vegetables.",
      code: "VEG15",
      gradient: "from-primary-container via-tertiary to-primary",
      icon: <Sparkles className="text-white" size={24} />
    }
  ];

  if (loading) {
    return (
      <Layout title="Offers">
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Seasonal Offers" subtitle="Rewards & Promotions">
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-32 space-y-10">
        {/* Header Section */}
        <section>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Curated for You</h2>
          <p className="text-on-surface-variant font-medium">Discover limited-time promotions and your membership rewards.</p>
        </section>

        {/* Featured Offers */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredOffers.map((offer, index) => (
            <motion.div 
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-8 text-white bg-gradient-to-br ${offer.gradient} shadow-xl hover:shadow-2xl transition-all group`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Tag size={120} />
              </div>
              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center mb-6">
                  {offer.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">{offer.description}</p>
                <div className="flex items-center justify-between">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 font-mono font-bold tracking-widest text-sm">
                    {offer.code}
                  </div>
                  <button className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                    Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Rewards Program */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
              <Ticket size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Your Rewards Progress</h3>
              <p className="text-on-surface-variant text-sm">Every purchase brings you closer to exclusive tiers.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-high rounded-full h-3 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((rewards?.total_spend || 0) / 100 * 100, 100)}%` }}
                    className="h-full bg-primary"
                />
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Spend: £{rewards?.total_spend || 0}</span>
                <span>Next Tier: £100</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4">
                <Percent className="mx-auto text-primary mb-3" size={32} />
                <h4 className="font-bold text-sm mb-1">Cashback</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">2% on all orders</p>
            </div>
            <div className="text-center p-4">
                <Clock className="mx-auto text-primary mb-3" size={32} />
                <h4 className="font-bold text-sm mb-1">Early Access</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Seasonal launches</p>
            </div>
            <div className="text-center p-4">
                <Gift className="mx-auto text-primary mb-3" size={32} />
                <h4 className="font-bold text-sm mb-1">Birthday Gift</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Special annual treat</p>
            </div>
          </div>
        </section>

        {/* Dynamic Promotions */}
        {promoProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-bold tracking-tight">Active Deals</h3>
              <p className="text-primary text-sm font-bold">Limited time only</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {promoProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className="group">
                  <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 transition-all hover:shadow-xl hover:border-primary/30">
                    <div className="aspect-square rounded-xl overflow-hidden mb-4 relative">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 bg-error text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                        SAVE £{(product.price - product.promo_price).toFixed(2)}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-on-surface line-clamp-1 mb-1">{product.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-black">£{product.promo_price.toFixed(2)}</span>
                      <span className="text-on-surface-variant text-xs line-through opacity-50">£{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Coupon List */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight">Active Coupons</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-5">
                    <div className="bg-primary/5 text-primary p-4 rounded-xl">
                        <Percent size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">New Comer Welcome</h4>
                        <p className="text-sm text-on-surface-variant">Get 10% off your first 3 orders.</p>
                    </div>
                </div>
                <div className="px-6 py-3 bg-surface-container rounded-lg font-mono font-bold text-primary">
                    WELCOME10
                </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
