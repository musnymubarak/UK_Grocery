import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { ProductCard } from '../components/ProductCard';
import { catalogApi } from '../services/api';
import { Search as SearchIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useCart } from '../CartContext';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { selectedStore } = useCart();
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    catalogApi.getProducts({ 
      search: query, 
      store_id: selectedStore?.id,
      limit: 50 
    })
      .then(res => {
        setResults(res.data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, selectedStore?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput });
    }
  };

  return (
    <Layout title={query ? `Search: ${query}` : 'Search'} showBack>
      <div className="max-w-[90rem] mx-auto px-6 pb-40">
        {/* Mobile Search Input */}
        <div className="md:hidden py-4 sticky top-0 z-10 bg-surface/80 backdrop-blur-md">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary/40 group-focus-within:text-primary transition-colors">
              <SearchIcon size={18} strokeWidth={1.5} />
            </div>
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for products..."
              className="w-full bg-white border border-outline-variant/40 rounded-xl py-3.5 pl-11 pr-4 text-on-surface outline-none focus:border-primary/50 placeholder:text-secondary/40 transition-all shadow-sm"
            />
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <InnovativeLoader />
          </div>
        ) : (
          <div className="mt-8">
            {query && (
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-on-surface">
                  {results.length > 0 ? `Results for "${query}"` : `No results found for "${query}"`}
                </h2>
                <p className="text-on-surface-variant font-medium">{results.length} items found</p>
              </div>
            )}

            {!query && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant/20">
                  <SearchIcon size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2">Search for products</h3>
                <p className="text-on-surface-variant">Try searching for "Milk", "Wine", or "Fruits"</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    unit: product.unit || 'each',
                    image: product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E40AF&color=fff&size=400`,
                    description: product.description || '',
                    category: product.category_id || '',
                    stock: product.stock,
                    is_age_restricted: product.is_age_restricted
                  }} 
                />
              ))}
            </div>

            {query && results.length === 0 && !loading && (
              <div className="text-center py-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30">
                <p className="text-on-surface-variant font-medium">We couldn't find any products matching your search.</p>
                <button 
                  onClick={() => setSearchInput('')}
                  className="mt-4 text-primary font-bold"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
