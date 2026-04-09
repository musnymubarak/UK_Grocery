import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] bg-primary-container/20 rounded-full blur-3xl"></div>
        <div className="absolute top-[60%] -left-[20%] w-[80%] h-[60%] bg-tertiary-container/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="px-6 py-6 flex items-center gap-2 relative z-10">
        <Leaf className="text-primary" size={28} />
        <span className="font-headline font-extrabold text-xl text-primary tracking-tight">The Conservatory</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center px-6 relative z-10 pb-20">
        <div className="max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-primary-container/10 text-primary rounded-full mb-8 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest">Now Serving London & Kent</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-on-surface tracking-tighter leading-[1.05] mb-6">
              Fresh groceries <br/>
              <span className="text-primary">delivered</span> <br/>
              to your door.
            </h1>
            
            <p className="text-on-surface-variant text-lg md:text-xl max-w-md mb-12 leading-relaxed">
              Curating the finest local harvests and artisanal staples, brought directly from the conservatory to your kitchen.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/stores"
                className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-5 rounded-xl font-bold text-lg shadow-[0_20px_40px_rgba(44,104,46,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
              >
                Select Store
                <ArrowRight size={20} />
              </Link>
              <button className="bg-surface-container-high text-on-surface-variant px-8 py-5 rounded-xl font-bold text-lg hover:bg-surface-container-highest transition-colors active:scale-95">
                How it works
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Image Showcase (Desktop) */}
      <div className="hidden lg:block absolute right-0 top-0 w-1/2 h-full z-0">
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
          alt="Fresh Produce" 
          className="w-full h-full object-cover rounded-l-[4rem] shadow-2xl"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent"></div>
      </div>
    </div>
  );
}
