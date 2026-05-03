import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'dg_consent_given';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-[0_24px_48px_rgba(30,64,175,0.12)] p-6 md:p-8 relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-5 relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <Shield size={24} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-black text-on-surface tracking-tight mb-2">Transparency & Privacy</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  We use <span className="text-on-surface font-bold">Local Storage</span> to maintain your session and preserve your shopping basket. No third-party tracking.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button 
                    onClick={accept}
                    className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Accept & Close
                  </button>
                  <Link 
                    to="/cookies" 
                    className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 group/link"
                  >
                    View Policy <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
