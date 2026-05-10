import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, LayoutGrid, MapPin, Tag, CircleUser, Search, Leaf, ShoppingBasket, User, Bell, Check, Info } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import Modal from './Modal';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function Layout({ children, title = 'Daily Grocer', subtitle, showBack = false }: LayoutProps) {
  const { totalItems, selectedStore } = useCart();
  const { isAuthenticated, customer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getCount()
        .then(res => setNotificationCount(res.data.count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    try {
      const res = await notificationApi.list();
      setNotifications(res.data);
      // Optimistically clear count
      setNotificationCount(0);
    } catch (err) {}
  };

  const isAuthPage = location.pathname === '/login';
  const hideBottomNav = isAuthPage;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/5 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 text-primary hover:bg-primary/5 rounded-full transition-colors active:scale-95 shrink-0"
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <Link to="/browse" className="flex items-center h-8 shrink-0">
              <img 
                src="/daily_grocer_logo_1778351976804.png" 
                alt="Daily Grocer" 
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-primary font-bold text-lg tracking-tight">DAILY GROCER</span>';
                }}
              />
            </Link>
          )}

          {/* Global Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl ml-8">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary/40 group-focus-within:text-primary transition-colors">
                <Search size={18} strokeWidth={1.5} />
              </div>
              <input 
                type="text" 
                placeholder="Search for products..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`);
                  }
                }}
                className="w-full bg-white border border-outline-variant/40 rounded-xl py-2.5 pl-11 pr-4 text-sm text-on-surface outline-none focus:border-primary/50 placeholder:text-secondary/40 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Trigger */}
          <button 
            onClick={() => navigate('/search')}
            className="md:hidden p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Search size={22} />
          </button>
          
          {isAuthenticated ? (
            <Link to="/profile" className="hidden sm:flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-full transition-colors">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] border border-primary/20">
                {customer?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span>Profile</span>
            </Link>
          ) : (
            <Link to="/login" className="hidden sm:block text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/20">
              Sign In
            </Link>
          )}
          
          <Link to="/cart" className="relative p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors active:scale-95">
            <ShoppingBag size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content - pb-32 ensures content clears the fixed bottom nav on mobile */}
      <main className="flex-grow pb-24 md:pb-0">
        {children}

        {/* UK Compliance Footer */}
        <footer className="mt-20 border-t border-outline-variant/10 px-6 py-10 bg-white text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-bold tracking-tight opacity-30">
              <Leaf size={16} />
              <span className="text-sm">DAILY GROCER</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-primary transition-colors">Cookies Policy</Link>
            </div>
            <p className="text-[9px] font-medium text-on-surface-variant/30 max-w-xs leading-relaxed">
              © 2026 Daily Grocer Ltd. Registered in England & Wales. Delivery partners operating Challenge 25 policy.
            </p>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-outline-variant/5 px-2 pb-6 pt-2 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] md:hidden">
          <NavLink to="/stores" icon={<MapPin size={22} />} label="Stores" active={location.pathname === '/stores'} />
          <NavLink to="/browse" icon={<LayoutGrid size={22} />} label="Menu" active={location.pathname === '/browse' || location.pathname.startsWith('/aisle')} />
          <NavLink to={isAuthenticated ? "/profile" : "/login"} icon={<CircleUser size={22} />} label="Account" active={location.pathname === '/profile' || location.pathname === '/login'} />
          
          <Link to="/cart" className="flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-95">
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${totalItems > 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-high text-secondary'}`}>
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-success text-white text-[8px] font-black px-1 py-0.5 rounded-full border border-white">
                  £{(totalItems * 2.5).toFixed(2)}
                </div>
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${totalItems > 0 ? 'text-primary' : 'text-secondary/60'}`}>Cart</span>
          </Link>
        </nav>
      )}


      {/* Notification Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Your Notifications"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-medium">
              You're all caught up!
            </div>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                   {n.type === 'order' ? <ShoppingBasket size={20} /> : <Info size={20} />}
                </div>
                <div>
                  <div className="font-bold text-sm">{n.title}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{n.message}</div>
                  <div className="text-[10px] text-on-surface-variant/60 mt-2 font-bold uppercase tracking-widest">
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

function DesktopNavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link 
      to={to} 
      className={`relative py-2 text-sm font-black uppercase tracking-widest transition-colors ${
        active ? 'text-primary' : 'text-secondary hover:text-primary'
      }`}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="absolute -bottom-[21px] left-0 right-0 h-1 bg-primary rounded-t-full"
        />
      )}
    </Link>
  );
}

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 active:scale-90 ${
        active 
          ? 'text-primary' 
          : 'text-secondary hover:text-primary/70'
      }`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-primary/10' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${active ? 'text-primary' : 'text-secondary/60'}`}>{label}</span>
    </Link>
  );
}
