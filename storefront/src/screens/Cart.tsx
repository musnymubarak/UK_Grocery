import { motion } from 'motion/react';
import { useCart } from '../CartContext';
import Layout from '../components/Layout';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart();
  const deliveryFee = 2.50;
  const serviceFee = 0.99;
  const total = totalPrice + deliveryFee + serviceFee;

  return (
    <Layout title="Basket" showBack>
      <div className="max-w-4xl mx-auto bg-surface md:bg-transparent min-h-screen pb-32">
        <div className="md:py-8 flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <section className="flex-1 bg-white md:rounded-lg md:border border-outline-variant/30 overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
              <h2 className="text-xl font-bold text-on-surface">Your Items</h2>
            </div>

            <div className="flex flex-col">
              {cart.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <ShoppingBag size={48} className="mx-auto mb-4 text-outline-variant" />
                  <p className="text-on-surface-variant text-lg font-medium">Your basket is empty</p>
                  <Link to="/browse" className="bg-primary text-white px-6 py-2 rounded-md font-bold mt-6 inline-block hover:bg-primary-container">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 ss-separator flex items-center gap-4 bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm text-on-surface leading-tight pr-2">{item.name}</h3>
                        <span className="font-bold text-sm text-primary">£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-3">{item.unit || 'each'}</p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center bg-primary text-white rounded-full px-2 py-1 gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="active:scale-75 transition-transform"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-sm min-w-[12px] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="active:scale-75 transition-transform"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-on-surface-variant p-1 active:scale-90 transition-transform hover:text-error"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="w-16 h-16 shrink-0 bg-white p-1 border border-outline-variant/20 rounded">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Summary */}
          {cart.length > 0 && (
            <aside className="lg:w-[320px] px-4 md:px-0">
              <div className="ss-card p-5 sticky top-[80px]">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-medium text-on-surface">£{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-on-surface">£{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Service Fee</span>
                    <span className="font-medium text-on-surface">£{serviceFee.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end mb-6">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-primary">£{total.toFixed(2)}</span>
                </div>
                
                <Link 
                  to="/checkout"
                  className="w-full bg-primary text-white py-3 rounded-md font-bold text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-primary-container uppercase tracking-wide"
                >
                  Checkout <ArrowRight size={18} />
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}
