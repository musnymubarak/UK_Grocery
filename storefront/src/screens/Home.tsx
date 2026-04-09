import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogApi.getCategories()
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load categories');
        setLoading(false);
      });
  }, []);

  // Fallback images for categories without images
  const categoryImages: Record<string, string> = {
    'fruits': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800',
    'dairy': 'https://theloopywhisk.com/wp-content/uploads/2018/04/Are-Eggs-Dairy_663px-2.jpg.webp',
    'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=800',
    'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800',
    'beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
    'frozen': 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=800',
    'household': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    // Try to match by name keyword
    const key = Object.keys(categoryImages).find(k => cat.name.toLowerCase().includes(k));
    return key ? categoryImages[key] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-surface-variant">
          <p className="text-lg mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary font-bold">Try again</button>
        </div>
      </Layout>
    );
  }

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
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/aisle/${category.id}`} className="group block">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-low mb-4 relative shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                    <img 
                      src={getCategoryImage(category)} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-20 text-on-surface-variant">
              <p className="text-lg">No categories available yet. Check back soon!</p>
            </div>
          )}
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
