import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { catalogApi, reviewApi, getErrorMessage } from '../services/api';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, Star, ShoppingBag, ArrowLeft, MessageSquare, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, customer } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    Promise.all([
      catalogApi.getProduct(id),
      reviewApi.getStoreReviews(id), // This should ideally be getProductReviews, but our API uses store-level for reviews in phase 4. Adjusted in backend index.
      reviewApi.getStoreSummary(id)
    ]).then(([pRes, rRes, sRes]) => {
      setProduct(pRes.data);
      setReviews(rRes.data || []);
      setSummary(sRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to leave a review');
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.submit({
        product_id: id,
        rating,
        comment
      });
      toast.success('Review submitted for moderation');
      setComment('');
      setSubmitting(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout showBack>
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout showBack>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={product.name} showBack>
      <div className="max-w-6xl mx-auto px-6 py-10 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-square rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/20"
          >
            <img 
              src={product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=2C682E&color=fff&size=600`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                {product.category_name || 'Fresh Produce'}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                <span className="font-bold">{Number(summary?.average_rating || 0).toFixed(1)}</span>
                <span className="text-on-surface-variant text-xs">({summary?.total_reviews || 0} reviews)</span>
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight mb-2">{product.name}</h1>
            <p className="text-on-surface-variant font-medium mb-8">{product.description || 'No description available for this premium item.'}</p>

            <div className="flex items-end gap-2 mb-8">
              <span className="text-4xl font-black text-primary">£{Number(product.price).toFixed(2)}</span>
              <span className="text-on-surface-variant font-bold mb-1">/ {product.unit || 'each'}</span>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                <div className="bg-surface-container-high p-2 rounded-lg"><Truck size={18} /></div>
                Free delivery for Conservatory Members
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                <div className="bg-surface-container-high p-2 rounded-lg"><ShieldCheck size={18} /></div>
                Quality guaranteed or your money back
              </div>
            </div>

            <button 
              onClick={() => {
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image_url,
                  unit: product.unit || 'each',
                  quantity: 1
                });
                toast.success(`${product.name} added to basket`);
              }}
              className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <ShoppingBag size={24} />
              Add to Basket
            </button>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="border-t border-outline-variant/30 pt-16">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-black mb-6">Customer Reviews</h2>
              <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/20 mb-8 text-center">
                <div className="text-6xl font-black text-primary mb-2">
                  {Number(summary?.average_rating || 0).toFixed(1)}
                </div>
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={20} 
                      fill={s <= Math.round(summary?.average_rating || 0) ? 'var(--warning)' : 'transparent'} 
                      color={s <= Math.round(summary?.average_rating || 0) ? 'var(--warning)' : 'var(--outline-variant)'} 
                    />
                  ))}
                </div>
                <p className="text-on-surface-variant font-bold">Based on {summary?.total_reviews || 0} reviews</p>
              </div>

              {/* Add Review Form */}
              <div className="bg-surface-container-highest rounded-3xl p-8 border border-outline-variant/20">
                <h3 className="font-bold mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setRating(s)}
                        className="transition-transform active:scale-75"
                      >
                        <Star 
                          size={24} 
                          fill={s <= rating ? 'var(--warning)' : 'transparent'} 
                          color={s <= rating ? 'var(--warning)' : 'var(--outline-variant)'} 
                        />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell others what you think..."
                    className="w-full bg-surface border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20"
                    rows={4}
                  />
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-on-surface text-surface py-3 rounded-xl font-bold"
                  >
                    {submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>

            <div className="md:flex-1">
              <div className="space-y-8">
                {reviews.length === 0 ? (
                  <div className="py-20 text-center text-on-surface-variant italic">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    No reviews yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review.id} className="pb-8 border-b border-outline-variant/10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {review.customer_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{review.customer_name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                              {new Date(review.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={12} 
                              fill={s <= review.rating ? 'var(--warning)' : 'transparent'} 
                              color={s <= review.rating ? 'var(--warning)' : 'var(--outline-variant)'} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-on-surface font-medium leading-relaxed">{review.comment}</p>
                      {review.store_response && (
                        <div className="mt-4 ml-6 p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
                          <div className="text-xs font-black uppercase tracking-widest text-primary mb-1">Store Response</div>
                          <p className="text-sm italic">{review.store_response}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
