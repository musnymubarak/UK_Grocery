import React, { useState, useEffect } from 'react';
import { ShoppingBag, Leaf, Sparkles, ShoppingCart } from 'lucide-react';

export default function InnovativeLoader() {
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % 3);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Elegant Container */}
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Smooth, premium rotating gradients */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-[spin_2s_ease-in-out_infinite]" />
        <div className="absolute inset-2 rounded-full border-b-2 border-primary/60 animate-[spin_3s_ease-in-out_infinite_reverse]" />
        
        {/* Central glowing orb */}
        <div className="absolute inset-6 bg-primary/10 rounded-full animate-pulse filter blur-xl" />
        
        {/* Floating icon with cross-fade styling */}
        <div className="relative z-10 text-primary transform transition-all duration-700 ease-in-out animate-bounce">
          {stage === 0 && <ShoppingBag size={36} strokeWidth={1.5} />}
          {stage === 1 && <ShoppingCart size={36} strokeWidth={1.5} />}
          {stage === 2 && <Leaf size={36} strokeWidth={1.5} />}
        </div>
        
        {/* Orbiting sparkles */}
        <div className="absolute inset-0 animate-[spin_5s_linear_infinite]">
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 animate-pulse">
            <Sparkles className="text-primary/70 opacity-80" size={14} />
          </div>
        </div>
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite_reverse]">
          <div className="absolute bottom-2 right-2 animate-pulse" style={{ animationDelay: '1s' }}>
            <Sparkles className="text-primary/60" size={10} />
          </div>
        </div>
      </div>
    </div>
  );
}
