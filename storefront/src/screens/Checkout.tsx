import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { MapPin, CreditCard, ShieldCheck, Leaf, Lock, ShoppingBasket, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, couponApi, customerAuthApi, getErrorMessage } from '../services/api';
import { useState, useEffect } from 'react';
import React from 'react';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart, selectedStore } = useCart();
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

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

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

  const finalTotal = Math.max(0, totalPrice - appliedDiscount);

  const handleValidatePromo = async () => {
    if (!promoCode.trim() || !selectedStore) return;
    setIsValidatingPromo(true);
    setError(null);
    try {
      const res = await couponApi.validate({
        code: promoCode.trim(),
        store_id: selectedStore.id,
        subtotal: totalPrice,
        delivery_fee: 0
      });
      if (res.data.valid) {
        setAppliedDiscount(res.data.discount_amount);
      } else {
        setAppliedDiscount(0);
        setError(res.data.message || 'Invalid promo code');
      }
    } catch (err) {
      setAppliedDiscount(0);
      setError(getErrorMessage(err, 'Failed to validate promo code'));
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedStore) {
      setError('Please select a store first.');
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty.');
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
        delivery_address_id: !isNewAddress ? selectedAddressId : undefined,
        delivery_address: isNewAddress ? address : undefined,
        delivery_postcode: isNewAddress ? postcode : undefined,
        payment_method: paymentMethod,
        notes,
        coupon_code: appliedDiscount > 0 ? promoCode.trim().toUpperCase() : undefined,
      });
      clearCart();
      const orderId = res.data.id;
      navigate(`/tracking/${orderId}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : getErrorMessage(err, 'Failed to place order. Please try again.');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Checkout" showBack>
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-64">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary leading-tight">Review & Secure Checkout</h2>
          <p className="text-on-surface-variant mt-2 font-medium">Finalize your harvest details below.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error font-medium">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-surface-container-low p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" size={24} />
                <h3 className="text-xl font-bold">Delivery Address</h3>
              </div>
              {addresses.length > 0 && (
                <button 
                  onClick={() => setIsNewAddress(!isNewAddress)}
                  className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  {isNewAddress ? "Use Saved" : "Add New"}
                </button>
              )}
            </div>

            {isLoadingProfile ? (
              <div className="flex items-center gap-3 text-on-surface-variant py-4">
                <Loader2 className="animate-spin" size={18} />
                <span className="text-sm">Fetching your addresses...</span>
              </div>
            ) : !isNewAddress && addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr.id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-outline-variant hover:border-primary/30 bg-surface'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-on-surface">{addr.street}</p>
                        <p className="text-sm text-on-surface-variant font-medium">{addr.city}, {addr.postcode}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAddressId === addr.id ? 'border-primary bg-primary' : 'border-outline-variant'
                      }`}>
                        {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Input label="Postcode" placeholder="e.g. SW1A 1AA" value={postcode} onChange={setPostcode} />
                <Input label="Street Address" placeholder="123 Conservatory Lane" value={address} onChange={setAddress} />
                <Input label="Contact Number" placeholder="+44 7700 900000" type="tel" value={phone} onChange={setPhone} />
              </div>
            )}
            
            <div className="mt-6 space-y-1.5 pt-6 border-t border-outline-variant/10">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Delivery Notes</label>
              <textarea 
                className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-shadow resize-none"
                placeholder="Gate code, leave by the porch, etc."
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-surface-container-low p-8 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Payment Method</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/20 bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ShoppingBasket size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Cash on Delivery</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Pay at your doorstep</p>
                  </div>
                </div>
                {paymentMethod === 'cod' && <ShieldCheck className="text-primary" size={24} />}
              </button>

              <button 
                onClick={() => setPaymentMethod('online')}
                className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all ${
                  paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/20 bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Card Payment</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                {paymentMethod === 'online' && <ShieldCheck className="text-primary" size={24} />}
              </button>
            </div>

            {paymentMethod === 'online' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 space-y-4 pt-6 border-t border-outline-variant/10 overflow-hidden"
              >
                <Input label="Card Number" placeholder="**** **** **** ****" value={cardDetails.number} onChange={v => setCardDetails({...cardDetails, number: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry Date" placeholder="MM/YY" value={cardDetails.expiry} onChange={v => setCardDetails({...cardDetails, expiry: v})} />
                  <Input label="CVV" placeholder="***" type="password" value={cardDetails.cvv} onChange={v => setCardDetails({...cardDetails, cvv: v})} />
                </div>
              </motion.div>
            )}
          </section>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <TrustItem icon={<ShieldCheck size={20} />} label="Secure SSL" />
            <TrustItem icon={<Leaf size={20} />} label="Carbon Neutral" />
            <TrustItem icon={<Lock size={20} />} label="Encrypted" />
          </div>

          {/* Promo Code */}
          <section className="bg-surface-container-low p-8 rounded-lg flex gap-3 items-end">
            <div className="flex-1">
              <Input label="Promo Code" placeholder="Enter discount code" value={promoCode} onChange={setPromoCode} />
            </div>
            <button 
              onClick={handleValidatePromo} 
              disabled={isValidatingPromo || !promoCode}
              className="h-[46px] px-6 bg-primary/10 text-primary font-bold rounded-sm border-none hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {isValidatingPromo ? 'Validating...' : 'Apply'}
            </button>
          </section>

          {/* Summary */}
          <section className="bg-surface-container-highest p-8 rounded-lg shadow-inner">
            <h3 className="text-lg font-bold mb-6">Order Summary</h3>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">{item.name} × {item.quantity}</span>
                  <span className="font-semibold">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-outline-variant/20">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-bold">£{totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Delivery Fee</span>
                <span className="text-primary font-bold">FREE</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-primary">
                  <span className="font-bold">Discount Applied</span>
                  <span className="font-bold">-£{appliedDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-4 mt-4 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="text-xl font-extrabold">Total</span>
                <span className="text-2xl font-extrabold text-primary">£{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Button - Stacked above nav on mobile */}
      <div className="fixed bottom-[104px] md:bottom-0 left-0 w-full p-6 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/5 z-50">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="w-full h-16 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-lg rounded-xl shadow-[0_12px_24px_rgba(44,104,46,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={24} /> : (
              <>Place Order <ShoppingBasket size={24} /></>
            )}
          </button>
          <p className="text-[10px] text-center mt-3 text-on-surface-variant/60 font-medium">By placing an order, you agree to our Terms & Conditions.</p>
        </div>
      </div>
    </Layout>
  );
}

function Input({ label, placeholder, type = 'text', value, onChange }: { label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-container-high border-none rounded-sm px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-shadow"
        placeholder={placeholder}
      />
    </div>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{label}</span>
    </div>
  );
}
