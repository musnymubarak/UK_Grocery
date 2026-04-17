import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, MapPin, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { catalogApi } from '../services/api';

interface StoreData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  is_active?: boolean;
}

export default function StoreSelection() {
  const navigate = useNavigate();
  const { setSelectedStore } = useCart();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi.getStores()
      .then(res => {
        setStores(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelectStore = (store: StoreData) => {
    setSelectedStore({
      id: store.id,
      name: store.name,
      address: store.address || '',
      city: store.city || '',
      postcode: store.postcode || '',
      openUntil: '10 PM',
    });
    navigate('/browse');
  };

  if (loading) {
    return (
      <Layout title="The Conservatory" showBack>
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="The Conservatory" showBack>
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-32">
        <section className="mb-12 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary mb-4">Choose your store</h2>
          <p className="text-on-surface-variant text-lg max-w-xl">Find your nearest store for fresh daily harvests and artisanal grocery selections.</p>
        </section>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map((store, index) => (
            <motion.div 
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-8 rounded-lg transition-all duration-300 flex flex-col h-full border border-transparent bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-[0_48px_64px_rgba(44,104,46,0.08)]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-full bg-secondary-container text-secondary">
                  <MapPin size={24} />
                </div>
                {index === 0 && (
                  <span className="bg-tertiary-container text-on-tertiary-container px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Nearest</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{store.name}</h3>
              {store.address && <p className="text-on-surface-variant mb-1">{store.address}</p>}
              <p className="text-on-surface-variant mb-6">{store.city}{store.postcode ? `, ${store.postcode}` : ''}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center text-primary text-sm font-semibold">
                  <Clock size={16} className="mr-2" />
                  Open until 10 PM
                </div>
                <button 
                  onClick={() => handleSelectStore(store)}
                  className="px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all bg-secondary-container text-on-secondary-container hover:bg-outline-variant/20"
                >
                  Select Store
                </button>
              </div>
            </motion.div>
          ))}

          {stores.length === 0 && (
            <div className="col-span-2 text-center py-20 text-on-surface-variant">
              <p className="text-lg">No stores available yet. Please check back later.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
