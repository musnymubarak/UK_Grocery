import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Check, Truck, Home, MessageSquare, Edit2, ArrowRight } from 'lucide-react';

export default function OrderTracking() {
  return (
    <Layout title="Order Tracking" showBack>
      <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-32 space-y-12">
        {/* Hero Order Status Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="text-tertiary font-bold tracking-widest uppercase text-xs">Arriving in 24 mins</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary">Your harvest is on its way.</h2>
              <p className="text-on-surface-variant text-lg max-w-md">Our courier, Thomas, is cycling through South Kensington with your organic selections.</p>
            </div>

            {/* Visual Timeline */}
            <div className="relative pt-8 pb-4">
              <div className="absolute top-[52px] left-0 w-full h-[2px] bg-surface-container-high"></div>
              <div className="absolute top-[52px] left-0 w-[75%] h-[2px] bg-primary transition-all duration-1000"></div>
              <div className="relative flex justify-between">
                <TimelineStep label="Placed" active completed />
                <TimelineStep label="Packing" active completed />
                <TimelineStep label="In Transit" active current icon={<Truck size={16} />} />
                <TimelineStep label="Arrived" icon={<Home size={16} />} />
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

          {/* Contextual Map Section */}
          <div className="lg:col-span-5 h-[400px] rounded-lg overflow-hidden relative shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200" 
              alt="Map" 
              className="w-full h-full object-cover grayscale-[20%] sepia-[10%] brightness-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                <img 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200" 
                  alt="Thomas P." 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Courier</p>
                <p className="font-bold text-on-surface">Thomas P.</p>
              </div>
              <button className="bg-primary text-on-primary p-2 rounded-full">
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Order Recap */}
        <section className="space-y-8">
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">Order Recap</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-surface-container-low rounded-lg p-8 space-y-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">Basket Items (3)</p>
                <p className="text-on-surface-variant font-medium">Order #TC-99201</p>
              </div>
              <div className="space-y-4">
                <RecapItem name="Curly Kale Bunch" desc="250g • Local Farm" price="2.45" img="https://images.unsplash.com/photo-1524179524541-1aa1ece2bb91?auto=format&fit=crop&q=80&w=200" />
                <RecapItem name="Heritage Carrots" desc="500g • Soil Assoc." price="3.20" img="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=200" />
                <RecapItem name="Country Sourdough" desc="800g • Artisanal" price="4.50" img="https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80&w=200" />
              </div>
              <div className="pt-6 border-t border-surface-container-highest flex justify-between items-center">
                <span className="font-bold text-on-surface-variant">Total Value</span>
                <span className="text-2xl font-extrabold text-primary">£10.15</span>
              </div>
            </div>

            <div className="bg-primary text-on-primary rounded-lg p-8 space-y-8 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container rounded-full opacity-20"></div>
              <div className="space-y-6 relative">
                <DetailBlock label="Delivery Address" value="24 Eldon Road, Kensington, London, W8 5PT" />
                <DetailBlock label="Estimated Drop-off" value="Today, 11:45 AM - 12:15 PM" />
                <DetailBlock label="Drop-off Notes" value='"Please leave by the blue gate if no answer. Thank you!"' italic />
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

import React from 'react';

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

function RecapItem({ name, desc, price, img }: { name: string; desc: string; price: string; img: string }) {
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
