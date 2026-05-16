import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, MapPin, Clock, Truck, ReceiptText } from 'lucide-react';
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
  min_order_value?: number;
  free_delivery_threshold?: number;
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
        const enhancedStores = res.data.map((s: any, idx: number) => ({
          ...s,
          min_order_value: Number(s.min_order_value || 10.00),
          free_delivery_threshold: Number(s.free_delivery_threshold || 40.00),
          delivery_fee: s.delivery_fee || (idx === 0 ? '£0 - £3' : 'Free'),
          distance: s.distance || (0.5 + idx * 1.2).toFixed(2) + ' miles',
          delivery_time: s.delivery_time || '25 to 40 mins',
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
      min_order_value: store.min_order_value || 10.00,
      free_delivery_threshold: store.free_delivery_threshold || 40.00,
      lat: store.lat,
      lng: store.lng,
    });
    navigate('/browse');
  };

  if (loading) {
    return (
      <Layout title="Daily Grocer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  const openStores = stores.filter(s => isStoreCurrentlyOpen(s));
  const closedStores = stores.filter(s => !isStoreCurrentlyOpen(s));

  return (
    <Layout title="Daily Grocer">
      <div className="bg-background min-h-screen">
        {/* Postcode Search Bar */}
        <div className="bg-surface-container-lowest border-b border-outline-variant px-4 py-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-outline">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Enter your postcode"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-3 pl-10 pr-3 text-[15px] text-text-main outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue placeholder:text-outline transition-colors"
            />
          </div>
        </div>

        <main className="px-4 py-4 pb-32">
          {/* Heading */}
          <div className="mb-5 mt-2">
            <h2 className="text-headline-lg-mobile text-text-main mb-1">Available Stores</h2>
            <p className="text-on-surface-variant text-body-md">Stores delivering to your area.</p>
          </div>

          {/* Open stores */}
          {openStores.length > 0 && (
            <div className="grid grid-cols-1 gap-4 mb-6">
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
          )}

          {/* Closed stores */}
          {closedStores.length > 0 && (
            <>
              <h3 className="text-base font-bold text-on-surface-variant mt-4 mb-3">Currently Closed</h3>
              <div className="grid grid-cols-1 gap-4">
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
            </>
          )}

          {stores.length === 0 && (
            <div className="text-center py-16 ref-card-xl">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
                <MapPin size={32} />
              </div>
              <h3 className="text-headline-lg-mobile text-text-main mb-2">No Stores Found</h3>
              <p className="text-on-surface-variant text-sm">We couldn't find any stores near your location yet.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

function StoreCard({
  store,
  isOpen,
  index,
  onSelect,
}: {
  store: StoreData;
  isOpen: boolean;
  index: number;
  onSelect: () => void;
  key?: React.Key;
}) {
  // Highlight first open store as "FAST"
  const isFast = isOpen && index === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`ref-card p-4 flex flex-col gap-4 relative overflow-hidden ${!isOpen ? 'opacity-80' : ''}`}
    >
      {isFast && <div className="absolute top-0 left-0 w-1 h-full bg-price-green" />}

      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 border border-outline-variant ${!isOpen ? 'grayscale' : ''}`}>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/5 flex items-center justify-center font-headline font-extrabold text-2xl text-primary">
              {store.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-label-bold text-on-surface truncate">{store.name}</h3>
            {isFast && (
              <span className="bg-price-green/10 text-price-green text-[10px] font-bold px-2 py-0.5 rounded">FAST</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {isOpen ? store.delivery_time : 'Currently closed'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {store.distance}
            </span>
            <span className="flex items-center gap-1">
              <ReceiptText size={14} />
              Min £{store.min_order_value?.toFixed(2)}
            </span>
            <span className="flex items-center gap-1">
              <Truck size={14} />
              {store.delivery_fee}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onSelect}
        disabled={!isOpen}
        className={`w-full text-label-bold font-semibold py-3 rounded-md text-center transition-colors ${
          isOpen
            ? 'bg-action-red text-on-primary hover:bg-secondary'
            : 'border-2 border-outline-variant text-on-surface-variant cursor-not-allowed'
        }`}
      >
        {isOpen ? 'Deliver to me' : 'Currently Closed'}
      </button>
    </motion.article>
  );
}
