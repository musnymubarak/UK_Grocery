import { motion } from 'motion/react';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, MapPin, Info, Bike, Timer, ChevronRight, Tag, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, totalPrice, selectedStore } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const serviceFee = 0.99;
  const bagCharge = 0.30;
  const deliveryFee = 3.00; // Mocked for basket preview
  const multiBuySaving = 2.55; // Mocked for aesthetic match
  const finalTotal = totalPrice + serviceFee + bagCharge + (totalPrice < 40 ? deliveryFee : 0) - (cart.length >= 3 ? multiBuySaving : 0);
  
  const minSpend = selectedStore?.min_order_value || 10.00;
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
    <Layout title="Basket" showBack>
      <div className="max-w-2xl mx-auto bg-surface-container-lowest min-h-screen pb-32 font-body">
        
        {/* Store Info Card */}
        {selectedStore && (
          <div className="px-4 pt-6">
            <div className="bg-white rounded-2xl border border-outline-variant/10 p-4 shadow-sm mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-success/10 flex items-center justify-center overflow-hidden bg-surface-container-low p-2">
                  <img src="/daily-grocer-logo.png" alt="Store" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-on-surface">{selectedStore.name}</h2>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Timer size={16} />
                    <span>25 to 40 mins</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">Delivery</p>
                </div>
              </div>
              
              <div className="bg-white border border-dashed border-primary/30 rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Bike size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">Pricing Information</p>
                    <p className="text-sm font-bold text-on-surface">£0 - £3</p>
                  </div>
                </div>
                <Info size={20} className="text-primary/40 group-hover:text-primary" />
              </div>
            </div>
          </div>
        )}

        <div className="px-4 space-y-6">
          {/* Cart Items List */}
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-outline-variant/10">
                <ShoppingBag size={64} className="mx-auto mb-6 text-outline-variant/30" />
                <h3 className="text-xl font-bold text-on-surface mb-2">Your basket is empty</h3>
                <p className="text-on-surface-variant mb-8">Time to stock up on some groceries!</p>
                <Link to="/browse" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20">
                  Start Shopping
                </Link>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-outline-variant/5">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm font-bold text-on-surface leading-tight truncate">{item.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-error bg-error/5 p-1 rounded-md active:scale-90 transition-transform"
                      >
                        <Trash2 size={18} />
                      </button>
                      <span className="font-bold text-base w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-primary bg-primary/5 p-1 rounded-md active:scale-90 transition-transform"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <span className="text-base font-black text-primary w-20 text-right">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              {/* Detailed Breakdown */}
              <div className="space-y-3 pt-4">
                {cart.length >= 3 && (
                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-on-surface italic">3 for £6.00</span>
                    <span className="text-on-surface-variant/40">- £{multiBuySaving.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm font-bold text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="text-on-surface">£{totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm font-bold text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span>Service Charge</span>
                    <Info size={14} className="text-on-surface-variant/40" />
                  </div>
                  <span className="text-on-surface">£{serviceFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-on-surface-variant">
                  <span>Gov bag charge</span>
                  <span className="text-on-surface">£{bagCharge.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-on-surface-variant">
                  <span>Delivery Fee</span>
                  <span className="text-on-surface">£{deliveryFee.toFixed(2)}</span>
                </div>

                {/* Free Delivery Banner */}
                <div className="bg-success/10 rounded-lg py-2.5 text-center border border-success/20">
                  <p className="text-success text-xs font-black uppercase tracking-widest">
                    {totalPrice >= 40 ? 'FREE DELIVERY APPLIED!' : 'Over £40, free delivery!'}
                  </p>
                </div>
              </div>

              {/* Total Cost */}
              <div className="flex justify-between items-end pt-4 border-t border-outline-variant/10">
                <span className="text-2xl font-black text-on-surface tracking-tight">Total Cost</span>
                <span className="text-3xl font-black text-primary tracking-tight">£{finalTotal.toFixed(2)}</span>
              </div>

              {/* Coupon Code */}
              <div className="pt-6">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Coupon Code" 
                    className="w-full bg-white border border-outline-variant/30 rounded-xl py-3.5 pl-4 pr-24 text-base font-medium outline-none focus:border-primary/50 transition-all shadow-sm"
                  />
                  <button className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-lg font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                    Apply
                  </button>
                </div>
              </div>

              {/* Rewards Banner */}
              <div className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden flex shadow-sm h-32">
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-xl text-white">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <h4 className="text-lg font-black text-primary">Rewards</h4>
                  </div>
                  <button className="text-xs font-bold text-on-surface-variant border border-outline-variant/30 rounded-lg py-2 px-4 w-max hover:bg-surface transition-colors">
                    Find out more
                  </button>
                </div>
                <div className="w-1/3 bg-red-500 relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-red-600/50 to-transparent"></div>
                   <div className="text-white/20 absolute -right-4 -bottom-4">
                     <Tag size={120} strokeWidth={1} />
                   </div>
                   <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-6 space-y-4">
                {!isMinMet && (
                  <p className="text-center text-xs font-bold text-error">
                    You have not yet met the <span className="font-black">minimum spend</span> value. Spend £{(minSpend - totalPrice).toFixed(2)} more to proceed with this order
                  </p>
                )}

                <button className="w-full bg-surface-container-high rounded-xl py-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-outline-variant/10">
                   <div className="flex items-center gap-1.5 grayscale">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_Logo_%282020%29.svg" className="h-5" alt="GPay" />
                   </div>
                   <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
                   <div className="flex items-center gap-1">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3 grayscale" alt="Visa" />
                      <span className="text-xs text-on-surface-variant font-black">•••• 3474</span>
                   </div>
                </button>

                <button 
                  onClick={handleCheckout}
                  disabled={!isMinMet}
                  className="w-full bg-surface-container py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 group hover:bg-outline-variant/20"
                >
                  <ArrowRight size={24} className="text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                  <span className="text-on-surface-variant group-hover:text-primary">Checkout</span>
                </button>

                <button 
                  onClick={() => navigate('/browse')}
                  className="w-full border border-primary text-primary py-4 rounded-xl font-black text-lg active:scale-[0.98] transition-all hover:bg-primary/5 uppercase tracking-widest"
                >
                  Continue shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

