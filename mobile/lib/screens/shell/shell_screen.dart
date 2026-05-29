import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/telemetry.dart';
import '../../widgets/premium_bottom_nav.dart';
import '../cart/cart_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/profile_screen.dart';
import '../search/search_screen.dart';

/// Bottom-nav host. Each tab maps to a storefront route:
///   Home    → /browse
///   Search  → /search
///   Offers  → /offers
///   Cart    → /cart
///   Profile → /profile
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;

  final _pages = const [
    HomeScreen(),
    SearchScreen(embedded: true),
    OffersScreen(),
    CartScreen(embedded: true),
    ProfileScreen(),
  ];

  final _items = const [
    NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Home'),
    NavItem(icon: Icons.search_rounded, activeIcon: Icons.search_rounded, label: 'Search'),
    NavItem(icon: Icons.local_offer_outlined, activeIcon: Icons.local_offer_rounded, label: 'Offers'),
    NavItem(
      icon: Icons.shopping_bag_outlined,
      activeIcon: Icons.shopping_bag_rounded,
      label: 'Cart',
    ),
    NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
    );
  }
}
