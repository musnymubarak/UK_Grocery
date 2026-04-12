import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Leaf, Search, ShoppingBasket, User } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function Layout({ children, title = 'The Conservatory', subtitle, showBack = false }: LayoutProps) {
  const { totalItems, selectedStore } = useCart();
  const { isAuthenticated, customer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center shadow-[0_32px_48px_rgba(44,104,46,0.06)]">
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

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isAuthPage && (
        <nav className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 px-4 pb-8 pt-4 flex justify-around items-center rounded-t-[3rem] z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.04)]">
          <NavLink to="/browse" icon={<Leaf size={24} />} label="Categories" active={location.pathname === '/browse' || location.pathname.startsWith('/aisle')} />
          <NavLink to="/stores" icon={<Search size={24} />} label="Stores" active={location.pathname === '/stores'} />
          <NavLink to="/cart" icon={<ShoppingBasket size={24} />} label="Cart" active={location.pathname === '/cart'} />
          <NavLink to="/history" icon={<ShoppingBasket size={24} />} label="Orders" active={location.pathname === '/history' || location.pathname.startsWith('/tracking') || location.pathname === '/success'} />
          <NavLink to={isAuthenticated ? "/profile" : "/login"} icon={<User size={24} />} label={isAuthenticated ? "Account" : "Log In"} active={location.pathname === '/profile' || location.pathname === '/login'} />
        </nav>
      )}
    </div>
  );
}

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center px-5 py-2 transition-all duration-300 active:scale-90 ${
        active 
          ? 'bg-primary/10 text-primary rounded-full' 
          : 'text-secondary hover:text-primary'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
    </Link>
  );
}
