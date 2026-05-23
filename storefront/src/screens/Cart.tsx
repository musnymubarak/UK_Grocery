import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Minus, Plus, ArrowRight, ShoppingBag, Store, Info, ShoppingBasket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import { catalogApi, customerAuthApi } from '../services/api';

export default function Cart() {
  const { cart, updateQuantity, totalPrice, selectedStore } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [dynamicDeliveryFee, setDynamicDeliveryFee] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!selectedStore) return;

    const fetchFee = async () => {
      let addressQuery = '';
      
      // 1. Try to get address from profile if authenticated
      if (isAuthenticated) {
        try {
          const res = await customerAuthApi.getProfile();
          const addrs = res.data.addresses || [];
          const defaultAddr = addrs.find((a: any) => a.is_default) || addrs[0];
          if (defaultAddr) {
            addressQuery = `${defaultAddr.street}, ${defaultAddr.postcode}`;
          }
        } catch (err) {
          console.error('Failed to fetch profile for delivery fee:', err);
        }
      }

      // 2. Fall back to localStorage temp address/postcode if no profile address found
      if (!addressQuery) {
        const tempPostcode = localStorage.getItem('dg_temp_postcode') || '';
        const tempAddress = localStorage.getItem('dg_temp_address') || '';
        if (tempPostcode.length >= 5 && tempAddress.length > 3) {
          addressQuery = `${tempAddress}, ${tempPostcode}`;
        } else if (tempPostcode.length >= 5) {
          addressQuery = tempPostcode;
        }
      }

      // 3. Call calculate-distance-fee if addressQuery is set
      if (addressQuery) {
        try {
          const res = await catalogApi.calculateDistanceFee(selectedStore.id, addressQuery);
          if (res.data && res.data.deliverable && typeof res.data.delivery_fee === 'number') {
            setDynamicDeliveryFee(res.data.delivery_fee);
            return;
          }
        } catch (err) {
          console.error('Failed to calculate distance fee on cart:', err);
        }
      }

      // 4. Default fallback
      setDynamicDeliveryFee(null);
    };

    fetchFee();
  }, [selectedStore, isAuthenticated]);

  const serviceFee = 0.99;
  const bagCharge = 0.30;
  const baseDeliveryFee = dynamicDeliveryFee !== null ? dynamicDeliveryFee : (selectedStore?.delivery_fee ?? 3.0);
  const freeThreshold = selectedStore?.free_delivery_threshold ?? 40.0;
  const deliveryFee = totalPrice >= freeThreshold ? 0 : baseDeliveryFee;
  const finalTotal = totalPrice + serviceFee + bagCharge + deliveryFee;

  const minSpend = selectedStore?.min_order_value || 10.0;
  const isMinMet = totalPrice >= minSpend;

  const handleCheckout = () => {
    if (!isMinMet) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <Layout title="QuickGrocery" showBack dark>
      <div className="px-4 py-6 pb-32 max-w-[90rem] mx-auto w-full">
        {/* Mobile Layout (hidden on desktop) */}
        <div className="md:hidden max-w-2xl mx-auto w-full">
          <h2 className="text-headline-lg-mobile text-text-main mb-4">Your Basket</h2>

          {/* Store Info Card */}
          {selectedStore && (
            <div className="ref-card p-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-action-blue shrink-0">
                  <Store size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-label-bold text-text-main truncate">{selectedStore.name}</p>
                  <p className="text-xs text-on-surface-variant">Delivery in 25-40 mins</p>
                </div>
              </div>
              <button onClick={() => navigate('/stores')} className="text-action-blue text-label-bold font-semibold shrink-0 ml-2">
                Change
              </button>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-3 mb-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 ref-card-xl">
                <ShoppingBag size={56} className="mx-auto mb-4 text-outline" />
                <h3 className="text-headline-lg-mobile text-text-main mb-2">Your basket is empty</h3>
                <p className="text-on-surface-variant mb-6 text-sm">Time to stock up on some groceries!</p>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 bg-action-red text-on-primary px-6 py-3 rounded-md text-label-bold font-semibold hover:bg-secondary transition-colors"
                >
                  <ShoppingBasket size={16} /> Start Shopping
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="ref-card p-3 flex gap-3 items-center">
                  <img
                    src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=001d3d&color=fff&size=160`}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md border border-outline-variant shrink-0 bg-surface-container-low"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="text-label-bold text-text-main truncate">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">{item.unit || 'each'}</p>
                    <p className="text-price-display text-text-main mt-1">£{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container border border-outline-variant rounded-full p-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-dim transition-colors text-text-main"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-label-bold font-semibold w-4 text-center text-text-main">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-dim transition-colors text-text-main"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              {/* Pricing Breakdown */}
              <div className="ref-card p-4 mb-5">
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm">
                  <span>Subtotal</span>
                  <span>£{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm">
                  <div className="flex items-center gap-1">
                    <span>Service Charge</span>
                    <Info size={14} className="text-on-surface-variant" />
                  </div>
                  <span>£{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm">
                  <span>Bag Charge</span>
                  <span>£{bagCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm">
                  <span>Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-price-green text-label-bold font-semibold">Free</span>
                  ) : (
                    <span>£{deliveryFee.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-outline-variant mt-2 pt-3 flex justify-between items-end">
                  <span className="text-label-bold text-text-main">Total</span>
                  <span className="text-display-lg text-text-main">£{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Free delivery message */}
              {totalPrice < freeThreshold && (
                <div className="bg-price-green/10 border border-price-green/20 rounded-md py-2.5 text-center mb-5">
                  <p className="text-price-green text-xs font-semibold uppercase tracking-wider">
                    Spend £{(freeThreshold - totalPrice).toFixed(2)} more for FREE delivery
                  </p>
                </div>
              )}

              {/* Coupon Code */}
              <div className="ref-card p-4 mb-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10)"
                    className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md py-2 px-3 text-sm outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue"
                  />
                  <button className="bg-surface-dark text-on-primary text-label-bold font-semibold px-4 py-2 rounded-md hover:bg-primary-container transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Minimum spend message */}
              {!isMinMet && (
                <p className="text-center text-xs text-error font-semibold mb-4">
                  You have not yet met the minimum spend. Spend £{(minSpend - totalPrice).toFixed(2)} more to proceed.
                </p>
              )}

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={!isMinMet}
                className="w-full bg-action-red hover:bg-secondary disabled:bg-outline-variant disabled:text-on-surface-variant text-on-primary text-label-bold font-semibold py-4 rounded-md flex items-center justify-center gap-2 transition-colors mb-3"
              >
                <span>Checkout</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/browse')}
                className="w-full border border-action-blue text-action-blue text-label-bold font-semibold py-3 rounded-md hover:bg-action-blue/5 transition-colors"
              >
                Continue Shopping
              </button>
            </>
          )}
        </div>

        {/* Desktop Layout (hidden on mobile) */}
        <div className="hidden md:grid grid-cols-12 gap-8 items-start w-full">
          {/* Left Column: Basket Items */}
          <div className="col-span-7 space-y-4">
            <h2 className="text-2xl font-bold text-text-main mb-2">Your Basket</h2>
            {cart.length === 0 ? (
              <div className="text-center py-16 ref-card-xl">
                <ShoppingBag size={56} className="mx-auto mb-4 text-outline" />
                <h3 className="text-xl font-bold text-text-main mb-2">Your basket is empty</h3>
                <p className="text-on-surface-variant mb-6 text-sm">Time to stock up on some groceries!</p>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 bg-action-red text-on-primary px-6 py-3 rounded-md text-label-bold font-semibold hover:bg-secondary transition-colors"
                >
                  <ShoppingBasket size={16} /> Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="ref-card p-4 flex gap-4 items-center">
                    <img
                      src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=001d3d&color=fff&size=160`}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md border border-outline-variant shrink-0 bg-surface-container-low"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-text-main text-base truncate">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">{item.unit || 'each'}</p>
                      <p className="text-price-display text-text-main mt-1">£{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-container border border-outline-variant rounded-full p-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-dim transition-colors text-text-main"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-label-bold font-semibold w-4 text-center text-text-main">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-dim transition-colors text-text-main"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Checkout Info and Actions */}
          {cart.length > 0 && (
            <div className="col-span-5 space-y-5 sticky top-24">
              {/* Store Info Card */}
              {selectedStore && (
                <div className="ref-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-action-blue shrink-0">
                      <Store size={22} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-label-bold text-text-main truncate">{selectedStore.name}</p>
                      <p className="text-xs text-on-surface-variant">Delivery in 25-40 mins</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/stores')} className="text-action-blue text-label-bold font-semibold shrink-0 ml-2">
                    Change
                  </button>
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="ref-card p-5">
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>£{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm font-semibold">
                  <div className="flex items-center gap-1">
                    <span>Service Charge</span>
                    <Info size={14} className="text-on-surface-variant" />
                  </div>
                  <span>£{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm font-semibold">
                  <span>Bag Charge</span>
                  <span>£{bagCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-on-surface-variant text-sm font-semibold mb-2">
                  <span>Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-price-green text-label-bold font-semibold">Free</span>
                  ) : (
                    <span>£{deliveryFee.toFixed(2)}</span>
                  )}
                </div>

                {/* Free delivery banner */}
                {totalPrice < freeThreshold && (
                  <div className="bg-price-green/10 border border-price-green/20 rounded-md py-2.5 text-center mb-4">
                    <p className="text-price-green text-xs font-semibold uppercase tracking-wider">
                      Spend £{(freeThreshold - totalPrice).toFixed(2)} more for FREE delivery
                    </p>
                  </div>
                )}

                <div className="border-t border-outline-variant pt-4 flex justify-between items-end">
                  <span className="text-label-bold text-text-main text-base">Total Cost</span>
                  <span className="text-price-display text-2xl text-text-main">£{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="ref-card p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3 text-sm outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue"
                  />
                  <button className="bg-action-blue text-on-primary text-label-bold font-semibold px-5 py-2.5 rounded-md hover:bg-action-blue/90 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Minimum spend message */}
              {!isMinMet && (
                <p className="text-center text-xs text-error font-semibold">
                  You have not yet met the minimum spend. Spend £{(minSpend - totalPrice).toFixed(2)} more to proceed.
                </p>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={!isMinMet}
                  className="w-full bg-action-red hover:bg-secondary disabled:bg-outline-variant disabled:text-on-surface-variant text-on-primary text-label-bold font-semibold py-4 rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => navigate('/browse')}
                  className="w-full border border-action-blue text-action-blue text-label-bold font-semibold py-3 rounded-md hover:bg-action-blue/5 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Rewards promo card */}
              <div className="ref-card-xl overflow-hidden flex h-28 bg-white hover:border-action-blue transition-colors">
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-action-blue font-bold text-sm">
                    <span className="w-1.5 h-1.5 bg-action-blue rounded-full shrink-0" />
                    <span>Rewards</span>
                  </div>
                  <button onClick={() => navigate('/profile')} className="border border-outline text-text-main text-[11px] font-semibold px-3 py-1 rounded hover:bg-surface-container-low transition-colors w-fit">
                    Find out more
                  </button>
                </div>
                <div className="w-1/3 bg-gradient-to-r from-action-red to-secondary relative flex items-center justify-center text-white p-4">
                  <ShoppingBag size={28} className="opacity-90" />
                  <div className="absolute right-0 bottom-0 top-0 left-0 bg-black/5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
