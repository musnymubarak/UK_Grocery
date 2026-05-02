import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, MapPin, Clock, Navigation } from 'lucide-react';
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
      <Layout title="Stores">
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Stores">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 font-body">


        <div className="mb-8">
          <h2 className="text-xl font-bold text-on-surface mb-4">Open Stores</h2>
          
          <div className="flex flex-col gap-4">
            {stores.map((store, index) => (
              <motion.div 
                key={store.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="ss-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
              >
                {/* Store Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-surface-container border border-outline-variant/30 rounded-md overflow-hidden flex items-center justify-center">
                  <span className="font-headline font-black text-2xl text-primary/30">
                    {store.name.charAt(0)}
                  </span>
                </div>
                
                {/* Store Info */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-on-surface leading-tight">{store.name}</h3>
                    {index === 0 && (
                      <span className="bg-surface-container-high text-xs px-2 py-0.5 rounded text-on-surface-variant font-medium flex items-center gap-1 shrink-0">
                        <Navigation size={10} /> 0.8 mi
                      </span>
                    )}
                  </div>
                  
                  <div className="text-success text-xs font-bold flex items-center gap-1 mb-2">
                    <Clock size={12} /> We are open
                  </div>
                  
                  <p className="text-on-surface-variant text-sm mb-4">
                    {store.address ? `${store.address}, ` : ''}{store.city} {store.postcode}
                  </p>
                  
                  {/* Action Button */}
                  <button 
                    onClick={() => handleSelectStore(store)}
                    className="w-full bg-primary text-white font-bold py-2.5 rounded-md hover:bg-primary-container active:scale-[0.98] transition-all text-sm uppercase tracking-wide"
                  >
                    View Store
                  </button>
                </div>
              </motion.div>
            ))}

            {stores.length === 0 && (
              <div className="text-center py-10 text-on-surface-variant ss-card">
                <p>No stores available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
