import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderApi, orderActionsApi, refundApi, getErrorMessage } from '../services/api';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import Modal from '../components/Modal';
import { Check, Truck, Home, MessageSquare, Edit2, ArrowRight, XCircle, Undo2, Loader2, AlertCircle, ShoppingBag, ReceiptText, Clock, MapPin, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; reason: string; notes?: string }>>({});

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = () => {
    if (!id) return;
    orderApi.getMyOrder(id)
      .then(res => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not find this order. It may have been archived or belongs to another account.');
        setLoading(false);
      });
  };

  const confirmOrderCancellation = async () => {
    setIsCancelling(true);
    try {
      await orderActionsApi.cancel(id!);
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      fetchOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleToggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = { quantity: maxQty, reason: 'damaged_item' };
      }
      return next;
    });
  };

  const handleUpdateItem = (itemId: string, field: 'quantity' | 'reason' | 'notes', value: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToRefund = Object.entries(selectedItems).map(([id, data]: [string, any]) => ({
      order_item_id: id,
      quantity: Number(data.quantity),
      reason: data.reason,
      notes: data.notes || undefined
    }));

    if (itemsToRefund.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    setIsRefunding(true);
    try {
      await refundApi.request({
        order_id: id,
        items: itemsToRefund,
        destination: 'wallet'
      });
      toast.success('Refund request submitted successfully');
      setShowRefundModal(false);
      setSelectedItems({});
      navigate('/refunds');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsRefunding(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Tracking">
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout title="Error" showBack>
        <div className="max-w-screen-xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">{error || 'Order not found'}</h2>
          <Link to="/history" className="text-primary font-bold">Back to my orders</Link>
        </div>
      </Layout>
    );
  }

  const getTrackingIndex = (status: string) => {
    switch (status) {
      case 'placed': case 'confirmed': return 0;
      case 'picking': case 'substitution_pending': case 'ready_for_collection': case 'packed': return 1;
      case 'assigned_to_driver': case 'out_for_delivery': case 'on_delivery': return 2;
      case 'delivered': return 3;
      default: return -1;
    }
  };

  const currentStatusIdx = getTrackingIndex(order.status);
  
  const getStatusText = () => {
    switch(order.status) {
      case 'placed': return 'Your order has been placed and is awaiting confirmation.';
      case 'confirmed': return 'Your order is confirmed and waiting for the curating team.';
      case 'picking': case 'packed': return 'Our team is carefully packing your order now.';
      case 'ready_for_collection': return 'Your order is packed and waiting for the courier.';
      case 'assigned_to_driver': return 'A courier has been assigned to your order.';
      case 'out_for_delivery': case 'on_delivery': return 'Your order is out for delivery.';
      case 'delivered': return 'Your order has arrived! Enjoy your groceries.';
      case 'cancelled': return 'This order has been cancelled.';
      case 'rejected': return 'This order was rejected. Please contact support.';
      case 'delivery_failed': return 'Delivery failed. Our team will contact you.';
      default: return 'Processing your request...';
    }
  };

  const statusTitleMap: Record<string, string> = {
    placed: 'Order Placed.', confirmed: 'Your order is confirmed.', picking: 'Preparing your order.',
    packed: 'Order packed.', substitution_pending: 'Reviewing items.', ready_for_collection: 'Awaiting courier.',
    assigned_to_driver: 'Courier assigned.', out_for_delivery: 'Your order is on its way.',
    on_delivery: 'Your order is on its way.', delivered: 'Order delivered.', cancelled: 'Order Cancelled',
    rejected: 'Order Rejected', delivery_failed: 'Delivery Failed'
  };
  const currentTitle = statusTitleMap[order.status] || 'Tracking your order';

  return (
    <Layout title="Tracking" showBack>
      <div className="max-w-2xl mx-auto bg-surface-container-lowest min-h-screen pb-32 font-body">
        
        {/* Status Header */}
        <div className="px-4 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-3">
             <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
               Order #{order.id.slice(0, 8).toUpperCase()}
             </span>
             {order.status === 'delivered' && (
                <span className="bg-success/10 text-success text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} /> Delivered
                </span>
             )}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-on-surface tracking-tighter mb-2 leading-tight">{currentTitle}</h2>
          <p className="text-on-surface-variant font-medium text-sm leading-relaxed">{getStatusText()}</p>
        </div>

        {/* Premium Visual Timeline */}
        <div className="px-4 mb-8">
          <div className="bg-white rounded-3xl border border-outline-variant/10 p-6 shadow-sm">
            <div className="relative flex justify-between">
              <div className="absolute top-5 left-8 right-8 h-1 bg-surface-container-high -z-0">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${Math.max(0, currentStatusIdx) * 33.33}%` }}
                ></div>
              </div>
              <TimelineStep label="Placed" active={currentStatusIdx >= 0} completed={currentStatusIdx > 0} current={currentStatusIdx === 0} />
              <TimelineStep label="Packing" active={currentStatusIdx >= 1} completed={currentStatusIdx > 1} current={currentStatusIdx === 1} />
              <TimelineStep label="In Transit" active={currentStatusIdx >= 2} completed={currentStatusIdx > 2} current={currentStatusIdx === 2} icon={<Truck size={16} />} />
              <TimelineStep label="Arrived" active={currentStatusIdx >= 3} completed={currentStatusIdx >= 3} current={currentStatusIdx === 3} icon={<Home size={16} />} />
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Support Banner */}
          <div className="bg-primary text-white rounded-2xl p-5 flex items-center justify-between group cursor-pointer shadow-lg shadow-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Need help?</p>
                <p className="text-white/80 text-xs font-bold">Our support team is here to help.</p>
              </div>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Refund Status Alert */}
          {order.refund_status && (
            <div className={`p-4 rounded-2xl flex gap-3 ${
              order.refund_status === 'pending' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
              order.refund_status === 'approved' ? 'bg-success/10 text-success border border-success/20' :
              'bg-error/10 text-error border border-error/20'
            }`}>
              <Undo2 size={20} className="shrink-0" />
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest mb-1">Refund {order.refund_status}</p>
                <p className="text-xs font-bold leading-relaxed opacity-90">
                  {order.refund_status === 'pending' ? "We're reviewing your request. This usually takes 3-5 days." :
                   order.refund_status === 'approved' ? "Great news! Your refund has been approved and credited to your wallet." :
                   "Your refund request was not approved. Please contact support for details."}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {['placed', 'confirmed'].includes(order.status) && (
              <button 
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="col-span-2 bg-error/5 text-error border border-error/20 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <XCircle size={18} /> Cancel Order
              </button>
            )}
            {order.status === 'delivered' && !['pending', 'approved'].includes(order.refund_status) && (
              <button 
                onClick={() => setShowRefundModal(true)}
                className="col-span-2 bg-primary/5 text-primary border border-primary/20 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Undo2 size={18} /> Request Refund
              </button>
            )}
          </div>

          {/* Order Recap Card */}
          <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-on-surface">Order Recap</h3>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">#{order.order_number}</p>
              </div>
              <div className="p-2 bg-surface-container rounded-lg text-primary">
                <ReceiptText size={20} />
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              {order.items?.map((item: any) => (
                <RecapItem 
                  key={item.id}
                  name={item.product_name} 
                  desc={`Qty: ${Number(item.quantity)}`} 
                  refundedQty={Number(item.refunded_quantity || 0)}
                  price={Number(item.total).toFixed(2)} 
                  img={item.product_image_url || `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200`}
                />
              ))}
            </div>

            <div className="bg-surface-container/30 p-5 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-on-surface-variant">
                <span>Subtotal</span>
                <span className="text-on-surface font-black">£{(order.items?.reduce((acc: number, item: any) => acc + Number(item.total), 0) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                   <MapPin size={14} className="text-primary/40" />
                   <span>Delivery Fee</span>
                </div>
                <span className="text-on-surface font-black">£{Number(order.delivery_fee || 0).toFixed(2)}</span>
              </div>
              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-between items-center text-sm font-bold text-success">
                  <span>Discount Applied</span>
                  <span className="font-black">-£{Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-end">
                <span className="text-xl font-black text-on-surface tracking-tight">Total Paid</span>
                <span className="text-2xl font-black text-primary tracking-tight">£{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Logistics & Payment Card */}
          <div className="bg-primary text-white rounded-3xl p-6 shadow-lg shadow-primary/10 space-y-8 relative overflow-hidden">
             <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
             <div className="space-y-6 relative z-10">
                <DetailBlock label="Payment Method" value={order.payment_method?.toUpperCase() || 'CARD'} />
                <DetailBlock label="Delivery Status" value={order.status.replace('_', ' ').toUpperCase()} />
                {order.notes && <DetailBlock label="Delivery Instructions" value={order.notes} italic />}
             </div>
             {['placed', 'confirmed', 'picking'].includes(order.status) && (
                <button className="w-full py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all">
                  <Edit2 size={16} /> Update Instructions
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Modals Styled to match */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="Request a Refund"
        maxWidth="500px"
        footer={
          <button 
            form="refund-form" 
            type="submit" 
            disabled={isRefunding || Object.keys(selectedItems).length === 0}
            className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-50 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {isRefunding ? <Loader2 className="animate-spin" size={20} /> : <Undo2 size={20} className="mr-2 inline" />}
            Confirm Refund Request
          </button>
        }
      >
        <form id="refund-form" onSubmit={handleRequestRefund} className="space-y-6">
          <div className="text-center px-4">
             <p className="text-on-surface-variant text-sm font-medium mb-6">Select the items you're experiencing issues with. We'll credit your wallet ASAP.</p>
          </div>
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
            {order.items?.map((item: any) => {
              const availableQty = Number(item.quantity) - Number(item.refunded_quantity || 0);
              if (availableQty <= 0) return null;
              const isSelected = !!selectedItems[item.id];
              return (
                <div key={item.id} className={`p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/10'}`}>
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => handleToggleItem(item.id, availableQty)} className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant/30 text-transparent'}`}>
                      <Check size={12} strokeWidth={4} />
                    </button>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface text-sm leading-tight mb-1">{item.product_name}</p>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-primary/10 space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Qty</span>
                             <div className="flex items-center gap-4 bg-white border border-outline-variant/10 px-2 py-1 rounded-lg">
                               <button type="button" onClick={() => handleUpdateItem(item.id, 'quantity', Math.max(1, selectedItems[item.id].quantity - 1))} className="text-primary font-black">-</button>
                               <span className="font-bold text-sm">{selectedItems[item.id].quantity}</span>
                               <button type="button" onClick={() => handleUpdateItem(item.id, 'quantity', Math.min(availableQty, selectedItems[item.id].quantity + 1))} className="text-primary font-black">+</button>
                             </div>
                          </div>
                          <select value={selectedItems[item.id].reason} onChange={e => handleUpdateItem(item.id, 'reason', e.target.value)} className="w-full bg-white border border-outline-variant/10 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary/50">
                            <option value="damaged_item">Damaged Item</option>
                            <option value="missing_item">Missing Item</option>
                            <option value="quality_issue">Poor Quality</option>
                            <option value="wrong_item">Wrong Item</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
            <XCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Are you sure?</h3>
          <p className="text-on-surface-variant text-sm font-medium mb-8">This action cannot be undone. Order #{order.order_number} will be cancelled immediately.</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3.5 bg-surface-container-high text-on-surface font-black rounded-xl uppercase tracking-widest text-xs">No, Keep it</button>
            <button onClick={confirmOrderCancellation} disabled={isCancelling} className="flex-1 py-3.5 bg-error text-white font-black rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {isCancelling ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />} Yes, Cancel
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function TimelineStep({ label, active, completed, current, icon }: { label: string; active?: boolean; completed?: boolean; current?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 relative z-10">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        completed ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
        current ? 'bg-white border-4 border-primary text-primary scale-110' : 
        'bg-surface-container-high text-on-surface-variant/40 border-2 border-surface-container-highest'
      }`}>
        {completed ? <Check size={18} strokeWidth={4} /> : (icon || <div className="w-2 h-2 rounded-full bg-current" />)}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-primary' : 'text-on-surface-variant/40'}`}>{label}</span>
    </div>
  );
}

function RecapItem({ name, desc, price, img, refundedQty }: { name: string; desc: string; price: string; img: string; refundedQty?: number; key?: React.Key }) {
  const hasRefund = (refundedQty || 0) > 0;
  return (
    <div className="flex items-center gap-4 group">
      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-surface-container overflow-hidden group-hover:scale-105 transition-transform">
          <img src={img} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        {hasRefund && (
          <div className="absolute -top-1.5 -right-1.5 bg-error text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
            -{refundedQty}
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm text-on-surface leading-tight">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-on-surface-variant font-medium">{desc}</p>
          {hasRefund && (
            <span className="text-[8px] font-black text-error uppercase tracking-widest bg-error/5 px-1.5 py-0.5 rounded">Refunded</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-on-surface">£{price}</p>
        {hasRefund && <p className="text-[9px] text-error font-black uppercase tracking-widest">Adjusted</p>}
      </div>
    </div>
  );
}

function DetailBlock({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className={`text-base font-black ${italic ? 'text-xs leading-relaxed italic opacity-80 font-medium' : ''}`}>{value}</p>
    </div>
  );
}
