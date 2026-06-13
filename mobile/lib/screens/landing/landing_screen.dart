import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_spacing.dart';
import '../../state/auth_provider.dart';
import '../../state/cart_provider.dart';
import '../../state/content_provider.dart';

/// Layout-for-layout port of the storefront Landing (`/`): logo header, the
/// royal-blue hero with the postcode search card and the black image collage,
/// the feature trio, and the storefront-style bottom nav.
class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  static const _heroBlue = Color(0xFF005EB8);
  final _postcode = TextEditingController();

  @override
  void dispose() {
    _postcode.dispose();
    super.dispose();
  }

  void _searchStores() => Navigator.of(context).pushNamed(AppRouter.stores);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Column(
        children: [
          // Logo header.
          SafeArea(
            bottom: false,
            child: Container(
              width: double.infinity,
              height: 56,
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: theme.colorScheme.outlineVariant)),
              ),
              child: Image.asset(
                'assets/logo_playful.png',
                height: 32,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Text(
                  'Daily Grocer',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  _hero(theme),
                  _features(),
                  _essentials(theme),
                  const SizedBox(height: AppSpacing.lg),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _hero(ThemeData theme) {
    final t = context.watch<ContentProvider>().t;
    return Container(
      width: double.infinity,
      color: _heroBlue,
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, AppSpacing.xl),
      child: Column(
        children: [
          Text(
            t('landing.hero_title', 'Local store to door'),
            textAlign: TextAlign.center,
            style: theme.textTheme.displaySmall?.copyWith(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            t('landing.hero_subtitle', 'From as little as 30 minutes'),
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              color: const Color(0xFFBFDBFE),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _searchCard(theme),
          const SizedBox(height: AppSpacing.xl),
          _collage(),
        ],
      ),
    );
  }

  Widget _searchCard(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const SizedBox(width: 8),
              Icon(Icons.location_on_outlined, color: theme.colorScheme.outline, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _postcode,
                  onSubmitted: (_) => _searchStores(),
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Enter your postcode',
                    hintStyle: TextStyle(color: theme.colorScheme.outline),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    isDense: true,
                    filled: false,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Material(
            color: theme.colorScheme.secondary,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            child: InkWell(
              onTap: _searchStores,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              child: const SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 15),
                  child: Text(
                    'Search Local Stores',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _collage() {
    return AspectRatio(
      aspectRatio: 1,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          border: Border.all(color: Colors.white, width: 3),
        ),
        clipBehavior: Clip.antiAlias,
        child: LayoutBuilder(
          builder: (context, c) {
            final w = c.maxWidth;
            return Stack(
              children: [
                Positioned(
                  top: w * 0.06,
                  left: w * 0.06,
                  child: _circle('assets/produce.png', w * 0.34, const Color(0x662747D8)),
                ),
                Positioned(
                  bottom: w * 0.06,
                  right: w * 0.06,
                  child: _circle('assets/dairy.png', w * 0.34, const Color(0x66E6203A)),
                ),
                Positioned(top: w * 0.22, left: w * 0.32, child: _dot(8, const Color(0xFF2747D8))),
                Positioned(bottom: w * 0.32, left: w * 0.22, child: _dot(6, const Color(0xFFE6203A))),
                Center(
                  child: _circle('assets/delivery.png', w * 0.5, Colors.white, whiteBg: true, borderW: 4),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _circle(String asset, double size, Color border, {bool whiteBg = false, double borderW = 2}) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: whiteBg ? Colors.white : null,
        border: Border.all(color: border, width: borderW),
      ),
      clipBehavior: Clip.antiAlias,
      child: Image.asset(asset, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox.shrink()),
    );
  }

  Widget _dot(double size, Color color) =>
      Container(height: size, width: size, decoration: BoxDecoration(shape: BoxShape.circle, color: color));

  Widget _features() {
    final t = context.watch<ContentProvider>().t;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.base),
      child: Column(
        children: [
          _FeatureCard(
            icon: Icons.bolt,
            title: t('landing.feature_1_title', 'Fast Delivery'),
            desc: t('landing.feature_1_desc', 'Groceries delivered from your local shop in under an hour.'),
            bg: const Color(0xFFDCE8FF),
            fg: const Color(0xFF0056B3),
          ),
          const SizedBox(height: AppSpacing.md),
          _FeatureCard(
            icon: Icons.storefront_outlined,
            title: t('landing.feature_2_title', 'Support Local'),
            desc: t('landing.feature_2_desc', 'Shop directly from independent convenience stores in your area.'),
            bg: const Color(0xFFFFDAD6),
            fg: const Color(0xFFE6203A),
          ),
          const SizedBox(height: AppSpacing.md),
          _FeatureCard(
            icon: Icons.local_offer_outlined,
            title: t('landing.feature_3_title', 'In-Store Prices'),
            desc: t('landing.feature_3_desc', 'Pay exactly what you would in-store, with fair delivery fees.'),
            bg: const Color(0xFFDCE8FF),
            fg: const Color(0xFF0056B3),
          ),
        ],
      ),
    );
  }

  Widget _essentials(ThemeData theme) {
    final t = context.watch<ContentProvider>().t;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.base, 0, AppSpacing.base, AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Text(
              t('landing.section_title', 'Shop Everyday Essentials'),
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
          ),
          GestureDetector(
            onTap: _searchStores,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('View all', style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.primary)),
                const SizedBox(width: 2),
                Icon(Icons.arrow_forward_rounded, size: 16, color: theme.colorScheme.primary),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.desc,
    required this.bg,
    required this.fg,
  });

  final IconData icon;
  final String title;
  final String desc;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        children: [
          Container(
            height: 56,
            width: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            ),
            child: Icon(icon, color: fg, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            constraints: const BoxConstraints(maxWidth: 280),
            child: Text(
              desc,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontSize: 15,
                height: 1.4,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Storefront-style bottom navigation (Stores · Menu · Orders · Account · Cart).
class _StorefrontNav extends StatelessWidget {
  const _StorefrontNav({required this.activeIndex});
  final int activeIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final auth = context.watch<AuthProvider>();
    final cartCount = context.watch<CartProvider>().itemCount;

    final items = <_NavSpec>[
      _NavSpec(Icons.storefront_outlined, 'Stores', () => Navigator.of(context).pushNamed(AppRouter.stores)),
      _NavSpec(Icons.grid_view_rounded, 'Menu', () => Navigator.of(context).pushNamed(AppRouter.shell)),
      _NavSpec(Icons.receipt_long_outlined, 'Orders', () => Navigator.of(context).pushNamed(AppRouter.orders)),
      _NavSpec(
        Icons.person_outline_rounded,
        'Account',
        () => Navigator.of(context).pushNamed(auth.isAuthenticated ? AppRouter.shell : AppRouter.login),
      ),
      _NavSpec(Icons.shopping_cart_outlined, 'Cart', () => Navigator.of(context).pushNamed(AppRouter.shell), badge: cartCount),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: scheme.outlineVariant)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 60,
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(child: _navItem(theme, items[i], i == activeIndex)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(ThemeData theme, _NavSpec spec, bool active) {
    final color = active ? const Color(0xFF005EB8) : theme.colorScheme.outline;
    return InkWell(
      onTap: spec.onTap,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(spec.icon, size: 22, color: color),
              const SizedBox(height: 4),
              Text(
                spec.label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0,
                ),
              ),
            ],
          ),
          if (spec.badge > 0)
            Positioned(
              top: 6,
              right: 24,
              child: Container(
                height: 16,
                width: 16,
                alignment: Alignment.center,
                decoration: const BoxDecoration(color: Color(0xFFE6203A), shape: BoxShape.circle),
                child: Text(
                  '${spec.badge}',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, height: 1),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _NavSpec {
  _NavSpec(this.icon, this.label, this.onTap, {this.badge = 0});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int badge;
}
