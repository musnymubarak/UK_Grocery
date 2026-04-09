/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Landing from './screens/Landing';
import Home from './screens/Home';
import Aisle from './screens/Aisle';
import Cart from './screens/Cart';
import Checkout from './screens/Checkout';
import OrderSuccess from './screens/OrderSuccess';
import OrderTracking from './screens/OrderTracking';
import OrderHistory from './screens/OrderHistory';
import StoreSelection from './screens/StoreSelection';
import Login from './screens/Login';
import { AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <CartProvider>
      <Router basename="/client">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/shop" element={<Home />} />
            <Route path="/aisle/:id" element={<Aisle />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<OrderSuccess />} />
            <Route path="/tracking" element={<OrderTracking />} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/stores" element={<StoreSelection />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </CartProvider>
  );
}


