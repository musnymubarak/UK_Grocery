import { motion } from 'motion/react';
import { CATEGORIES } from '../constants';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search } from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-32">
        {/* Search Section */}
        <section className="mb-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-primary">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search for fresh organic produce..."
              className="w-full bg-surface-container-high border-none rounded-xl py-5 pl-14 pr-6 text-on-surface focus:ring-2 focus:ring-primary/20 placeholder-secondary transition-all"
            />
          </div>
        </section>

        {/* Category Grid */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">Aisles & Collections</h2>
              <p className="text-secondary font-medium">Curated selections from the conservatory</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/aisle/${category.id}`} className="group block">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-low mb-4 relative shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    {category.badge && (
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          category.badge === 'New Season' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary text-on-primary'
                        }`}>
                          {category.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Editorial Block */}
        <section className="my-20">
          <div className="bg-primary rounded-lg overflow-hidden flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-10 md:p-16 text-on-primary">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">Seasonal Guide</span>
              <h2 className="text-4xl font-extrabold tracking-tighter mb-6 leading-tight">The Winter Harvest Kitchen</h2>
              <p className="text-on-primary/80 mb-8 leading-relaxed max-w-md text-lg">
                Discover the best seasonal ingredients arriving at the Central store this week. Fresh from local British farms.
              </p>
              <button className="bg-surface text-primary px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95">
                Read the Journal
              </button>
            </div>
            <div className="w-full md:w-1/2 h-[300px] md:h-full min-h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
                alt="Winter Harvest"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
