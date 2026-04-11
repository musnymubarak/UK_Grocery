/**
 * Storefront App — Customer-facing grocery shop.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext';
import { AuthProvider } from './context/AuthContext';
import Landing from './screens/Landing';
import Home from './screens/Home';
import Aisle from './screens/Aisle';
import Cart from './screens/Cart';
import Checkout from './screens/Checkout';
import OrderSuccess from './screens/OrderSuccess';
import OrderTracking from './screens/OrderTracking';
import OrderHistory from './screens/OrderHistory';
import StoreSelection from './screens/StoreSelection';
import Profile from './screens/Profile';
import Login from './screens/Login';
import { AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router basename="/shop">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/browse" element={<Home />} />
              <Route path="/aisle/:id" element={<Aisle />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<OrderSuccess />} />
              <Route path="/tracking/:id" element={<OrderTracking />} />
              <Route path="/history" element={<OrderHistory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/stores" element={<StoreSelection />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </AnimatePresence>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
