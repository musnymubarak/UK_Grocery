import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/telemetry.dart';
import '../../state/auth_provider.dart';
import '../../state/notifications_provider.dart';
import '../../widgets/premium_bottom_nav.dart';
import '../cart/cart_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../stores/store_selection_screen.dart';
import '../order/order_history_screen.dart';

/// Bottom-nav host. Each tab maps to a storefront route:
///   Stores  → /stores
///   Menu    → /browse
///   Orders  → /orders
///   Account → /profile
///   Cart    → /cart
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 1; // Default to Menu tab (HomeScreen)

  final _pages = const [
    StoreSelectionScreen(),
    HomeScreen(),
    OrderHistoryScreen(),
    ProfileScreen(),
    CartScreen(embedded: true),
  ];

  final _items = const [
    NavItem(icon: Icons.storefront_outlined, activeIcon: Icons.storefront_rounded, label: 'Stores'),
    NavItem(icon: Icons.grid_view_rounded, activeIcon: Icons.grid_view_rounded, label: 'Menu'),
    NavItem(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long_rounded, label: 'Orders'),
    NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Account'),
    NavItem(icon: Icons.shopping_cart_outlined, activeIcon: Icons.shopping_cart_rounded, label: 'Cart'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.read<AuthProvider>().isAuthenticated) {
        context.read<NotificationsProvider>().loadCount();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _index == 1,
      onPopInvokedWithResult: (didPop, result) {
        // Hardware back on a sub-tab returns to Menu instead of leaving the app.
        if (!didPop && _index != 1) {
          setState(() => _index = 1);
        }
      },
      child: Scaffold(
        extendBody: true,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 320),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, anim) {
          return FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.02),
                end: Offset.zero,
              ).animate(anim),
              child: child,
            ),
          );
        },
        child: KeyedSubtree(
          key: ValueKey(_index),
          child: _pages[_index],
        ),
      ),
      bottomNavigationBar: PremiumBottomNav(
        currentIndex: _index,
        onTap: (i) {
          if (i == _index) return;
          HapticFeedback.selectionClick();
          Telemetry.event('nav_tab', {'to': _items[i].label.toLowerCase()});
          setState(() => _index = i);
        },
        items: _items,
      ),
      ),
    );
  }
}
