import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { Search, MapPin, Clock, Truck, ReceiptText, Navigation, Loader2, Bike } from 'lucide-react';
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
  delivery_fee_num?: number;
  distance?: string;
  distanceVal?: number;
  delivery_time?: string;
  is_deliverable?: boolean;
}

export default function StoreSelection() {
  const navigate = useNavigate();
  const { setSelectedStore } = useCart();
  const [rawStores, setRawStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postcode, setPostcode] = useState('SW1A 2AA');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>({
    lat: 51.5034, // Default London latitude (Downing St / SW1A 2AA)
    lng: -0.1276  // Default London longitude
  });
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch free OpenStreetMap Nominatim suggestions with a 500ms debounce
  useEffect(() => {
    if (!postcode || postcode.length < 3) {
      setSuggestions([]);
      return;
    }

    // Don't search if the input value matches a fully selected display address
    if (postcode.includes(', United Kingdom') || postcode.includes(', UK')) {
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(postcode + ', UK')}&countrycodes=gb&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'DailyGrocerStorefront/1.0'
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(timer);
  }, [postcode]);

  const handleSelectSuggestion = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setCoordinates({ lat, lng });

    // Extract a concise, clean display name for the input field
    const addr = item.address;
    const parts = [];
    if (addr.road) parts.push(addr.road);
    if (addr.suburb) parts.push(addr.suburb);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.postcode) parts.push(addr.postcode);

    const conciseAddr = parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 3).join(', ');
    setPostcode(conciseAddr);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    catalogApi.getStores()
      .then(res => {
        setRawStores(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  };

  const handleSearchAddress = async (val: string) => {
    if (!val.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const cleanPostcode = val.replace(/\s+/g, '').toUpperCase();
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      if (!response.ok) {
        throw new Error('Please enter a valid UK postcode (e.g. SW1A 2AA)');
      }
      const data = await response.json();
      setCoordinates({
        lat: data.result.latitude,
        lng: data.result.longitude
      });
      setPostcode(data.result.postcode);
    } catch (err: any) {
      setSearchError(err.message || 'Postcode lookup failed');
    } finally {
      setSearching(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Reverse geocode using postcodes.io
        try {
          const res = await fetch(`https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.result && data.result.length > 0) {
              setPostcode(data.result[0].postcode);
            } else {
              setPostcode(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          }
        } catch {
          setPostcode(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error(error);
        setSearchError('Unable to retrieve your location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stores = useMemo(() => {
    const calculated = rawStores.map((s: any, idx: number) => {
      let distanceStr = '0.50 miles';
      let distanceMiles = 0.5;

      if (coordinates && s.lat && s.lng) {
        const dist = calculateDistance(coordinates.lat, coordinates.lng, Number(s.lat), Number(s.lng));
        distanceMiles = dist;
        distanceStr = dist.toFixed(2) + ' miles';
      } else {
        // Safe default incremental distances for initial load
        distanceMiles = 0.5 + idx * 1.2;
        distanceStr = distanceMiles.toFixed(2) + ' miles';
      }

      // Calculate dynamic delivery fee based on backend delivery tiers
      let deliveryFeeVal = '£1.99';
      let deliveryFeeNum = 1.99;
      let deliverable = true;

      if (distanceMiles <= 1.0) {
        deliveryFeeVal = '£1.99';
        deliveryFeeNum = 1.99;
      } else if (distanceMiles <= 2.0) {
        deliveryFeeVal = '£2.99';
        deliveryFeeNum = 2.99;
      } else if (distanceMiles <= 3.0) {
        deliveryFeeVal = '£3.99';
        deliveryFeeNum = 3.99;
      } else if (distanceMiles <= 4.0) {
        deliveryFeeVal = '£4.99';
        deliveryFeeNum = 4.99;
      } else if (distanceMiles <= 5.0) {
        deliveryFeeVal = '£5.99';
        deliveryFeeNum = 5.99;
      } else {
        deliveryFeeVal = 'Delivery Not Available';
        deliveryFeeNum = 0.00;
        deliverable = false;
      }

      return {
        ...s,
        min_order_value: Number(s.min_order_value || 10.00),
        free_delivery_threshold: Number(s.free_delivery_threshold || 40.00),
        delivery_fee: deliveryFeeVal,
        delivery_fee_num: deliveryFeeNum,
        distance: distanceStr,
        distanceVal: distanceMiles,
        is_deliverable: deliverable,
        delivery_time: s.delivery_time || '25 to 40 mins',
      };
    });

    // Sort: Deliverable stores first, then by distance (closest first)
    return calculated.sort((a, b) => {
      if (a.is_deliverable && !b.is_deliverable) return -1;
      if (!a.is_deliverable && b.is_deliverable) return 1;
      return a.distanceVal - b.distanceVal;
    });
  }, [rawStores, coordinates]);

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
      delivery_fee: store.delivery_fee_num || 3.00,
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

  // Split stores: Open & Deliverable, Closed & Deliverable, and Undeliverable
  const openStores = stores.filter(s => isStoreCurrentlyOpen(s) && s.is_deliverable);
  const closedStores = stores.filter(s => !isStoreCurrentlyOpen(s) && s.is_deliverable);
  const undeliverableStores = stores.filter(s => !s.is_deliverable);

  return (
    <Layout title="Daily Grocer">
      <div className="bg-[#F8FAFC] md:bg-[#F8FAFC] min-h-screen">
        {/* Coordinate & Postcode Search Bar */}
        <div className="bg-surface-container-lowest border-b border-outline-variant px-4 py-4 md:py-5 flex flex-col items-center md:shadow-sm">
          <div className="relative w-full md:max-w-xl">
            <span
              onClick={() => handleSearchAddress(postcode)}
              className="absolute inset-y-0 left-3 md:left-4 flex items-center text-outline cursor-pointer hover:text-action-blue transition-colors z-10"
              title="Search manually"
            >
              <Search size={18} className="md:w-5 md:h-5" />
            </span>
            <input
              type="text"
              value={postcode}
              onChange={(e) => {
                setPostcode(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchAddress(postcode);
                  setShowSuggestions(false);
                }
              }}
              placeholder={searching ? "Searching..." : "Enter UK postcode or street address"}
              disabled={searching}
              className="w-full bg-surface-container-lowest md:bg-[#F8FAFC] border border-outline-variant md:border-outline-variant/30 rounded-md md:rounded-2xl py-3 md:py-3.5 pl-10 md:pl-12 pr-[105px] md:pr-[120px] text-[15px] text-text-main outline-none focus:border-action-blue focus:ring-1 md:focus:ring-2 focus:ring-action-blue md:focus:ring-action-blue/20 placeholder:text-outline md:placeholder:text-on-surface-variant/40 font-medium transition-all shadow-none md:shadow-inner"
            />
            <button
              onClick={handleLocateMe}
              disabled={locating || searching}
              className="absolute inset-y-1.5 right-1.5 md:right-2 flex items-center gap-1 bg-[#005eb8]/10 hover:bg-[#005eb8]/20 text-[#005eb8] font-bold text-xs px-2.5 md:px-4 rounded-md md:rounded-xl transition-all active:scale-95 disabled:opacity-50 z-10"
              title="Locate me automatically using GPS"
            >
              {locating ? (
                <Loader2 size={13} className="animate-spin text-[#005eb8]" />
              ) : (
                <Navigation size={13} className="rotate-45 text-[#005eb8]" />
              )}
              <span className="hidden xs:inline">Locate me</span>
            </button>

            {/* Sleek Floating Address Suggestions Dropdown */}
            {suggestions.length > 0 && showSuggestions && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant/60 rounded-xl shadow-lg max-h-60 overflow-y-auto z-[999] py-1.5">
                {suggestions.map((item: any, idx: number) => {
                  const addr = item.address;
                  const parts = [];
                  if (addr.road) parts.push(addr.road);
                  if (addr.suburb) parts.push(addr.suburb);
                  if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
                  if (addr.postcode) parts.push(addr.postcode);

                  const label = parts.length > 0 ? parts.join(', ') : item.display_name;
                  return (
                    <li
                      key={idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="px-4 py-2 text-sm text-text-main hover:bg-[#005eb8]/5 cursor-pointer transition-colors flex items-center gap-2.5"
                    >
                      <MapPin size={15} className="text-[#005eb8] shrink-0" />
                      <span className="truncate font-medium">{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {searchError && (
            <div className="text-center mt-2 text-xs font-semibold text-action-red animate-pulse">
              {searchError}
            </div>
          )}
        </div>

        <main className="px-4 py-4 pb-32 md:max-w-[90rem] md:mx-auto md:py-8">
          {/* Section 1: Stores for Delivery (Open & Deliverable) */}
          {openStores.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4 mt-2">
                <Bike className="text-[#005eb8] stroke-[2.5]" size={20} />
                <h2 className="font-headline font-extrabold text-lg md:text-2xl text-primary">
                  Stores <span className="text-[#005eb8]">for delivery</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
            </div>
          )}

          {/* Section 2: Closed Stores (Deliverable but Closed) */}
          {closedStores.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4 mt-6">
                <Clock className="text-action-red stroke-[2.5]" size={20} />
                <h2 className="font-headline font-extrabold text-lg md:text-2xl text-action-red">
                  Closed Stores
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
            </div>
          )}

          {/* Section 3: Stores Out of Delivery Range */}
          {undeliverableStores.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4 mt-6">
                <MapPin className="text-on-surface-variant/60 stroke-[2.5]" size={20} />
                <h2 className="font-headline font-extrabold text-lg md:text-2xl text-on-surface-variant">
                  Out of Delivery Range
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {undeliverableStores.map((store, index) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    isOpen={isStoreCurrentlyOpen(store)}
                    index={index}
                    onSelect={() => handleSelectStore(store)}
                  />
                ))}
              </div>
            </div>
          )}

          {stores.length === 0 && (
            <div className="text-center py-16 ref-card-xl md:bg-white md:border md:border-outline-variant/20 md:rounded-[2rem] md:shadow-sm md:max-w-xl md:mx-auto">
              <div className="w-16 h-16 bg-surface-container md:bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant md:text-primary">
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
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const isDeliverable = store.is_deliverable !== false;

  // Resolve local logo URL based on store name
  const getStoreLogoUrl = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('family shopper')) return '/images/stores/family_shopper.webp';
    if (n.includes('go local')) return '/images/stores/golocal.png';
    if (n.includes('premier')) return '/images/stores/premier.png';
    if (n.includes('stocksfield')) return '/images/stores/Stocksfield.png';
    return '';
  };

  const localLogo = getStoreLogoUrl(store.name);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isOpen && isDeliverable && isDesktop ? { y: -6, transition: { duration: 0.2 } } : {}}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        if (isOpen && isDeliverable) {
          onSelect();
        }
      }}
      className={`ref-card bg-white border border-outline-variant/60 rounded-2xl p-4 flex flex-row gap-4 md:gap-5 relative overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] ${
        isOpen && isDeliverable ? 'cursor-pointer hover:border-action-blue' : ''
      } ${(!isOpen || !isDeliverable) ? 'opacity-90 bg-slate-50/50 grayscale-[25%]' : ''}`}
    >
      {/* Brand logo container on left */}
      <div className={`w-[110px] h-[110px] xs:w-[130px] xs:h-[130px] md:w-[160px] md:h-[160px] rounded-xl overflow-hidden flex-shrink-0 border border-outline-variant/80 bg-white flex items-center justify-center p-2 relative self-center ${(!isOpen || !isDeliverable) ? 'grayscale' : ''}`}>
        {localLogo || store.logo_url ? (
          <img src={localLogo || store.logo_url} alt={store.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-primary/5 flex items-center justify-center font-headline font-extrabold text-2xl text-primary">
            {store.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Details container on right */}
      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          {/* Store Name */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-headline font-extrabold text-[15px] xs:text-[17px] md:text-[19px] text-primary truncate leading-snug">
              {store.name}
            </h3>
          </div>

          {/* 2x2 Metadata Info Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 md:gap-y-2 text-xs xs:text-[13px] md:text-[14px] text-on-surface-variant font-semibold mb-4">
            {/* Clock Status */}
            <div className="flex items-center gap-2 truncate">
              <Clock size={15} className={isOpen ? "text-[#005eb8]" : "text-action-red"} />
              {isOpen ? (
                <span className="truncate text-on-surface-variant">{store.delivery_time}</span>
              ) : (
                <span className="text-action-red font-bold truncate">We are closed.</span>
              )}
            </div>

            {/* MapPin Distance */}
            <div className="flex items-center gap-2 truncate">
              <MapPin size={15} className="text-[#005eb8]" />
              <span className="truncate">{store.distance}</span>
            </div>

            {/* Receipt Basket */}
            <div className="flex items-center gap-2 truncate">
              <ReceiptText size={15} className="text-[#64748b]" />
              <span className="truncate">Min £{store.min_order_value?.toFixed(2)}</span>
            </div>

            {/* Delivery Truck */}
            <div className="flex items-center gap-2 truncate">
              <Truck size={15} className={isDeliverable ? "text-[#64748b]" : "text-action-red"} />
              {isDeliverable ? (
                <span className="truncate">{store.delivery_fee}</span>
              ) : (
                <span className="text-action-red font-bold truncate">Out of range</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Action Button */}
          <button
            onClick={onSelect}
            disabled={!isOpen || !isDeliverable}
            className={`w-full font-extrabold py-2.5 md:py-3 rounded-xl text-xs xs:text-sm md:text-sm text-center flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isOpen && isDeliverable
                ? 'bg-[#005eb8] text-white hover:bg-[#004a91] shadow-sm'
                : 'bg-[#1e293b] text-white hover:bg-[#0f172a] opacity-50 cursor-not-allowed'
              }`}
          >
            {!isDeliverable ? (
              <span>DELIVERY NOT AVAILABLE</span>
            ) : isOpen ? (
              <>
                <Truck size={16} className="stroke-[2.5]" />
                <span>DELIVER TO ME</span>
              </>
            ) : (
              <span>VIEW STORE</span>
            )}
          </button>

        </div>
      </div>
    </motion.article>
  );
}
