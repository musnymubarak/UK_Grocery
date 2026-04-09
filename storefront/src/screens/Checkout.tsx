import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { MapPin, CreditCard, ShieldCheck, Leaf, Lock, ShoppingBasket, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, getErrorMessage } from '../services/api';
import { useState } from 'react';
import React from 'react';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart, selectedStore } = useCart();
  const { isAuthenticated } = useAuth();
  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await orderApi.checkout(selectedStore.id, {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        delivery_address: `${address}, ${postcode}`,
        delivery_postcode: postcode,
        notes,
      });
      clearCart();
      navigate('/success');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to place order. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Checkout" showBack>
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-40">
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
          {/* Delivery Address */}
          <section className="bg-surface-container-low p-8 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Delivery Address</h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <Input label="Postcode" placeholder="e.g. SW1A 1AA" value={postcode} onChange={setPostcode} />
              <Input label="Street Address" placeholder="123 Conservatory Lane" value={address} onChange={setAddress} />
              <Input label="Contact Number" placeholder="+44 7700 900000" type="tel" value={phone} onChange={setPhone} />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Delivery Notes</label>
                <textarea 
                  className="w-full bg-surface-container-high border-none rounded-sm px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-shadow resize-none"
                  placeholder="Gate code, leave by the porch, etc."
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-surface-container-low p-8 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Payment Method</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-md shadow-sm border border-outline-variant/10 hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-bold">Cash on Delivery</span>
                </div>
                <ShieldCheck className="text-primary" size={20} />
              </button>
            </div>
          </section>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <TrustItem icon={<ShieldCheck size={20} />} label="Secure SSL" />
            <TrustItem icon={<Leaf size={20} />} label="Carbon Neutral" />
            <TrustItem icon={<Lock size={20} />} label="Encrypted" />
          </div>

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
              <div className="pt-4 mt-4 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="text-xl font-extrabold">Total</span>
                <span className="text-2xl font-extrabold text-primary">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/5 z-50">
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
