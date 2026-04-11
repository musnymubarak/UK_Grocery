import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Search, Filter, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { orderApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-primary/10 text-primary';
      case 'received': case 'packed': case 'on_delivery': return 'bg-tertiary-container text-on-tertiary-container';
      case 'cancelled': return 'bg-error/10 text-error';
      default: return 'bg-secondary-container text-on-secondary-container';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <Layout title="The Conservatory" showBack>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="The Conservatory" showBack>
      <div className="max-w-4xl mx-auto px-6 py-10 pb-32">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-on-surface">Order History</h2>
          <p className="text-on-surface-variant">Review and track your orders.</p>
        </div>

        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-low rounded-lg">
              <p className="text-secondary text-lg mb-4">No orders yet</p>
              <button onClick={() => navigate('/browse')} className="text-primary font-bold hover:underline">
                Start shopping
              </button>
            </div>
          ) : (
            orders.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-container-lowest rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {order.items?.length || '?'}
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold tracking-widest text-outline uppercase">Order #{order.id.slice(0, 8)}</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-sm">Placed on {formatDate(order.created_at)}</p>
                  </div>
                  <div className="md:text-right flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 md:pl-8 md:border-l md:border-surface-container">
                    {order.total && (
                      <p className="text-2xl font-bold text-primary">£{Number(order.total).toFixed(2)}</p>
                    )}
                    <button 
                      onClick={() => navigate(`/tracking/${order.id}`)}
                      className="flex items-center gap-1 text-sm font-bold text-primary hover:opacity-70 transition-opacity"
                    >
                      View Details
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
