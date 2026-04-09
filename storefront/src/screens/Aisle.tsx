import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CATEGORIES, PRODUCTS } from '../constants';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useCart } from '../CartContext';

export default function Aisle() {
  const { id } = useParams();
  const category = CATEGORIES.find(c => c.id === id);
  const products = PRODUCTS.filter(p => p.category === id);
  const { totalItems, totalPrice } = useCart();

  if (!category) return <div>Category not found</div>;

  return (
    <Layout title={category.name} showBack>
      <div className="max-w-7xl mx-auto px-6 pb-32">
        {/* Filter Chips */}
        <section className="py-6 overflow-x-auto no-scrollbar flex items-center gap-3">
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold transition-all">
            All Produce
          </button>
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-colors">
            Popular
          </button>
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-colors">
            Price: Low to High
          </button>
          <button className="flex-shrink-0 px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-colors">
            Organic Only
          </button>
        </section>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-6 lg:gap-x-10 mt-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Sticky Cart Bar */}
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-[96px] left-0 w-full px-6 z-40 pointer-events-none"
          >
            <Link 
              to="/cart"
              className="max-w-md mx-auto pointer-events-auto bg-primary rounded-full py-4 px-8 flex justify-between items-center shadow-2xl active:scale-[0.98] transition-transform duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-on-primary font-bold">View Cart</span>
                <span className="w-1 h-1 bg-on-primary/40 rounded-full"></span>
                <span className="text-on-primary/90 text-sm">{totalItems} items</span>
              </div>
              <div className="text-on-primary font-headline font-extrabold text-lg">
                £{totalPrice.toFixed(2)}
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
