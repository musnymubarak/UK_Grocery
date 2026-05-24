import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { catalogApi, reviewApi, getErrorMessage } from '../services/api';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, Star, ShoppingBasket, MessageSquare, ShieldCheck, Truck, Plus, Minus, AlertCircle, Leaf, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
      <div className="max-w-6xl mx-auto pb-40 pt-4 md:pt-8 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left Column: Image (5 cols on md, sticky) */}
          <div className="md:col-span-5 md:sticky md:top-24 h-fit">
            <div className="w-full aspect-[4/3] md:aspect-square bg-white border border-outline-variant/30 rounded-2xl flex items-center justify-center p-0 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <motion.img 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E40AF&color=fff&size=600`}
                alt={product.name}
                className="w-full h-full object-cover mix-blend-normal drop-shadow-sm"
              />
            </div>
          </div>

          {/* Right Column: Content (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col">
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
            
            <div className="flex items-center justify-between mb-8 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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
                      description: product.description || '',
                      is_age_restricted: product.is_age_restricted
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

            {/* Accordion Sections (Snappy Shopper Style) */}
            <div className="divide-y divide-outline-variant/30 border-y border-outline-variant/30 mb-10">
              <AccordionSection 
                title="Safety Statements" 
                content={product.safety_statements} 
                icon={<ShieldCheck size={18} className="text-primary" />}
              />
              <AccordionSection 
                title="Allergy Advice" 
                content={product.allergy_advice} 
                icon={<AlertCircle size={18} className="text-error" />}
              />
              <AccordionSection 
                title="Product Marketing" 
                content={product.product_marketing} 
              />
              <AccordionSection 
                title="Description" 
                content={product.description} 
                defaultOpen
              />
              <AccordionSection 
                title="Features" 
                content={product.features ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                ) : null} 
              />
              <AccordionSection 
                title="Storage Type" 
                content={product.storage_type} 
              />
              <AccordionSection 
                title="Country of Origin" 
                content={product.country_of_origin} 
              />
              
              {product.alcohol_data && (
                <AccordionSection 
                  title="General Alcohol Data" 
                  content={
                    <div className="space-y-2">
                      {Object.entries(product.alcohol_data).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-outline-variant/10 pb-1">
                          <span className="capitalize text-on-surface-variant">{k.replace(/_/g, ' ')}</span>
                          <span className="font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  } 
                />
              )}

              <AccordionSection 
                title="Company Name" 
                content={product.company_name} 
              />
              <AccordionSection 
                title="Company Address" 
                content={product.company_address} 
              />
              <AccordionSection 
                title="Manufacturer" 
                content={product.manufacturer_name} 
              />
              <AccordionSection 
                title="Daily Grocer Disclaimer" 
                content={product.disclaimer || "While we aim to provide accurate product information, it is provided by manufacturers and not verified by us. Always check the physical product label before consumption."} 
              />
            </div>

            {/* Nutritional Info Table (Still useful to keep) */}
            {product.nutritional_info && (
              <div className="mb-10">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Leaf className="text-primary" size={20} />
                  Nutritional Facts
                </h3>
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container-high border-b border-outline-variant/30 text-on-surface-variant">
                        <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-[10px]">Component</th>
                        <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-[10px]">Per 100g/ml</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {Object.entries(product.nutritional_info).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-4 py-2 text-on-surface-variant font-medium capitalize">{key.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-2 text-right font-bold text-on-surface">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
      </div>
    </Layout>
  );
}

// Sub-component for Accordion Sections
function AccordionSection({ title, content, icon, defaultOpen = false }: { title: string, content: any, icon?: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!content) return null;

  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={`font-bold transition-colors ${isOpen ? 'text-primary' : 'text-[#004a8e] group-hover:text-primary'}`}>
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-outline-variant group-hover:text-primary"
        >
          <Plus size={20} className={isOpen ? 'hidden' : 'block'} />
          <Minus size={20} className={isOpen ? 'block' : 'hidden'} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm text-on-surface-variant leading-relaxed font-medium">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
