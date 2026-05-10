import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, MapPin, Clock, Navigation, Bike, ChevronRight, Timer, ReceiptText, Star, Tag } from 'lucide-react';
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
  is_open?: boolean;
  opening_hours?: Record<string, { open: string, close: string }>;
  lat?: number;
  lng?: number;
  logo_url?: string;
  min_order?: number;
  delivery_fee?: string;
  distance?: string;
  delivery_time?: string;
}

export default function StoreSelection() {
  const navigate = useNavigate();
  const { setSelectedStore } = useCart();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [postcode, setPostcode] = useState('SW1A 2AA');

  useEffect(() => {
    catalogApi.getStores()
      .then(res => {
        // Mocking some extra data for the UI match
        const enhancedStores = res.data.map((s: any, idx: number) => ({
          ...s,
          min_order: s.min_order || 10.00,
          delivery_fee: s.delivery_fee || (idx === 0 ? "£0 - £3" : "Free"),
          distance: s.distance || (0.5 + idx * 1.2).toFixed(2) + " miles",
          delivery_time: s.delivery_time || "25 to 40 mins"
        }));
        setStores(enhancedStores);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isStoreCurrentlyOpen = (store: StoreData) => {
    if (store.is_open === false) return false;
    if (!store.opening_hours) return true;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[now.getDay()];
    const hours = store.opening_hours[dayName];

    if (!hours || !hours.open || !hours.close) return true;

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    
    const openTime = openH * 100 + openM;
    const closeTime = closeH * 100 + closeM;

    return currentTime >= openTime && currentTime < closeTime;
  };

  const handleSelectStore = (store: StoreData) => {
    const currentlyOpen = isStoreCurrentlyOpen(store);
    setSelectedStore({
      id: store.id,
      name: store.name,
      address: store.address || '',
      city: store.city || '',
      postcode: store.postcode || '',
      openUntil: '10 PM',
      is_open: currentlyOpen,
      lat: store.lat,
      lng: store.lng,
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

  const openStores = stores.filter(s => isStoreCurrentlyOpen(s));
  const closedStores = stores.filter(s => !isStoreCurrentlyOpen(s));

  return (
    <Layout title="Stores">
      <div className="bg-surface-container-lowest min-h-screen">
        {/* Postcode Search Bar */}
        <div className="bg-white border-b border-outline-variant/10 px-4 py-6">
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary/40 group-focus-within:text-primary transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </div>
            <input 
              type="text" 
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="w-full bg-white border border-outline-variant/40 rounded-xl py-3.5 pl-12 pr-4 text-[17px] text-on-surface outline-none focus:border-primary/50 placeholder:text-secondary/40 transition-all shadow-sm"
              placeholder="Search Store"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
          
          {/* Section: Convenience Stores */}
          {openStores.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Bike size={24} />
                </div>
                <h2 className="text-2xl font-black text-primary tracking-tight">
                  Convenience Stores <span className="font-medium text-on-surface">for delivery</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                {openStores.map((store, index) => (
                  <StoreCard 
                    key={store.id} 
                    store={store} 
                    isOpen={true} 
                    index={index} 
                    onSelect={() => handleSelectStore(store)} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section: Closed Stores */}
          {closedStores.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-error/10 p-2 rounded-lg text-error">
                  <Clock size={24} />
                </div>
                <h2 className="text-2xl font-black text-error tracking-tight">Closed Stores</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                {closedStores.map((store, index) => (
                  <StoreCard 
                    key={store.id} 
                    store={store} 
                    isOpen={false} 
                    index={index} 
                    onSelect={() => handleSelectStore(store)} 
                  />
                ))}
              </div>
            </section>
          )}

          {stores.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-outline-variant/30">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant/30">
                <MapPin size={40} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">No Stores Found</h3>
              <p className="text-on-surface-variant">We couldn't find any stores near your location yet.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StoreCard({ store, isOpen, index, onSelect }: { store: StoreData, isOpen: boolean, index: number, onSelect: () => void, key?: React.Key }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-outline-variant/5 overflow-hidden ${!isOpen ? 'opacity-90' : ''}`}
    >
      <div className="p-4 flex gap-4">
        {/* Logo Container */}
        <div className="shrink-0">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 ${isOpen ? 'border-primary/5' : 'border-outline-variant/10 grayscale'}`}>
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center font-headline font-black text-2xl text-primary/10">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          {!isOpen && (
            <div className="mt-2 text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-error bg-error/10 px-2 py-0.5 rounded-full">Closed</span>
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-bold text-on-surface leading-tight mb-2.5 truncate">{store.name}</h3>
          
          <div className="grid grid-cols-2 gap-y-2 gap-x-2">
            <StoreDetail icon={<Timer size={13} />} text={isOpen ? store.delivery_time : "We are closed."} highlight={!isOpen} color={!isOpen ? 'text-error' : ''} />
            <StoreDetail icon={<MapPin size={13} />} text={store.distance} />
            <StoreDetail icon={<ReceiptText size={13} />} text={`Min £${store.min_order?.toFixed(2)}`} />
            <StoreDetail icon={<Bike size={13} />} text={store.delivery_fee} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button 
              onClick={onSelect}
              className={`w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                isOpen 
                  ? 'bg-primary text-white shadow-lg shadow-primary/15 hover:bg-primary-hover' 
                  : 'bg-on-surface text-white hover:bg-on-surface/90'
              }`}
            >
              {isOpen ? (
                <>
                  <Bike size={16} />
                  <span>Deliver to me</span>
                </>
              ) : (
                <span>View Store</span>
              )}
            </button>

            {isOpen && (
              <button className="w-full py-2 rounded-xl border border-success/30 text-success font-bold text-[10px] flex items-center justify-center gap-2 bg-success/5 hover:bg-success/10 transition-colors">
                <Tag size={13} />
                <span>Get £11 off with Rewards</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StoreDetail({ icon, text, highlight = false, color = '' }: { icon: React.ReactNode, text: any, highlight?: boolean, color?: string, key?: React.Key }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
      <div className={`shrink-0 ${color || 'text-primary'}`}>{icon}</div>
      <span className={`truncate ${highlight ? 'font-black' : ''} ${color}`}>{text}</span>
    </div>
  );
}



