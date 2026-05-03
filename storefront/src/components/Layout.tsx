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
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center shadow-[0_32px_48px_rgba(30,64,175,0.06)]">
        <div className="flex items-center gap-4">
          {showBack && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-primary hover:bg-primary/5 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex flex-col">
            {subtitle ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary leading-none mb-1">{subtitle}</span>
            ) : selectedStore ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary leading-none mb-1">{selectedStore.name}</span>
            ) : null}
            <h1 className="text-primary font-headline font-extrabold tracking-tighter text-lg leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <DesktopNavLink to="/browse" label="Aisles" active={location.pathname === '/browse' || location.pathname.startsWith('/aisle')} />
          <DesktopNavLink to="/stores" label="Stores" active={location.pathname === '/stores'} />
          <DesktopNavLink to="/offers" label="Offers" active={location.pathname === '/offers'} />
          <DesktopNavLink to="/history" label="Orders" active={location.pathname === '/history' || location.pathname.startsWith('/tracking') || location.pathname === '/success'} />
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/profile" className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors">
              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs border border-primary/20">
                {customer?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="hidden sm:inline">Profile</span>
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors border border-primary/20">
              Login / Sign Up
            </Link>
          )}
          
          {isAuthenticated && (
            <button 
              onClick={handleOpenNotifications}
              className="relative p-2 text-primary hover:bg-primary/5 rounded-full transition-colors active:scale-95"
            >
              <Bell size={24} />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-error text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-surface">
                  {notificationCount}
                </span>
              )}
            </button>
          )}

          <Link to="/cart" className="relative p-2 text-primary hover:bg-primary/5 rounded-full transition-colors active:scale-95">
            <ShoppingBag size={24} />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-tertiary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content - pb-32 ensures content clears the fixed bottom nav on mobile */}
      <main className="flex-grow pb-32 md:pb-0">
        {children}

        {/* UK Compliance Footer */}
        <footer className="mt-20 border-t border-outline-variant/10 px-6 py-12 bg-surface-container-lowest/50 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-primary font-black tracking-tighter opacity-40">
              <Leaf size={20} />
              <span>DAILY GROCER</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-primary transition-colors">Cookies Policy</Link>
            </div>
            <p className="text-[10px] font-medium text-on-surface-variant/40 max-w-md">
              © 2026 Daily Grocer Ltd. Registered in England & Wales. Delivery partners operating Challenge 25 policy.
            </p>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-2xl border-t border-outline-variant/10 px-4 pb-8 pt-4 flex justify-around items-center rounded-t-[2.5rem] z-50 shadow-[0_-12px_40px_rgba(0,0,0,0.06)] md:hidden">
          <NavLink to="/browse" icon={<LayoutGrid size={24} />} label="Aisles" active={location.pathname === '/browse' || location.pathname.startsWith('/aisle')} />
          <NavLink to="/stores" icon={<MapPin size={24} />} label="Stores" active={location.pathname === '/stores'} />
          <NavLink to="/offers" icon={<Tag size={24} />} label="Offers" active={location.pathname === '/offers'} />
          <NavLink to="/history" icon={<ShoppingBag size={24} />} label="Orders" active={location.pathname === '/history' || location.pathname.startsWith('/tracking') || location.pathname === '/success'} />
          <NavLink to={isAuthenticated ? "/profile" : "/login"} icon={<CircleUser size={24} />} label={isAuthenticated ? "Account" : "Log In"} active={location.pathname === '/profile' || location.pathname === '/login'} />
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
