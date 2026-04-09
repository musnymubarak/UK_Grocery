import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Search, MapPin, Clock } from 'lucide-react';
import { STORES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { Store } from '../types';

export default function StoreSelection() {
  const navigate = useNavigate();
  const { setSelectedStore } = useCart();

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    navigate('/shop');
  };

  return (
    <Layout title="The Conservatory" showBack>
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-32">
        {/* Hero Header Area */}
        <section className="mb-12 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary mb-4">Choose your store</h2>
          <p className="text-on-surface-variant text-lg max-w-xl">Find your nearest Digital Conservatory for fresh daily harvests and artisanal grocery selections.</p>
        </section>

        {/* Search */}
        <div className="mb-12">
          <div className="flex items-center bg-surface-container-high px-6 py-4 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-outline mr-3" size={20} />
            <input 
              type="text"
              placeholder="Enter town or postcode..."
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline"
            />
          </div>
        </div>

        {/* Store List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STORES.map((store, index) => (
            <motion.div 
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group relative p-8 rounded-lg transition-all duration-300 flex flex-col h-full border border-transparent ${
                store.isNearest 
                  ? 'bg-surface-container-lowest shadow-[0_48px_64px_rgba(44,104,46,0.1)]' 
                  : 'bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-[0_48px_64px_rgba(44,104,46,0.08)]'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-full ${store.isNearest ? 'bg-primary/10 text-primary' : 'bg-secondary-container text-secondary'}`}>
                  <MapPin size={24} />
                </div>
                {store.isNearest && (
                  <span className="bg-tertiary-container text-on-tertiary-container px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Nearest</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{store.name}</h3>
              <p className="text-on-surface-variant mb-1">{store.address}</p>
              <p className="text-on-surface-variant mb-6">{store.city}, {store.postcode}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center text-primary text-sm font-semibold">
                  <Clock size={16} className="mr-2" />
                  Open until {store.openUntil}
                </div>
                <button 
                  onClick={() => handleSelectStore(store)}
                  className={`px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all ${
                    store.isNearest 
                      ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary hover:opacity-90' 
                      : 'bg-secondary-container text-on-secondary-container hover:bg-outline-variant/20'
                  }`}
                >
                  Select Store
                </button>
              </div>
            </motion.div>
          ))}

          {/* Decorative Map Preview */}
          <div className="relative rounded-lg overflow-hidden h-full min-h-[300px] hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
              alt="Map Preview" 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Local Focus</p>
              <p className="text-on-surface font-bold">Find more stores across the UK</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
