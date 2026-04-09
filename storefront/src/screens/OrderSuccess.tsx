import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { CheckCircle, Truck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <Layout title="Success" showBack>
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-xl w-full text-center space-y-12 relative z-10">
          <div className="flex justify-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center shadow-[0_24px_48px_rgba(44,104,46,0.2)]">
                <CheckCircle size={80} className="text-on-primary" strokeWidth={1.5} />
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-on-surface">Order Placed Successfully!</h1>
            <p className="text-secondary text-lg font-medium">Your harvest is being prepared with care by our conservatory team.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-lg text-left transition-all hover:bg-surface-container">
              <p className="text-secondary text-xs uppercase tracking-widest font-bold mb-1">Order Reference</p>
              <p className="text-xl font-bold text-on-surface">#GH-8821</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-lg text-left transition-all hover:bg-surface-container">
              <p className="text-secondary text-xs uppercase tracking-widest font-bold mb-1">Estimated Delivery</p>
              <p className="text-xl font-bold text-on-surface">Today, 2:00 PM - 3:00 PM</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/tracking')}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-[0_12px_24px_rgba(44,104,46,0.2)] hover:shadow-[0_16px_32px_rgba(44,104,46,0.3)] hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Truck size={20} />
              Track Order
            </button>
            <button 
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto px-10 py-5 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:bg-outline-variant/30 transition-all active:scale-95"
            >
              Continue Shopping
            </button>
          </div>

          <div className="pt-8 flex flex-col items-center">
            <div className="w-full h-px bg-surface-container-highest max-w-xs mb-8"></div>
            <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200" 
                  alt="Chelsea Conservatory" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-on-surface">From: Chelsea Conservatory</p>
                <p className="text-xs text-secondary">Local sourcing partner • 2.4 miles away</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
