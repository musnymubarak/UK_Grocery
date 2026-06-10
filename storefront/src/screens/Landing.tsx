import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Zap, Store, Tag, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useCart } from '../CartContext';

export default function Landing() {
  const navigate = useNavigate();
  const { selectedStore } = useCart();
  const [postcode, setPostcode] = useState('');

  useEffect(() => {
    if (selectedStore) {
      navigate('/browse', { replace: true });
    }
  }, [selectedStore, navigate]);

  return (
    <Layout fullWidth>
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="bg-[#005eb8] text-white relative w-full overflow-hidden flex justify-center">
          {/* Desktop Left Darker Block Decor */}
          <div className="hidden md:block absolute top-0 left-0 w-[15%] h-[30%] bg-[#004b9c] rounded-br-3xl pointer-events-none z-0"></div>
          {/* Desktop Right Darker Block Decor */}
          <div className="hidden md:block absolute bottom-0 right-0 w-[40%] h-[100%] bg-[#365b98] mix-blend-multiply opacity-50 pointer-events-none z-0"></div>

          <div className="w-full max-w-[90rem] flex flex-col md:flex-row items-center justify-between gap-8 py-8 md:py-16 px-4 relative z-10">
            {/* Left Column (Text & Search) */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full px-0">
              <h1 className="font-headline font-extrabold text-[36px] md:text-[56px] leading-[1.1] tracking-tight mb-2 md:mb-4">
                Local store to door
              </h1>
              <p className="font-headline font-bold text-[18px] md:text-[24px] text-blue-200 mb-6 md:mb-8">
                From as little as 30 minutes
              </p>

              <div className="w-full max-w-lg bg-white rounded-md p-1.5 flex flex-col md:flex-row gap-2 shadow-lg">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-outline">
                    <MapPin size={20} />
                  </span>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Enter your postcode"
                    className="w-full pl-10 pr-3 py-3 rounded-md focus:outline-none text-text-main text-[16px] placeholder:text-outline"
                  />
                </div>
                <button
                  onClick={() => navigate('/stores')}
                  className="bg-[#e6203a] hover:bg-[#cc1d33] text-white font-bold text-[16px] py-3.5 px-6 rounded-md transition-colors shadow-sm whitespace-nowrap"
                >
                  Search Local Stores
                </button>
              </div>
            </div>

            {/* Right Column (Image Card) */}
            <div className="w-[90%] max-w-[400px] md:w-[480px] md:max-w-none aspect-[1/1] bg-black rounded-xl border-[3px] border-white relative overflow-hidden flex items-center justify-center mx-auto mt-4 md:mt-0 shadow-2xl z-10 shrink-0">
              {/* Meaningful Related Images */}
              <div className="absolute top-4 left-4 md:top-8 md:left-8 w-32 md:w-48 aspect-square rounded-full overflow-hidden border-2 border-blue-500/30 z-0 shadow-inner">
                <img src="/produce.png" alt="Fresh Produce" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-32 md:w-48 aspect-square rounded-full overflow-hidden border-2 border-red-500/30 z-0 shadow-inner">
                <img src="/dairy.png" alt="Dairy Essentials" className="w-full h-full object-cover" />
              </div>

              <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 rounded-full bg-red-500"></div>

              {/* Person Image */}
              <div className="relative w-48 md:w-64 aspect-square rounded-full bg-white overflow-hidden z-10 flex items-center justify-center shadow-xl border-4 border-white">
                <img 
                  src="/delivery.png" 
                  alt="Delivery Person" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Trio */}
        <section className="py-8 md:py-12 px-4 bg-background w-full max-w-[90rem] mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <FeatureCard 
              icon={<Zap size={24} strokeWidth={2.5} />}
              title="Fast Delivery"
              desc="Groceries delivered from your local shop in under an hour."
              bg="bg-[#dce8ff]"
              text="text-[#0056b3]"
              delay={0}
            />
            <FeatureCard 
              icon={<Store size={24} strokeWidth={2.5} />}
              title="Support Local"
              desc="Shop directly from independent convenience stores in your area."
              bg="bg-[#ffdad6]"
              text="text-[#e6203a]"
              delay={0.08}
            />
            <FeatureCard 
              icon={<Tag size={24} strokeWidth={2.5} />}
              title="In-Store Prices"
              desc="Pay exactly what you would in-store, with fair delivery fees."
              bg="bg-[#dce8ff]"
              text="text-[#0056b3]"
              delay={0.16}
            />
          </div>
        </section>

        {/* Additional Bottom Section */}
        <section className="py-4 px-4 pb-8 md:pb-12 w-full max-w-[90rem] mx-auto">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-headline font-bold text-[22px] md:text-[28px] text-text-main">Shop Everyday Essentials</h2>
            <button className="text-[#0056b3] font-semibold text-sm flex items-center gap-1 hover:underline mb-1">
              View all <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </section>

      </main>
    </Layout>
  );
}

function FeatureCard({ icon, title, desc, bg, text, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white border border-outline-variant rounded-xl p-6 md:p-8 flex flex-col items-center text-center gap-4 flex-1 shadow-sm"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${text}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-headline font-bold text-[18px] leading-6 text-text-main mb-2">{title}</h3>
        <p className="text-on-surface-variant text-[15px] leading-snug max-w-[280px] mx-auto">{desc}</p>
      </div>
    </motion.div>
  );
}

