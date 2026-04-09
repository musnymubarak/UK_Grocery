import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Search, Filter, ChevronRight, MessageSquare } from 'lucide-react';
import { ORDERS } from '../constants';

export default function OrderHistory() {
  return (
    <Layout title="The Conservatory" showBack>
      <div className="max-w-4xl mx-auto px-6 py-10 pb-32">
        {/* Header Section */}
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-on-surface">Order History</h2>
          <p className="text-on-surface-variant">Review and track your botanical bounties.</p>
        </div>

        {/* Search & Filter Area */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search orders..."
              className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-low rounded-lg text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors">
            <Filter size={20} />
            <span>Filter</span>
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {ORDERS.map((order, index) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-container-lowest rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                <div className="flex-shrink-0 relative h-24 w-24 rounded-md overflow-hidden bg-surface-container">
                  <img 
                    src={order.image} 
                    alt={order.id} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-primary/5"></div>
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold tracking-widest text-outline uppercase">Order #{order.id}</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                      order.status === 'In Progress' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary/10 text-primary'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{order.id === 'TC-88219' ? 'Organic Seasonal Harvest' : order.id === 'TC-87902' ? 'Artisan Bakery & Dairy' : 'Pantry Essentials Bundle'}</h3>
                  <p className="text-on-surface-variant text-sm">Placed on {order.date}</p>
                </div>
                <div className="md:text-right flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 md:pl-8 md:border-l md:border-surface-container">
                  <p className="text-2xl font-bold text-primary">£{order.total.toFixed(2)}</p>
                  <button className="flex items-center gap-1 text-sm font-bold text-primary hover:opacity-70 transition-opacity">
                    View Details
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Help/Support Section */}
        <div className="mt-16 bg-primary rounded-lg p-8 md:p-12 text-on-primary flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container opacity-20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-extrabold mb-4">Something missing from your conservatory?</h3>
            <p className="text-primary-container/80">If there's an issue with your delivery or order history, our curators are here to assist you 24/7.</p>
          </div>
          <button className="relative z-10 px-8 py-4 bg-surface-container-lowest text-primary font-bold rounded-xl active:scale-95 transition-transform">
            Contact Concierge
          </button>
        </div>
      </div>
    </Layout>
  );
}
