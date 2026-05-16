import { motion } from 'motion/react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import { ChevronRight, Package, Clock, CheckCircle2, XCircle, Truck, ShoppingBag } from 'lucide-react';
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
  store_name?: string;
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
    orderApi
      .myOrders()
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const isActiveStatus = (s: string) => ['placed', 'preparing', 'on_delivery', 'pending', 'confirmed'].includes(s.toLowerCase());

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { color: 'text-on-surface bg-surface-container-high border-outline-variant', icon: <CheckCircle2 size={14} />, label: 'Delivered' };
      case 'cancelled':
        return { color: 'text-error bg-error-container border-error/20', icon: <XCircle size={14} />, label: 'Cancelled' };
      case 'on_delivery':
        return { color: 'text-action-blue bg-action-blue/10 border-action-blue/20', icon: <Truck size={14} />, label: 'Out for Delivery' };
      default:
        return { color: 'text-on-surface-variant bg-surface-container border-outline-variant', icon: <Clock size={14} />, label: status.replace('_', ' ') };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Layout title="My Orders" showBack dark>
        <div className="flex items-center justify-center min-h-[60vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  const activeOrders = orders.filter((o) => isActiveStatus(o.status));
  const pastOrders = orders.filter((o) => !isActiveStatus(o.status));

  return (
    <Layout title="My Orders" showBack dark>
      <div className="px-4 py-6 pb-32 flex flex-col gap-6">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface mb-1">My Orders</h1>
          <p className="text-on-surface-variant text-sm">Review and track your shopping history.</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 ref-card-xl">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <Package size={32} />
            </div>
            <h3 className="text-headline-lg-mobile text-text-main mb-2">No orders found</h3>
            <p className="text-on-surface-variant text-sm mb-6">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-action-red text-on-primary px-6 py-3 rounded-md text-label-bold font-semibold hover:bg-secondary transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-headline-lg-mobile text-on-surface">Active Orders</h2>
                {activeOrders.map((order, index) => {
                  const status = getStatusConfig(order.status);
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/tracking/${order.id}`)}
                      className="ref-card-xl p-4 flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:bg-surface-container-low transition-colors"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-action-blue" />

                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-md bg-surface-container flex items-center justify-center text-action-blue shrink-0">
                          <ShoppingBag size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-label-bold text-on-surface block truncate">
                            {order.store_name || 'Daily Grocer'}
                          </span>
                          <span className="text-xs text-on-surface-variant block">
                            Order #{order.id.slice(0, 8).toUpperCase()} • {order.items?.length || 0} Items
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-action-blue">
                              <Truck size={14} />
                            </span>
                            <span className="text-label-bold text-action-blue">{status.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-outline-variant pt-3">
                        <span className="text-price-display text-on-surface">£{Number(order.total).toFixed(2)}</span>
                        <button className="bg-action-blue text-on-primary text-label-bold font-semibold px-5 py-2 rounded-md hover:bg-action-blue/90 transition-colors flex items-center gap-1">
                          Track
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </section>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section className="flex flex-col gap-3 mt-2">
                <h2 className="text-headline-lg-mobile text-on-surface">Past Orders</h2>
                {pastOrders.map((order, index) => {
                  const status = getStatusConfig(order.status);
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/tracking/${order.id}`)}
                      className="ref-card-xl p-4 flex flex-col gap-3 cursor-pointer hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-md bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                            <ShoppingBag size={20} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-label-bold text-on-surface block truncate">
                              {order.store_name || 'Daily Grocer'}
                            </span>
                            <span className="text-xs text-on-surface-variant block">
                              {formatDate(order.created_at)} • {order.items?.length || 0} Items
                            </span>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      <div className="flex justify-between items-end border-t border-outline-variant pt-3">
                        <span className="text-price-display text-on-surface">£{Number(order.total).toFixed(2)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/browse');
                          }}
                          className="bg-surface-container-lowest text-action-red text-label-bold font-semibold px-4 py-1.5 rounded-md border border-action-red hover:bg-action-red hover:text-on-primary transition-colors"
                        >
                          Re-order
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
