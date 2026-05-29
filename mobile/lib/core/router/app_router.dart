import 'package:flutter/material.dart';

import '../../screens/aisle/aisle_screen.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/checkout/checkout_screen.dart';
import '../../screens/landing/landing_screen.dart';
import '../../screens/legal/legal_screen.dart';
import '../../screens/notifications/notifications_screen.dart';
import '../../screens/order/order_history_screen.dart';
import '../../screens/order/order_success_screen.dart';
import '../../screens/order/order_tracking_screen.dart';
import '../../screens/product/product_details_screen.dart';
import '../../screens/refund/refund_status_screen.dart';
import '../../screens/search/search_screen.dart';
import '../../screens/shell/shell_screen.dart';
import '../../screens/splash/splash_screen.dart';
import '../../screens/stores/store_selection_screen.dart';
import '../utils/page_transitions.dart';

/// Mobile route table mirrors the storefront `App.tsx` routes 1:1.
class AppRouter {
  AppRouter._();

  static const splash = '/';
  static const landing = '/landing';
  static const login = '/login';
  static const shell = '/shell';
  static const aisle = '/aisle';
  static const product = '/product';
  static const search = '/search';
  static const checkout = '/checkout';
  static const orderSuccess = '/order/success';
  static const orderTracking = '/order/tracking';
  static const orders = '/orders';
  static const stores = '/stores';
  static const refunds = '/refunds';
  static const privacy = '/privacy';
  static const terms = '/terms';
  static const cookies = '/cookies';
  static const notifications = '/notifications';

  static Route<dynamic> onGenerateRoute(RouteSettings s) {
    switch (s.name) {
      case splash:
        return _fade(const SplashScreen(), s);
      case landing:
        return _fade(const LandingScreen(), s);
      case login:
        final args = s.arguments as Map<String, dynamic>? ?? {};
        return _slide(LoginScreen(initialMode: args['mode'] as String?), s);
      case shell:
        return _fade(const ShellScreen(), s);
      case aisle:
        final args = s.arguments as Map<String, dynamic>? ?? {};
        return _slide(
          AisleScreen(categoryId: args['id'] as String?, title: args['title'] as String?),
          s,
        );
      case product:
        final args = s.arguments as Map<String, dynamic>? ?? {};
        return _slide(ProductDetailsScreen(productId: args['id'] as String), s);
      case search:
        return _slide(const SearchScreen(), s);
      case checkout:
        return _slide(const CheckoutScreen(), s);
      case orderSuccess:
        final args = s.arguments as Map<String, dynamic>? ?? {};
        return _fade(OrderSuccessScreen(orderId: args['id'] as String? ?? 'DG-1024'), s);
      case orderTracking:
        final args = s.arguments as Map<String, dynamic>? ?? {};
        return _slide(OrderTrackingScreen(orderId: args['id'] as String? ?? 'DG-1024'), s);
      case orders:
        return _slide(const OrderHistoryScreen(), s);
      case stores:
        return _slide(const StoreSelectionScreen(), s);
      case refunds:
        return _slide(const RefundStatusScreen(), s);
      case privacy:
        return _slide(const PrivacyPolicyScreen(), s);
      case terms:
        return _slide(const TermsOfServiceScreen(), s);
      case cookies:
        return _slide(const CookiePolicyScreen(), s);
      case notifications:
        return _slide(const NotificationsScreen(), s);
      default:
        return _fade(const SplashScreen(), s);
    }
  }

  static Route _slide(Widget child, RouteSettings s) =>
      PremiumPageRoute(child: child, settings: s, direction: SlideDirection.right);

  static Route _fade(Widget child, RouteSettings s) =>
      PremiumFadeRoute(child: child, settings: s);
}
