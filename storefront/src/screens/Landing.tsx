import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, MapPin, Search } from 'lucide-react';
import React, { useState } from 'react';

// Use categories images for floating elements
import bakeryImg from '../../images/categories/bakery.png';
import freshproduceImg from '../../images/categories/freshproduce.png';
import beveragesImg from '../../images/categories/bevarages.png';

export default function Landing() {
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/stores');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-2 relative z-20 bg-white">
        <Leaf className="text-primary" size={28} />
        <span className="font-headline font-extrabold text-xl text-primary tracking-tight">The Conservatory</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-10 bg-surface">
        {/* Blue Ellipse Hero */}
        <div className="relative bg-primary pt-16 pb-32 px-4 md:px-6 overflow-hidden rounded-b-[3rem] md:rounded-b-[10rem]">
          <div className="max-w-4xl mx-auto w-full relative z-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-4xl md:text-6xl font-headline font-extrabold text-white tracking-tight leading-tight mb-4">
                Local store to door
              </h1>
              
              <p className="text-white/90 text-lg md:text-xl mb-10 font-medium">
                From as little as 30 minutes
              </p>

              {/* Postcode Search Box */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
                <div className="flex-1 flex items-center bg-surface-container-low rounded-md px-4 py-3">
                  <MapPin className="text-primary mr-3" size={20} />
                  <input 
                    type="text"
                    placeholder="Enter your postcode"
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface outline-none font-medium"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-primary text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-primary-container transition-colors whitespace-nowrap active:scale-95"
                >
                  Search Local Stores
                </button>
              </form>
            </motion.div>
          </div>

          {/* Floating Images (Decorative) */}
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            src={freshproduceImg} 
            className="absolute top-10 left-[-5%] md:left-[5%] w-32 md:w-48 opacity-90 z-10 drop-shadow-2xl object-contain hidden sm:block" 
            alt="Produce" 
          />
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            src={bakeryImg} 
            className="absolute bottom-5 right-[-5%] md:right-[5%] w-36 md:w-56 opacity-90 z-10 drop-shadow-2xl object-contain hidden sm:block" 
            alt="Bakery" 
          />
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            src={beveragesImg} 
            className="absolute top-8 right-[5%] md:right-[15%] w-24 md:w-36 opacity-80 z-10 drop-shadow-2xl object-contain hidden lg:block" 
            alt="Beverages" 
          />
        </div>
        
        {/* Lower Section (Optional Info) */}
        <div className="py-20 px-6 text-center">
            <h2 className="text-3xl font-bold text-on-surface mb-10">How it works</h2>
            <div className="flex flex-col md:flex-row justify-center gap-6 max-w-5xl mx-auto">
                <div className="flex-1 p-8 ss-card flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                        <MapPin size={32} />
                    </div>
                    <h3 className="font-bold text-xl mb-3">1. Find Local Store</h3>
                    <p className="text-on-surface-variant">Enter your postcode to find partner stores near you.</p>
                </div>
                <div className="flex-1 p-8 ss-card flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                        <Search size={32} />
                    </div>
                    <h3 className="font-bold text-xl mb-3">2. Browse Menu</h3>
                    <p className="text-on-surface-variant">Select from thousands of grocery products.</p>
                </div>
                <div className="flex-1 p-8 ss-card flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                        <Leaf size={32} />
                    </div>
                    <h3 className="font-bold text-xl mb-3">3. Fast Delivery</h3>
                    <p className="text-on-surface-variant">Get your order delivered to your door quickly.</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
