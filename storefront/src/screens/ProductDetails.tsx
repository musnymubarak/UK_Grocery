import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { catalogApi, reviewApi, getErrorMessage } from '../services/api';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, Star, ShoppingBasket, MessageSquare, ShieldCheck, Truck, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  
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
      reviewApi.getStoreReviews(id),
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
          <button onClick={() => navigate(-1)} className="bg-primary text-white px-6 py-2 rounded-md font-bold hover:bg-primary-container">Go Back</button>
        </div>
      </Layout>
    );
  }

  const cartItem = cart.find(item => item.id === product.id);

  return (
    <Layout title={product.name} showBack>
      <div className="max-w-3xl mx-auto bg-white min-h-screen pb-40">
        {/* Product Image */}
        <div className="w-full aspect-square md:aspect-[16/9] bg-white border-b border-outline-variant/30 flex items-center justify-center p-8">
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E40AF&color=fff&size=600`}
            alt={product.name}
            className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-sm"
          />
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded text-sm shrink-0 ml-4 border border-outline-variant/20">
              <Star size={14} fill="var(--warning)" color="var(--warning)" />
              <span className="font-bold">{Number(summary?.average_rating || 0).toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-on-surface-variant font-medium text-sm mb-6">
            {product.unit || 'each'}
          </p>
          
          <div className="flex items-center justify-between mb-8">
            <span className="text-3xl font-extrabold text-primary">£{Number(product.price).toFixed(2)}</span>
            
            {/* Add to Cart Actions */}
            {cartItem ? (
              <div className="flex items-center bg-primary text-white rounded-md px-3 py-2 gap-4">
                <button 
                  onClick={() => updateQuantity(product.id, -1)}
                  className="active:scale-75 transition-transform"
                >
                  <Minus size={20} />
                </button>
                <span className="font-bold text-lg min-w-[20px] text-center">{cartItem.quantity}</span>
                <button 
                  onClick={() => updateQuantity(product.id, 1)}
                  className="active:scale-75 transition-transform"
                >
                  <Plus size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image_url,
                    unit: product.unit || 'each',
                    quantity: 1,
                    description: product.description || ''
                  });
                  toast.success('Added to basket');
                }}
                className="bg-primary text-white px-8 py-3 rounded-md font-bold text-lg flex items-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all shadow-md"
              >
                <Plus size={20} /> Add to Basket
              </button>
            )}
          </div>

          <div className="ss-separator mb-6"></div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-2">Product Description</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
              {product.description || 'No detailed description available for this product.'}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-col gap-3 mb-10 bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
            <div className="flex items-center gap-3 text-sm font-medium text-on-surface">
              <Truck className="text-primary" size={20} />
              Delivery available from local store
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-on-surface">
              <ShieldCheck className="text-primary" size={20} />
              Quality guaranteed
            </div>
          </div>

          <div className="ss-separator mb-8"></div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>
            
            {/* Add Review Form */}
            <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant/30 mb-8">
              <h3 className="font-bold mb-3 text-sm">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-3">
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
                  placeholder="Share your thoughts..."
                  className="w-full bg-white border border-outline-variant/50 rounded-md p-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={3}
                />
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm hover:bg-primary-container disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Submit Review'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant italic border border-dashed border-outline-variant/50 rounded-lg">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                  No reviews yet.
                </div>
              ) : (
                reviews.map((review: any) => (
                  <div key={review.id} className="pb-6 ss-separator">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary text-xs border border-outline-variant/30">
                          {review.customer_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{review.customer_name || 'Anonymous User'}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={12} 
                              fill={s <= review.rating ? 'var(--warning)' : 'transparent'} 
                              color={s <= review.rating ? 'var(--warning)' : 'var(--outline-variant)'} 
                            />
                          ))}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-medium">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-on-surface text-sm mt-2">{review.comment}</p>
                    {review.store_response && (
                      <div className="mt-3 p-3 bg-surface-container-low rounded-md border-l-2 border-primary">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Store Response</div>
                        <p className="text-xs text-on-surface-variant">{review.store_response}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
