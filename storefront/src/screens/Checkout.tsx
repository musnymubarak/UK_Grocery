import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { MapPin, CreditCard, ShieldCheck, Clock, CheckCircle2, Tag, ReceiptText, Loader2, ArrowRight, Plus } from 'lucide-react';
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

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isNewAddress, setIsNewAddress] = useState(false);

  const [postcode, setPostcode] = useState(() => localStorage.getItem('dg_temp_postcode') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('dg_temp_address') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('dg_temp_phone') || '');
  const [notes, setNotes] = useState(() => localStorage.getItem('dg_temp_notes') || '');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [deliveryTiming, setDeliveryTiming] = useState<'asap' | 'schedule'>('asap');
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

  const [deliveryInfo, setDeliveryInfo] = useState<{ deliverable: boolean; fee: number; distance: number; message?: string } | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingProfile(true);
      customerAuthApi
        .getProfile()
        .then((res) => {
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

  useEffect(() => {
    localStorage.setItem('dg_temp_postcode', postcode);
    localStorage.setItem('dg_temp_address', address);
    localStorage.setItem('dg_temp_phone', phone);
    localStorage.setItem('dg_temp_notes', notes);
  }, [postcode, address, phone, notes]);

  useEffect(() => {
    let addressQuery = '';
    if (isNewAddress) {
      if (postcode.length >= 5 && address.length > 3) {
        addressQuery = `${address}, ${postcode}`;
      }
    } else {
      const selected = addresses.find((a) => a.id === selectedAddressId);
      if (selected) addressQuery = `${selected.street}, ${selected.postcode}`;
    }

    if (addressQuery && selectedStore) {
      setIsCalculatingFee(true);
      catalogApi
        .calculateDistanceFee(selectedStore.id, addressQuery)
        .then((res) => {
          setDeliveryInfo({
            deliverable: res.data.deliverable,
            fee: Number(res.data.delivery_fee || 0),
            distance: Number(res.data.distance_miles || 0),
            message: res.data.message,
          });
          if (!res.data.deliverable) {
            setAddressError(res.data.message || 'Delivery not available to this location.');
          } else {
            setAddressError(null);
          }
        })
        .catch(() => {
          setDeliveryInfo({ deliverable: true, fee: 1.99, distance: 0 });
        })
        .finally(() => setIsCalculatingFee(false));
    } else {
      setDeliveryInfo(null);
    }
  }, [postcode, address, selectedAddressId, isNewAddress, addresses, selectedStore]);

  const deliveryFee = deliveryInfo?.fee ?? 0;
  const isMinOrderMet = selectedStore ? totalPrice >= (selectedStore.min_order_value || 10) : true;
  const taxesAndFees = 1.85;
  const finalTotal = Math.max(0, totalPrice + deliveryFee + taxesAndFees - appliedDiscount);

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
        delivery_fee: deliveryFee,
      });
      if (res.data.valid) {
        setAppliedDiscount(Number(res.data.discount_amount || 0));
        const msg = `Promo applied! You saved £${Number(res.data.discount_amount).toFixed(2)}`;
        setPromoSuccess(msg);
        toast.success(msg);
      } else {
        setAppliedDiscount(0);
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
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        delivery_address_id: !isNewAddress && selectedAddressId ? selectedAddressId : undefined,
        delivery_address: isNewAddress ? address : undefined,
        delivery_postcode: isNewAddress ? postcode || undefined : selectedAddressId ? addresses.find((a) => a.id === selectedAddressId)?.postcode : undefined,
        payment_method: paymentMethod,
        notes: notes || undefined,
        coupon_code: appliedDiscount > 0 && promoCode.trim() ? promoCode.trim().toUpperCase() : undefined,
        age_confirmed: hasAgeRestrictedItems ? isAgeConfirmed : undefined,
      });
      clearCart();
      localStorage.removeItem('dg_temp_postcode');
      localStorage.removeItem('dg_temp_address');
      localStorage.removeItem('dg_temp_phone');
      localStorage.removeItem('dg_temp_notes');

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
    <Layout title="Checkout" showBack dark>
      <div className="px-4 py-5 pb-40 space-y-4 md:max-w-2xl md:mx-auto w-full">
        {/* 1. Delivery Address */}
        <CheckoutSection
          icon={<MapPin size={18} />}
          title="Delivery Address"
          right={
            addresses.length > 0 && (
              <button
                onClick={() => setIsNewAddress(!isNewAddress)}
                className="text-action-blue text-label-bold font-semibold hover:underline"
              >
                {isNewAddress ? 'Use Saved' : 'Add New'}
              </button>
            )
          }
        >
          {isLoadingProfile ? (
            <div className="flex items-center gap-2 text-on-surface-variant py-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Loading addresses...</span>
            </div>
          ) : !isNewAddress && addresses.length > 0 ? (
            <div className="space-y-2.5">
              {addresses.map((addr) => {
                const active = selectedAddressId === addr.id;
                return (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full text-left p-3 rounded-md border transition-colors flex justify-between items-start gap-3 ${
                      active
                        ? 'border-action-blue bg-action-blue/5'
                        : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-label-bold text-text-main mb-0.5">{addr.street}</p>
                      <p className="text-xs text-on-surface-variant">{addr.city}, {addr.postcode}</p>
                    </div>
                    {active ? (
                      <CheckCircle2 size={18} className="text-action-blue shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-outline-variant shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <Input label="Postcode" placeholder="e.g. SW1A 1AA" value={postcode} onChange={setPostcode} />
              <Input label="Street Address" placeholder="123 Conservatory Lane" value={address} onChange={setAddress} />
              <Input label="Contact Number" placeholder="+44 7700 900000" type="tel" value={phone} onChange={setPhone} />
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-outline-variant">
            <label className="text-xs font-semibold text-text-main block mb-1.5">Delivery Notes (Optional)</label>
            <textarea
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm focus:border-action-blue focus:ring-1 focus:ring-action-blue outline-none resize-none"
              placeholder="Gate code, leave by the porch, etc."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {addressError && (
            <p className="mt-3 text-xs text-error bg-error-container px-3 py-2 rounded-md">{addressError}</p>
          )}
        </CheckoutSection>

        {/* 2. Delivery Time */}
        <CheckoutSection icon={<Clock size={18} />} title="Delivery Time">
          <div className="grid grid-cols-1 gap-3">
            <RadioCard
              active={deliveryTiming === 'asap'}
              onClick={() => setDeliveryTiming('asap')}
              title="As soon as possible"
              subtitle="Est. 20-30 mins"
            />
            <RadioCard
              active={deliveryTiming === 'schedule'}
              onClick={() => setDeliveryTiming('schedule')}
              title="Schedule for later"
              subtitle="Choose a time slot"
            />
          </div>
        </CheckoutSection>

        {/* 3. Payment Method */}
        <CheckoutSection icon={<CreditCard size={18} />} title="Payment Method">
          <div className="space-y-2.5">
            <RadioCard
              active={paymentMethod === 'cod'}
              onClick={() => setPaymentMethod('cod')}
              title="Cash on Delivery"
              subtitle="Pay at your doorstep"
            />
            <RadioCard
              active={paymentMethod === 'online'}
              onClick={() => setPaymentMethod('online')}
              title="Card Payment"
              subtitle="Visa, Mastercard, Amex"
            />
            <button
              className="relative flex cursor-pointer rounded-md border border-outline-variant bg-surface-container-lowest p-3 items-center w-full hover:bg-surface-container-low transition-colors"
              type="button"
            >
              <div className="flex items-center gap-3 w-full">
                <Plus size={18} className="text-outline" />
                <span className="text-label-bold text-text-main">Add a new card</span>
              </div>
            </button>
          </div>

          {paymentMethod === 'online' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-outline-variant space-y-3 overflow-hidden"
            >
              <Input label="Card Number" placeholder="**** **** **** ****" value={cardDetails.number} onChange={(v) => setCardDetails({ ...cardDetails, number: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Expiry Date" placeholder="MM/YY" value={cardDetails.expiry} onChange={(v) => setCardDetails({ ...cardDetails, expiry: v })} />
                <Input label="CVV" placeholder="***" type="password" value={cardDetails.cvv} onChange={(v) => setCardDetails({ ...cardDetails, cvv: v })} />
              </div>
            </motion.div>
          )}
        </CheckoutSection>

        {/* 4. Promo Code */}
        <CheckoutSection icon={<Tag size={18} />} title="Promo Code">
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code (e.g. WELCOME10)"
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md py-2 px-3 text-sm outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue"
            />
            <button
              onClick={handleValidatePromo}
              disabled={isValidatingPromo || !promoCode}
              className="bg-surface-dark text-on-primary text-label-bold font-semibold px-4 py-2 rounded-md hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {isValidatingPromo ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
            </button>
          </div>
          {promoError && <p className="mt-2 text-xs text-error">{promoError}</p>}
          {promoSuccess && <p className="mt-2 text-xs text-price-green">{promoSuccess}</p>}
        </CheckoutSection>

        {/* Age Verification */}
        {hasAgeRestrictedItems && (
          <section className="ref-card-xl p-4 border-2 border-action-blue/30 bg-action-blue/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-action-blue" />
            <div className="flex items-start gap-3">
              <div className="p-2 bg-action-blue/10 text-action-blue rounded-full shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-label-bold text-text-main mb-1">Age Restricted Items</h3>
                <p className="text-sm text-on-surface-variant mb-3">
                  Your basket contains items that require you to be 18 or older. You will be asked for valid ID upon delivery.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-action-blue border-outline-variant rounded focus:ring-action-blue"
                    checked={isAgeConfirmed}
                    onChange={() => setIsAgeConfirmed(!isAgeConfirmed)}
                  />
                  <span className="text-sm font-semibold text-text-main">I confirm I am 18+ years old</span>
                </label>
              </div>
            </div>
            {ageError && <p className="mt-3 text-xs text-error">{ageError}</p>}
          </section>
        )}

        {/* Order Summary */}
        <CheckoutSection
          icon={<ReceiptText size={18} />}
          title="Order Summary"
          right={<span className="text-xs text-on-surface-variant">{cart.length} Items</span>}
        >
          <div className="space-y-2 mb-3 pb-3 border-b border-outline-variant">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-label-bold bg-surface-container-high px-2 py-0.5 rounded text-xs shrink-0">{item.quantity}x</span>
                  <span className="text-text-main text-sm truncate">{item.name}</span>
                </div>
                <span className="text-label-bold text-text-main shrink-0">£{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-sm text-on-surface-variant mb-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>£{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <div className="flex items-center gap-2">
                {isCalculatingFee ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    <span className="text-xs">Calculating</span>
                  </>
                ) : (
                  <span>£{deliveryFee.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Fees</span>
              <span>£{taxesAndFees.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-price-green font-semibold">
                <span>Discount</span>
                <span>-£{appliedDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end pt-3 border-t border-outline-variant">
            <span className="text-label-bold text-text-main">Total</span>
            <span className="text-price-display text-action-red">£{finalTotal.toFixed(2)}</span>
          </div>
        </CheckoutSection>

        {error && (
          <div className="bg-error-container border border-error/20 rounded-md text-error font-semibold text-sm text-center p-3">
            {error}
          </div>
        )}

        {!isMinOrderMet && selectedStore && (
          <div className="bg-error-container border border-error/20 rounded-md p-3">
            <p className="text-error text-center font-semibold text-sm">
              Add £{((selectedStore.min_order_value || 10) - totalPrice).toFixed(2)} more to meet the £{(selectedStore.min_order_value || 10).toFixed(2)} minimum
            </p>
          </div>
        )}
      </div>

      {/* Sticky Place Order CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-3xl lg:max-w-5xl xl:max-w-7xl bg-surface-container-lowest border-t border-outline-variant p-4 z-40 mb-14">
        <div className="md:max-w-2xl md:mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || !isMinOrderMet || (deliveryInfo ? !deliveryInfo.deliverable : false)}
            className="w-full bg-action-red hover:bg-secondary disabled:bg-outline-variant disabled:text-on-surface-variant text-on-primary text-headline-lg-mobile py-3 rounded-md transition-colors flex justify-center items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                {!isMinOrderMet ? 'Minimum Not Met' : 'Place Order'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-on-surface-variant mt-2">
            By placing your order, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </Layout>
  );
}

function CheckoutSection({
  icon,
  title,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="ref-card-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-action-blue" />
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-label-bold text-text-main flex items-center gap-2">
          <span className="text-action-blue">{icon}</span>
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function RadioCard({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex cursor-pointer rounded-md border p-3 items-center justify-between w-full text-left transition-colors ${
        active
          ? 'border-action-blue bg-action-blue/5'
          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
      }`}
    >
      <div className="flex flex-col">
        <span className="text-label-bold text-text-main">{title}</span>
        <span className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</span>
      </div>
      {active ? (
        <CheckCircle2 size={18} className="text-action-blue shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-outline-variant shrink-0" />
      )}
    </button>
  );
}

function Input({ label, placeholder, type = 'text', value, onChange }: { label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-main block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-sm focus:border-action-blue focus:ring-1 focus:ring-action-blue outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
