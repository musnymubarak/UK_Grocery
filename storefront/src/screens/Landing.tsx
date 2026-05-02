import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ShoppingBasket, Truck, ShieldCheck, Clock } from 'lucide-react';
import React, { useState } from 'react';

// Use categories images for floating elements
import bakeryImg from '../../images/categories/bakery.png';
import freshproduceImg from '../../images/categories/freshproduce.png';
import beveragesImg from '../../images/categories/bevarages.png';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden font-body">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between relative z-20 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShoppingBasket size={24} />
          </div>
          <span className="font-headline font-black text-2xl text-on-surface tracking-tighter">
            Daily<span className="text-primary">Grocer</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
            <button className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Our Stores</button>
            <button className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Support</button>
            <button 
                onClick={() => navigate('/login')}
                className="bg-primary/10 text-primary px-5 py-2 rounded-full font-bold text-sm hover:bg-primary/20 transition-all"
            >
                Sign In
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-10 bg-surface">
        {/* Hero Section with Professional Gradient */}
        <div className="relative bg-gradient-to-br from-primary to-primary-container pt-20 pb-36 px-4 md:px-6 overflow-hidden rounded-b-[4rem] md:rounded-b-[12rem] shadow-2xl">
          <div className="max-w-4xl mx-auto w-full relative z-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-8">
                <Truck size={14} className="animate-pulse" />
                Delivery from 30 minutes
              </div>
              
              <h1 className="text-5xl md:text-7xl font-headline font-black text-white tracking-tight leading-[1.1] mb-6">
                Fresh Groceries,<br /> 
                <span className="text-white/80">Delivered Simply.</span>
              </h1>
              
              <p className="text-white/90 text-lg md:text-2xl mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
                Shop from your favorite local stores and get your essentials delivered to your doorstep in minutes.
              </p>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-10"
              >
                <button 
                  onClick={() => navigate('/stores')}
                  className="bg-white text-primary px-12 py-5 rounded-2xl font-black text-xl hover:bg-surface transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <ShoppingBasket size={28} />
                  View Available Stores
                </button>
              </motion.div>
              
              <div className="mt-8 flex items-center justify-center gap-8 text-white/70 font-bold text-sm">
                  <div className="flex items-center gap-2">
                      <ShieldCheck size={18} />
                      Secure Payments
                  </div>
                  <div className="flex items-center gap-2">
                      <Clock size={18} />
                      Real-time Tracking
                  </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Images (Refined placement) */}
          <motion.img 
            initial={{ opacity: 0, x: -50, rotate: -10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            src={freshproduceImg} 
            className="absolute top-12 left-[-2%] md:left-[2%] w-40 md:w-64 opacity-90 z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)] object-contain hidden md:block" 
            alt="Produce" 
          />
          <motion.img 
            initial={{ opacity: 0, x: 50, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            src={bakeryImg} 
            className="absolute bottom-10 right-[-2%] md:right-[2%] w-44 md:w-72 opacity-90 z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)] object-contain hidden md:block" 
            alt="Bakery" 
          />
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            src={beveragesImg} 
            className="absolute top-10 right-[8%] md:right-[12%] w-32 md:w-48 z-10 drop-shadow-2xl object-contain hidden lg:block" 
            alt="Beverages" 
          />
        </div>
        
        {/* Value Propositions Section */}
        <div className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-4">How it works</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight">Your grocery journey</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: <MapPin size={36} />, title: "1. Find Stores", desc: "Browse a curated list of local grocers in your area by entering your postcode." },
                        { icon: <Search size={36} />, title: "2. Fill Your Basket", desc: "Select from fresh produce, dairy, bakery items, and household essentials." },
                        { icon: <Truck size={36} />, title: "3. Fast Delivery", desc: "Relax as our delivery partners bring your groceries to your door in as little as 30 mins." }
                    ].map((step, idx) => (
                        <div key={idx} className="bg-white p-10 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
                            <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                {step.icon}
                            </div>
                            <h4 className="font-black text-2xl mb-4 text-on-surface">{step.title}</h4>
                            <p className="text-on-surface-variant font-medium leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>
      
      {/* Professional Footer */}
      <footer className="bg-on-surface text-white py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <ShoppingBasket size={18} />
                </div>
                <span className="font-headline font-black text-xl tracking-tighter">
                    Daily<span className="text-primary">Grocer</span>
                </span>
              </div>
              <div className="flex gap-8 text-sm font-bold text-white/60">
                  <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Cookie Policy</span>
              </div>
              <div className="text-sm font-medium text-white/40">
                  © 2026 Daily Grocer. All rights reserved.
              </div>
          </div>
      </footer>
    </div>
  );
}

