import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Check, Truck, Home, MessageSquare, Edit2, ArrowRight } from 'lucide-react';

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(false); // temp to show something if needed, but let's fetch
    
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
  }, [id]);

  if (loading) {
    return (
      <Layout title="Tracking">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout title="Error" showBack>
        <div className="max-w-screen-xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">{error || 'Order not found'}</h2>
          <Link to="/orders" className="text-primary font-bold">Back to my orders</Link>
        </div>
      </Layout>
    );
  }

  // Status mapping
  const statuses = ['received', 'packed', 'on_delivery', 'delivered'];
  const currentStatusIdx = statuses.indexOf(order.status);
  
  const getStatusText = () => {
    switch(order.status) {
      case 'received': return 'Your order is confirmed and waiting for the kitchen.';
      case 'packed': return 'Our curators are hand-picking your fresh harvest now.';
      case 'on_delivery': return 'Your order is on its way to your conservatory.';
      case 'delivered': return 'Your harvest has arrived! Enjoy your fresh produce.';
      case 'cancelled': return 'This order has been cancelled.';
      default: return 'Processing your request...';
    }
  };

  const statusTitle = {
    received: 'Your order is confirmed.',
    packed: 'Almost ready for dispatch.',
    on_delivery: 'Your harvest is on its way.',
    delivered: 'Welcome home, harvest.',
    cancelled: 'Order Cancelled'
  }[order.status as keyof typeof statusTitle] || 'Tracking your order';
  return (
    <Layout title="Order Tracking" showBack>
      <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-32 space-y-12">
        {/* Hero Order Status Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="text-tertiary font-bold tracking-widest uppercase text-xs">
                {order.status === 'delivered' ? 'Delivered' : 'Arriving Soon'}
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary">{statusTitle}</h2>
              <p className="text-on-surface-variant text-lg max-w-md">{getStatusText()}</p>
            </div>

            {/* Visual Timeline */}
            <div className="relative pt-8 pb-4">
              <div className="absolute top-[52px] left-0 w-full h-[2px] bg-surface-container-high"></div>
              <div 
                className="absolute top-[52px] left-0 h-[2px] bg-primary transition-all duration-1000"
                style={{ width: `${Math.max(0, currentStatusIdx) * 33.33}%` }}
              ></div>
              <div className="relative flex justify-between">
                <TimelineStep label="Placed" active={currentStatusIdx >= 0} completed={currentStatusIdx > 0} current={currentStatusIdx === 0} />
                <TimelineStep label="Packing" active={currentStatusIdx >= 1} completed={currentStatusIdx > 1} current={currentStatusIdx === 1} />
                <TimelineStep label="In Transit" active={currentStatusIdx >= 2} completed={currentStatusIdx > 2} current={currentStatusIdx === 2} icon={<Truck size={16} />} />
                <TimelineStep label="Arrived" active={currentStatusIdx >= 3} completed={currentStatusIdx >= 3} current={currentStatusIdx === 3} icon={<Home size={16} />} />
              </div>
            </div>

            {/* Support Link */}
            <div className="bg-surface-container-low rounded-lg p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Need help with your delivery?</p>
                  <p className="text-sm text-on-surface-variant">Our conservatory specialists are here to help.</p>
                </div>
              </div>
              <ArrowRight className="text-primary group-hover:translate-x-1 transition-transform" size={24} />
            </div>
          </div>

          {/* Contextual Map Section (only show if on delivery or delivered) */}
          <div className="lg:col-span-5 h-[400px] rounded-lg overflow-hidden relative shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200" 
              alt="Map" 
              className="w-full h-full object-cover grayscale-[20%] sepia-[10%] brightness-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            {order.status === 'on_delivery' && (
              <div className="absolute bottom-6 left-6 right-6 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                  <img 
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200" 
                    alt="Courier" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Courier</p>
                  <p className="font-bold text-on-surface">Alex M.</p>
                </div>
                <button className="bg-primary text-on-primary p-2 rounded-full">
                  <MessageSquare size={16} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Order Recap */}
        <section className="space-y-8">
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">Order Recap</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-surface-container-low rounded-lg p-8 space-y-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">Basket Items ({order.items?.length || 0})</p>
                <p className="text-on-surface-variant font-medium">Order #{order.order_number}</p>
              </div>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <RecapItem 
                    key={item.id}
                    name={item.product_name} 
                    desc={`Qty: ${Number(item.quantity)}`} 
                    price={Number(item.total).toFixed(2)} 
                    img="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200" 
                  />
                ))}
              </div>
              <div className="pt-6 border-t border-surface-container-highest flex flex-col gap-2">
                <div className="flex justify-between items-center text-secondary">
                  <span>Subtotal</span>
                  <span>£{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-secondary">
                  <span>Delivery Fee</span>
                  <span>£{Number(order.delivery_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-2xl font-extrabold text-primary">£{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary text-on-primary rounded-lg p-8 space-y-8 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container rounded-full opacity-20"></div>
              <div className="space-y-6 relative">
                <DetailBlock label="Payment Method" value={order.payment_method?.toUpperCase()} />
                <DetailBlock label="Status" value={order.payment_status?.toUpperCase()} />
                {order.notes && <DetailBlock label="Order Notes" value={order.notes} italic />}
              </div>
              <button className="w-full py-4 bg-surface-container-lowest text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-colors">
                <Edit2 size={16} />
                Change Instructions
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}


function TimelineStep({ label, active, completed, current, icon }: { label: string; active?: boolean; completed?: boolean; current?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10 transition-all ${
        completed ? 'bg-primary text-on-primary' : 
        current ? 'bg-primary-container text-on-primary border-4 border-surface ring-4 ring-primary/20' : 
        'bg-surface-container-highest text-on-surface-variant'
      }`}>
        {completed ? <Check size={16} strokeWidth={3} /> : icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
    </div>
  );
}

function RecapItem({ name, desc, price, img }: { name: string; desc: string; price: string; img: string; key?: React.Key }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-md bg-surface-container-high overflow-hidden">
        <img src={img} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-on-surface">{name}</p>
        <p className="text-sm text-on-surface-variant">{desc}</p>
      </div>
      <p className="font-bold">£{price}</p>
    </div>
  );
}

function DetailBlock({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className={`text-lg font-bold ${italic ? 'text-sm leading-relaxed italic opacity-90' : ''}`}>{value}</p>
    </div>
  );
}
