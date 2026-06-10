import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBasket, Zap, Store, Tag, Menu, ReceiptText, User, ShoppingCart, Info, LayoutGrid, Search } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import Modal from './Modal';
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  /**
   * When true, the top app bar uses the dark navy surface style
   * (matching reference Cart/Checkout/Orders pages).
   */
  dark?: boolean;
  /**
   * When true, the main content is not constrained to max-w-7xl.
   * Useful for pages with full-width sections like Landing.
   */
  fullWidth?: boolean;
}

export default function Layout({ children, title = 'Daily Grocer', showBack = false, dark = false, fullWidth = false }: LayoutProps) {
  const { totalItems, selectedStore } = useCart();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Navbar search state
  const [navSearchInput, setNavSearchInput] = useState('');
  const showNavSearch = ['/browse', '/aisle', '/search', '/offers'].some(
    p => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  // Pre-fill search input when on /search?q=
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      if (q !== navSearchInput) {
        setNavSearchInput(q);
      }
    } else {
      setNavSearchInput('');
    }
  }, [location.pathname, location.search]);

  const handleNavSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNavSearchInput(val);
    if (location.pathname !== '/search') {
      navigate(`/search?q=${encodeURIComponent(val)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(val)}`, { replace: true });
    }
  };

  const handleNavSearchFocus = () => {
    if (location.pathname !== '/search') {
      navigate('/search');
    }
  };

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getCount()
        .then(res => setNotificationCount(res.data.count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const isAuthPage = location.pathname === '/login';
  const hideBottomNav = location.pathname === '/';

  // Header tone
  const headerBg = dark ? 'bg-surface-dark' : 'bg-surface-container-lowest';
  const headerText = dark ? 'text-on-primary' : 'text-on-surface';
  const headerBorder = dark ? 'border-b border-primary-container/40' : 'border-b border-outline-variant';

  return (
    <div className="min-h-screen bg-background flex justify-center pb-16 md:pb-0">
      <div className="w-full bg-background flex flex-col">
        {/* Top App Bar — Desktop & Mobile */}
        <header className="sticky top-0 z-50 bg-white border-b border-outline-variant w-full h-16 md:h-20 flex justify-center">
          <div className="w-full max-w-[90rem] flex justify-between items-center px-4 gap-4">
            <div className="flex items-center gap-3 md:gap-6 shrink-0">
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="flex items-center justify-center p-2 rounded-full text-text-main hover:bg-surface-container-low transition-colors"
                >
                  <ArrowLeft size={22} strokeWidth={2.5} />
                </button>
              )}
              <Link to={selectedStore ? '/browse' : '/'} className="flex items-center cursor-pointer shrink-0">
                <img src="/logo_playful.png" alt="Daily Grocer" className="h-10 md:h-14 w-auto object-contain" />
              </Link>

              {/* Store Details Selector Block (Snappy Shopper Style) */}
              {selectedStore && !['/checkout', '/success', '/login', '/register'].some(path => location.pathname.startsWith(path)) && !location.pathname.startsWith('/tracking') && (
                <div className="hidden md:flex items-center gap-3 border-l border-outline-variant/60 pl-6">
                  {/* Store logo or icon */}
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary border border-outline-variant/60 overflow-hidden shrink-0 shadow-sm">
                    <img 
                      src={
                        selectedStore.name.toLowerCase().includes('family shopper') ? '/images/stores/family_shopper.webp' :
                        selectedStore.name.toLowerCase().includes('go local') ? '/images/stores/golocal.png' :
                        selectedStore.name.toLowerCase().includes('premier') ? '/images/stores/premier.png' :
                        selectedStore.name.toLowerCase().includes('stocksfield') ? '/images/stores/Stocksfield.png' :
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStore.name)}&background=005eb8&color=fff`
                      } 
                      alt={selectedStore.name} 
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-text-main leading-tight truncate max-w-[180px]">
                      {selectedStore.name}
                    </span>
                    <button 
                      onClick={() => navigate('/stores')} 
                      className="text-[11px] font-semibold text-on-surface-variant hover:text-action-blue transition-colors flex items-center gap-0.5 leading-none mt-0.5"
                    >
                      <span>Delivery in 25 to 40 Mins</span>
                      <span className="text-[9px] font-bold">&gt;</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => navigate('/stores')} 
                    className="ml-2 border border-outline-variant hover:border-action-blue hover:text-action-blue text-text-main font-bold text-[11px] px-2.5 py-1 rounded transition-all bg-white"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Navbar Search Bar */}
            {showNavSearch && (
              <form
                onSubmit={handleNavSearchSubmit}
                className="flex flex-1 max-w-lg items-center relative"
              >
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-outline">
                  <Search size={18} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={navSearchInput}
                  onChange={handleNavSearchChange}
                  onFocus={handleNavSearchFocus}
                  autoFocus={location.pathname === '/search'}
                  placeholder="Search for products..."
                  className="w-full bg-[#f5f6fa] border border-outline-variant/50 rounded-full py-2.5 pl-10 pr-4 text-sm text-text-main outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue/30 placeholder:text-outline transition-all"
                />
              </form>
            )}

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                aria-label="Account"
                className="flex items-center justify-center p-2 rounded-full text-text-main hover:bg-surface-container-low transition-colors"
              >
                <User size={22} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => navigate('/cart')}
                aria-label="Cart"
                className="relative flex items-center justify-center p-2 rounded-full text-text-main hover:bg-surface-container-low transition-colors"
              >
                <ShoppingBasket size={22} strokeWidth={2.5} />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-[#e6203a] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow flex justify-center pb-24 md:pb-24">
          <div className={`w-full ${fullWidth ? '' : 'max-w-[90rem] px-4'}`}>
            {children}
          </div>
        </main>

          {/* UK Compliance Footer */}
          <footer className="hidden md:block mt-16 border-t border-outline-variant px-6 py-8 bg-surface-container-lowest text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="font-headline font-bold text-sm text-primary tracking-tight">
                DAILY GROCER
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-on-surface-variant">
                <Link to="/privacy" className="hover:text-action-blue transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-action-blue transition-colors">Terms of Service</Link>
                <Link to="/cookies" className="hover:text-action-blue transition-colors">Cookies Policy</Link>
              </div>
              <p className="text-[10px] text-on-surface-variant max-w-xs leading-relaxed">
                © 2026 Daily Grocer Ltd. Registered in England & Wales. Delivery partners operating Challenge 25 policy.
              </p>
            </div>
          </footer>

          {/* Bottom Navigation — Modernized */}
          {!hideBottomNav && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant flex justify-around items-center h-16 pb-safe z-50">
              <BottomNavLink
                to="/stores"
                icon={<Store size={22} strokeWidth={2.5} />}
                label="Stores"
                active={location.pathname === '/stores'}
              />
              <BottomNavLink
                to="/browse"
                icon={<LayoutGrid size={22} strokeWidth={2.5} />}
                label="Menu"
                active={location.pathname === '/browse' || location.pathname.startsWith('/aisle')}
              />
              <BottomNavLink
                to="/history"
                icon={<ReceiptText size={22} strokeWidth={2.5} />}
                label="Orders"
                active={location.pathname === '/history' || location.pathname === '/orders' || location.pathname.startsWith('/tracking')}
              />
              <BottomNavLink
                to={isAuthenticated ? '/profile' : '/login'}
                icon={<User size={22} strokeWidth={2.5} />}
                label="Account"
                active={location.pathname === '/profile' || location.pathname === '/login'}
              />
              <BottomNavLink
                to="/cart"
                icon={<ShoppingCart size={22} strokeWidth={2.5} />}
                label="Cart"
                active={location.pathname === '/cart'}
                badge={totalItems}
              />
            </nav>
          )}

          {/* Notification Modal */}
          <Modal
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            title="Your Notifications"
          >
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant font-medium">
                  You're all caught up!
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div key={n.id} className="ref-card p-4 flex gap-3 bg-surface-container-lowest">
                    <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center text-action-blue shrink-0">
                      {n.type === 'order' ? <ShoppingBasket size={20} /> : <Info size={20} />}
                    </div>
                    <div>
                      <div className="font-label-bold font-semibold text-sm text-text-main">{n.title}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-on-surface-variant mt-2 font-semibold uppercase tracking-widest">
                        {new Date(n.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Modal>
      </div>
    </div>
  );
}

function BottomNavLink({
  to,
  icon,
  label,
  active,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
        active ? 'text-[#005eb8]' : 'text-outline hover:text-text-main'
      }`}
    >
      <div className="flex flex-col items-center">
        {icon}
        <span className="text-[10px] font-semibold mt-1">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1.5 right-3 bg-[#e6203a] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}
