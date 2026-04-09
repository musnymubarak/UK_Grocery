import { motion } from 'motion/react';
import { useCart } from '../CartContext';
import Layout from '../components/Layout';
import { Minus, Plus, Trash2, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart();
  const deliveryFee = 3.99;
  const total = totalPrice + deliveryFee;

  return (
    <Layout title="Your Cart" showBack>
      <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="text-4xl font-extrabold tracking-tight">Your Harvest</h2>
            <span className="text-on-surface-variant font-medium">{cart.length} items selected</span>
          </div>

          <div className="space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-lg">
                <p className="text-secondary text-lg">Your basket is empty</p>
                <Link to="/browse" className="text-primary font-bold mt-4 inline-block hover:underline">
                  Start shopping
                </Link>
              </div>
            ) : (
              cart.map(item => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-surface-container-lowest rounded-lg p-6 flex flex-col md:flex-row gap-6 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.02)]"
                >
                  <div className="w-full md:w-32 h-32 rounded-md overflow-hidden bg-surface-container">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{item.name}</h3>
                        <p className="text-sm text-on-surface-variant">{item.description}</p>
                      </div>
                      <span className="text-lg font-bold text-primary">£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-primary active:scale-90 transition-transform"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-primary active:scale-90 transition-transform"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-error flex items-center gap-1 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28 h-fit">
          <div className="bg-surface-container-low rounded-lg p-8 space-y-6">
            <h3 className="text-2xl font-bold">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-semibold text-on-surface">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Delivery Fee</span>
                <span className="font-semibold text-on-surface">£{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <div className="text-right">
                  <span className="block text-3xl font-extrabold text-primary">£{total.toFixed(2)}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">VAT Included</span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <Link 
                to="/login"
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </Link>
            </div>
            <div className="flex items-center gap-3 p-4 bg-surface-container-high/50 rounded-lg">
              <Truck size={20} className="text-primary" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Order in the next <span className="text-primary font-bold">14 mins</span> for <span className="text-on-surface font-bold">Today Delivery</span>.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
