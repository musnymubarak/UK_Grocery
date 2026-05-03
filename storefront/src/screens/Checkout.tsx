import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { MapPin, CreditCard, ShieldCheck, Leaf, Lock, ShoppingBasket, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, couponApi, customerAuthApi, catalogApi, getErrorMessage } from '../services/api';
import { useState, useEffect } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart, selectedStore, hasAgeRestrictedItems } = useCart();
  const { isAuthenticated } = useAuth();
  
  // States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isNewAddress, setIsNewAddress] = useState(false);
  
  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Delivery Fee Calculation
  const [deliveryInfo, setDeliveryInfo] = useState<{ deliverable: boolean, fee: number, distance: number, message?: string } | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingProfile(true);
      customerAuthApi.getProfile()
        .then(res => {
          const addrs = res.data.addresses || [];
          setAddresses(addrs);
          const defaultAddr = addrs.find((a: any) => a.is_default) || addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else {
            setIsNewAddress(true);
          }
        })
        .finally(() => setIsLoadingProfile(false));
    }
  }, [isAuthenticated]);

  // Handle distance-based fee calculation
  useEffect(() => {
    let activePostcode = '';
    if (isNewAddress) {
      if (postcode.length >= 5) activePostcode = postcode;
    } else {
      const selected = addresses.find(a => a.id === selectedAddressId);
      if (selected) activePostcode = selected.postcode;
    }

    if (activePostcode && selectedStore) {
      setIsCalculatingFee(true);
      catalogApi.calculateDistanceFee(selectedStore.id, activePostcode)
        .then(res => {
          setDeliveryInfo({
            deliverable: res.data.deliverable,
            fee: Number(res.data.delivery_fee || 0),
            distance: Number(res.data.distance_miles || 0),
            message: res.data.message
          });
          if (!res.data.deliverable) {
            setAddressError(res.data.message || 'Delivery not available to this location.');
          } else {
            setAddressError(null);
          }
        })
        .catch(() => {
          // Fallback
          setDeliveryInfo({ deliverable: true, fee: 1.99, distance: 0 });
        })
        .finally(() => setIsCalculatingFee(false));
    } else {
      setDeliveryInfo(null);
    }
  }, [postcode, selectedAddressId, isNewAddress, addresses, selectedStore]);

  const deliveryFee = deliveryInfo?.fee ?? 0;
  const finalTotal = Math.max(0, totalPrice + deliveryFee - appliedDiscount);

  const handleValidatePromo = async () => {
    if (!promoCode.trim() || !selectedStore) return;
    setIsValidatingPromo(true);
    setPromoError(null);
    setPromoSuccess(null);
    try {
      const res = await couponApi.validate({
        code: promoCode.trim(),
        store_id: selectedStore.id,
        subtotal: totalPrice,
        delivery_fee: deliveryFee
      });
      if (res.data.valid) {
        setAppliedDiscount(Number(res.data.discount_amount || 0));
        setPromoError(null);
        const msg = `Promo applied! You saved £${Number(res.data.discount_amount).toFixed(2)}`;
        setPromoSuccess(msg);
        toast.success(msg);
      } else {
        setAppliedDiscount(0);
        setPromoSuccess(null);
        const msg = res.data.message || 'Invalid promo code';
        setPromoError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setAppliedDiscount(0);
      const msg = getErrorMessage(err, 'Failed to validate promo code');
      setPromoError(msg);
      toast.error(msg);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (!selectedStore) {
      setError('Please select a store first.');
      return;
    }
    if (cart.length === 0) {
      const msg = 'Your cart is empty.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (deliveryInfo && !deliveryInfo.deliverable) {
      setError(deliveryInfo.message || 'Sorry, we cannot deliver to this address.');
      return;
    }

    if (selectedStore && !selectedStore.is_open) {
      const msg = 'Sorry, this store is currently closed and not accepting orders.';
      setError(msg);
      toast.error(msg);
      return;
    }
    
    setAgeError(null);
    setAddressError(null);
    setPromoError(null);

    if (hasAgeRestrictedItems && !isAgeConfirmed) {
      const msg = 'Please confirm your age for restricted items.';
      setAgeError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await orderApi.checkout(selectedStore.id, {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        delivery_address_id: (!isNewAddress && selectedAddressId) ? selectedAddressId : undefined,
        delivery_address: isNewAddress ? address : undefined,
        delivery_postcode: isNewAddress ? (postcode || undefined) : (selectedAddressId ? addresses.find(a => a.id === selectedAddressId)?.postcode : undefined),
        payment_method: paymentMethod,
        notes: notes || undefined,
        coupon_code: (appliedDiscount > 0 && promoCode.trim()) ? promoCode.trim().toUpperCase() : undefined,
        age_confirmed: hasAgeRestrictedItems ? isAgeConfirmed : undefined,
      });
      clearCart();
      const orderId = res.data.id;
      toast.success('Order placed successfully! Cheerio!');
      navigate(`/tracking/${orderId}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : getErrorMessage(err, 'Failed to place order. Please try again.');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Checkout" showBack>
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-80 font-body">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Checkout</h2>

        <div className="space-y-6">
          {/* Delivery Address */}
          <section className="ss-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-primary" size={20} />
                <h3 className="text-lg font-bold">Delivery Address</h3>
              </div>
              {addresses.length > 0 && (
                <button 
                  onClick={() => setIsNewAddress(!isNewAddress)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {isNewAddress ? "Use Saved" : "Add New"}
                </button>
              )}
            </div>

            {isLoadingProfile ? (
              <div className="flex items-center gap-2 text-on-surface-variant py-2">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Loading addresses...</span>
              </div>
            ) : !isNewAddress && addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-md border cursor-pointer transition-all ${
                      selectedAddressId === addr.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-outline-variant/30 hover:border-primary/50 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-on-surface text-sm mb-1">{addr.street}</p>
                        <p className="text-xs text-on-surface-variant">{addr.city}, {addr.postcode}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedAddressId === addr.id ? 'border-primary bg-white' : 'border-outline-variant/50'
                      }`}>
                        {selectedAddressId === addr.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <Input label="Postcode" placeholder="e.g. SW1A 1AA" value={postcode} onChange={setPostcode} />
                <Input label="Street Address" placeholder="123 Conservatory Lane" value={address} onChange={setAddress} />
                <Input label="Contact Number" placeholder="+44 7700 900000" type="tel" value={phone} onChange={setPhone} />
              </div>
            )}
            
            <div className="mt-4 pt-4 ss-separator">
              <label className="text-sm font-bold text-on-surface block mb-2">Delivery Notes (Optional)</label>
              <textarea 
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                placeholder="Gate code, leave by the porch, etc."
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            {addressError && (
              <p className="mt-3 text-xs font-bold text-error bg-error/5 p-2 rounded-lg border border-error/10 uppercase tracking-wider">{addressError}</p>
            )}
          </section>

          {/* Payment Method */}
          <section className="ss-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="text-primary" size={20} />
              <h3 className="text-lg font-bold">Payment Method</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center justify-between p-4 rounded-md border transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-bold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-on-surface-variant">Pay at your doorstep</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  paymentMethod === 'cod' ? 'border-primary bg-white' : 'border-outline-variant/50'
                }`}>
                  {paymentMethod === 'cod' && <div className="w-2 h-2 bg-primary rounded-full" />}
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('online')}
                className={`flex items-center justify-between p-4 rounded-md border transition-all ${
                  paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-bold text-sm">Card Payment</p>
                    <p className="text-xs text-on-surface-variant">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  paymentMethod === 'online' ? 'border-primary bg-white' : 'border-outline-variant/50'
                }`}>
                  {paymentMethod === 'online' && <div className="w-2 h-2 bg-primary rounded-full" />}
                </div>
              </button>
            </div>

            {paymentMethod === 'online' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 ss-separator space-y-3 overflow-hidden"
              >
                <Input label="Card Number" placeholder="**** **** **** ****" value={cardDetails.number} onChange={v => setCardDetails({...cardDetails, number: v})} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry Date" placeholder="MM/YY" value={cardDetails.expiry} onChange={v => setCardDetails({...cardDetails, expiry: v})} />
                  <Input label="CVV" placeholder="***" type="password" value={cardDetails.cvv} onChange={v => setCardDetails({...cardDetails, cvv: v})} />
                </div>
              </motion.div>
            )}
          </section>

          {/* Promo Code */}
          <section className="ss-card p-6">
            <div className="flex gap-2 items-end mb-2">
              <div className="flex-1">
                <Input label="Promo Code" placeholder="Enter discount code" value={promoCode} onChange={setPromoCode} />
              </div>
              <button 
                onClick={handleValidatePromo} 
                disabled={isValidatingPromo || !promoCode}
                className="h-[46px] px-6 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 text-sm active:scale-95"
              >
                {isValidatingPromo ? <Loader2 className="animate-spin" size={18} /> : 'Apply'}
              </button>
            </div>
            {promoError && (
              <p className="text-[10px] font-black text-error uppercase tracking-[0.2em] mt-3 bg-error/5 p-2 rounded-lg border border-error/10 text-center">{promoError}</p>
            )}
            {promoSuccess && (
              <p className="text-[10px] font-black text-success uppercase tracking-[0.2em] mt-3 bg-success/5 p-2 rounded-lg border border-success/10 text-center">{promoSuccess}</p>
            )}
          </section>

          {/* Age Verification */}
          {hasAgeRestrictedItems && (
            <section className="ss-card p-6 border-2 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">Age Restricted Items</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Your basket contains items that require you to be 18 or older. You will be asked for valid ID upon delivery.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      isAgeConfirmed ? 'bg-primary border-primary' : 'border-outline group-hover:border-primary'
                    }`}>
                      {isAgeConfirmed && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isAgeConfirmed} 
                      onChange={() => setIsAgeConfirmed(!isAgeConfirmed)} 
                    />
                    <span className="text-sm font-bold text-on-surface">
                      I confirm I am 18+ years old
                    </span>
                  </label>
                </div>
              </div>
              {ageError && (
                <p className="mt-4 text-[10px] font-bold text-error uppercase tracking-wider">{ageError}</p>
              )}
            </section>
          )}

          {/* Summary */}
          <section className="ss-card p-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-medium text-on-surface">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Delivery Fee</span>
                <div className="flex flex-col items-end">
                  {isCalculatingFee ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={14} />
                      <span className="text-xs">Calculating...</span>
                    </div>
                  ) : deliveryInfo ? (
                    <>
                      <span className="font-medium text-on-surface">£{deliveryFee.toFixed(2)}</span>
                      {deliveryInfo.distance > 0 && (
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          {deliveryInfo.distance} miles away
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs">Enter address...</span>
                  )}
                </div>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-success font-medium">
                  <span>Discount Applied</span>
                  <span>-£{Number(appliedDiscount).toFixed(2)}</span>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-xl text-error font-bold text-sm text-center">
                  {error}
                </div>
              )}
              <div className="pt-3 mt-3 ss-separator flex justify-between items-center">
                <span className="text-base font-bold text-on-surface">Total</span>
                <span className="text-xl font-extrabold text-primary">£{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Button - Positioned higher to clear the curved bottom navigation bar */}
      <div className="fixed bottom-[140px] left-0 w-full p-4 z-50">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg shadow-[0_12px_40px_rgba(30,64,175,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-primary-container disabled:opacity-50 uppercase tracking-widest border border-white/20 backdrop-blur-md"
          >
            {submitting ? <Loader2 className="animate-spin" size={24} /> : (
              <>Place Order</>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}

function Input({ label, placeholder, type = 'text', value, onChange }: { label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface block">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-outline-variant/30 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
