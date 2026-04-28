/**
 * Storefront App — Customer-facing grocery shop.
 */
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import Offers from './screens/Offers';
import Login from './screens/Login';
import ProductDetails from './screens/ProductDetails';
import RefundStatus from './screens/RefundStatus';
import { AnimatePresence } from 'motion/react';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore - TS complains about intrinsic key prop on Routes structure */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Home />} />
        <Route path="/aisle/:id" element={<Aisle />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<OrderSuccess />} />
        <Route path="/tracking/:id" element={<OrderTracking />} />
        <Route path="/history" element={<OrderHistory />} />
        <Route path="/refunds" element={<RefundStatus />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/stores" element={<StoreSelection />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
