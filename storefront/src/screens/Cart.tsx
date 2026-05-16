import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Minus, Plus, ArrowRight, ShoppingBag, Store, Info, ShoppingBasket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';

export default function Cart() {
  const { cart, updateQuantity, totalPrice, selectedStore } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const serviceFee = 0.99;
  const bagCharge = 0.30;
  const deliveryFee = totalPrice >= 40 ? 0 : 3.0;
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
      <div className="px-4 py-6 pb-32 md:max-w-2xl md:mx-auto w-full">
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
            {totalPrice < 40 && (
              <div className="bg-price-green/10 border border-price-green/20 rounded-md py-2.5 text-center mb-5">
                <p className="text-price-green text-xs font-semibold uppercase tracking-wider">
                  Spend £{(40 - totalPrice).toFixed(2)} more for FREE delivery
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
    </Layout>
  );
}
