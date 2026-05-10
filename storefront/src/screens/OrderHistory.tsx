import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { ChevronRight, Package, Clock, CheckCircle2, XCircle, Truck, ShoppingBag, ReceiptText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import React from 'react';

interface OrderData {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items?: Array<{ product_name?: string; quantity: number }>;
}

export default function OrderHistory() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    orderApi.myOrders()
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': 
        return { color: 'text-success bg-success/5', icon: <CheckCircle2 size={14} />, label: 'Delivered' };
      case 'cancelled': 
        return { color: 'text-error bg-error/5', icon: <XCircle size={14} />, label: 'Cancelled' };
      case 'on_delivery': 
        return { color: 'text-primary bg-primary/5', icon: <Truck size={14} />, label: 'Out for Delivery' };
      default: 
        return { color: 'text-on-surface-variant bg-surface-container', icon: <Clock size={14} />, label: status.replace('_', ' ') };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <Layout title="Orders" showBack>
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Orders" showBack>
      <div className="max-w-2xl mx-auto bg-surface-container-lowest min-h-screen pb-32 font-body">
        <div className="px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">My Orders</h2>
            <p className="text-on-surface-variant font-medium text-sm">Review and track your shopping history</p>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-outline-variant/10 shadow-sm">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant/20">
                  <Package size={40} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">No orders found</h3>
                <p className="text-on-surface-variant mb-8">You haven't placed any orders yet.</p>
                <button 
                  onClick={() => navigate('/browse')}
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              orders.map((order, index) => {
                const status = getStatusConfig(order.status);
                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/tracking/${order.id}`)}
                    className="bg-white rounded-2xl border border-outline-variant/10 p-4 shadow-sm cursor-pointer group active:scale-[0.98] transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">Order ID</p>
                          <p className="text-sm font-bold text-on-surface">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest text-[10px] ${status.color}`}>
                        {status.icon}
                        <span>{status.label}</span>
                      </div>
                    </div>

                    <div className="ss-separator pt-4 flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                          <Clock size={14} className="text-primary/40" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                          <ReceiptText size={14} className="text-primary/40" />
                          <span>{order.items?.length || 0} items</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary tracking-tight">£{Number(order.total).toFixed(2)}</p>
                        <div className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">
                          <span>View Details</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
