import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/telemetry.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/banner_spec.dart';
import '../../data/models/category.dart';
import '../../data/models/order.dart';
import '../../data/models/product.dart';
import '../../state/auth_provider.dart';
import '../../state/cart_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/category_tile.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/product_card.dart';
import '../../widgets/section_header.dart';
import '../../widgets/skeleton.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Category>? _categories;
  List<BannerSpec>? _banners;
  List<Product>? _products;
  OrderSummary? _lastOrder;
  String? _error;
  bool _loading = true;
  String? _lastStoreId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
      _loadLastOrder();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final storeId = context.read<StoreProvider>().selected?.id;
    if (storeId != null && storeId != _lastStoreId) {
      _lastStoreId = storeId;
      _load();
    }
  }

  Future<void> _load() async {
    final storeId = context.read<StoreProvider>().selected?.id;
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        Api.instance.catalog.getCategories(),
        Api.instance.catalog.getBanners(storeId: storeId),
        Api.instance.catalog.getProducts(storeId: storeId, limit: 24),
      ]);
      if (!mounted) return;
      setState(() {
        _categories = results[0] as List<Category>;
        _banners = results[1] as List<BannerSpec>;
        _products = results[2] as List<Product>;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Something went wrong loading the storefront.';
        _loading = false;
      });
    }
  }

  /// Quietly fetch the most-recent order so we can render a Reorder strip.
  /// Non-fatal — silently skipped for guests or when the endpoint fails.
  Future<void> _loadLastOrder() async {
    if (!context.read<AuthProvider>().isAuthenticated) return;
    try {
      final orders = await Api.instance.orders.myOrders();
      if (!mounted || orders.isEmpty) return;
      setState(() => _lastOrder = orders.first);
    } catch (_) {
      // Swallow — reorder is a nice-to-have, never blocks the home page.
    }
  }

  /// Bulk-add the items from [_lastOrder] that we already have loaded in
  /// `_products`. We avoid a per-item GET to keep this fast; products not in
  /// the current store's catalog are silently skipped (the snackbar reports
  /// the count actually added).
  void _reorderLast() {
    final order = _lastOrder;
    final products = _products;
    if (order == null || products == null) return;
    final byId = {for (final p in products) p.id: p};
    final cart = context.read<CartProvider>();
    var added = 0;
    for (final line in order.lines) {
      final pid = line.product?.id;
      if (pid == null) continue;
      final p = byId[pid];
      if (p == null) continue;
      for (var i = 0; i < line.qty; i++) {
        cart.add(p);
      }
      added += line.qty;
    }
    Telemetry.event('reorder', {'order_id': order.id, 'added': added});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(added > 0
            ? '$added items from order #${order.orderNumber} added to cart'
            : 'No items from that order are stocked here right now'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final storeProvider = context.watch<StoreProvider>();
    if (!storeProvider.hasStore) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!context.mounted) return;
        Navigator.of(context).pushNamedAndRemoveUntil(AppRouter.stores, (_) => false);
      });
      return const SizedBox.shrink();
    }
    final store = storeProvider.selected!;
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();

    return RefreshIndicator(
      onRefresh: _load,
      color: theme.colorScheme.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: AnimatedPress(
                        onTap: () => Navigator.of(context).pushNamed(AppRouter.stores),
                        child: Row(
                          children: [
                            Container(
                              height: 44,
                              width: 44,
                              decoration: BoxDecoration(
                                gradient: AppColors.royalGradient,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: AppShadows.glowBlue(),
                              ),
                              child: const Icon(Icons.place_rounded, color: Colors.white, size: 22),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Delivering to', style: theme.textTheme.labelSmall),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          store.name,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: theme.textTheme.titleMedium,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(
                                        Icons.keyboard_arrow_down_rounded,
                                        color: theme.colorScheme.onSurfaceVariant,
                                        size: 20,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    CircleIconButton(
                      icon: Icons.shopping_bag_outlined,
                      semanticLabel: 'Cart',
                      badge: cart.itemCount > 0 ? cart.itemCount : null,
                      onTap: () {},
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: RichText(
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          text: TextSpan(
                            style: theme.textTheme.displaySmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.6,
                              color: theme.colorScheme.onSurface,
                            ),
                            children: [
                              TextSpan(text: '${_greetingPrefix()}, '),
                              TextSpan(
                                text: auth.displayName.split(' ').first,
                                style: TextStyle(color: theme.colorScheme.primary),
                              ),
                              const TextSpan(text: ' 👋'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        height: 8,
                        width: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: store.isOpen ? AppColors.success : AppColors.red500,
                          boxShadow: [
                            BoxShadow(
                              color: (store.isOpen ? AppColors.success : AppColors.red500).withValues(alpha: 0.5),
                              blurRadius: 6,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        store.isOpen
                            ? 'Store open · delivering in ~30 min'
                            : 'Closed · opens tomorrow',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.md),
              child: AnimatedPress(
                onTap: () => Navigator.of(context).pushNamed(AppRouter.search),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                    border: Border.all(color: theme.colorScheme.outlineVariant),
                    boxShadow: AppShadows.soft(context),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search_rounded, color: theme.colorScheme.onSurfaceVariant, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Search avocados, sourdough, olive oil…',
                          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ),
                      Container(
                        height: 28,
                        width: 28,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.tune_rounded, size: 16, color: theme.colorScheme.onSurface),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (_error != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: EmptyState(
                  icon: Icons.cloud_off_rounded,
                  title: "Couldn't reach the server",
                  message: _error!,
                  action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
                ),
              ),
            )
          else ...[
            SliverToBoxAdapter(child: _BannerCarousel(banners: _banners, loading: _loading)),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),
            const SliverToBoxAdapter(child: _MemberStrip()),
            if (_lastOrder != null) ...[
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),
              SliverToBoxAdapter(
                child: _ReorderStrip(order: _lastOrder!, onReorder: _reorderLast),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),
            const SliverToBoxAdapter(child: _QuickStats()),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
            const SliverToBoxAdapter(
              child: SectionHeader(title: 'Shop by aisle', subtitle: 'Hand-picked categories'),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),
            _categoriesSliver(),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
            const SliverToBoxAdapter(
              child: SectionHeader(title: 'Member offers', subtitle: 'Exclusive prices, refreshed every week'),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),
            _offersSliver(),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
            const SliverToBoxAdapter(
              child: SectionHeader(title: 'Customer favourites', subtitle: 'Loved by people in your area'),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),
            _productsSliver(),
          ],
          SliverToBoxAdapter(child: SizedBox(height: cart.itemCount > 0 ? 140 : 110)),
        ],
      ),
    );
  }

  Widget _categoriesSliver() {
    if (_loading) {
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, __) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Skeleton(
                height: 96,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              ),
            ),
            childCount: 4,
          ),
        ),
      );
    }
    final cats = _categories ?? const <Category>[];
    if (cats.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (_, i) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: CategoryTile(category: cats[i]),
          ),
          childCount: cats.length,
        ),
      ),
    );
  }

  Widget _offersSliver() {
    if (_loading) {
      return SliverToBoxAdapter(
        child: SizedBox(
          height: 280,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            itemCount: 3,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, __) => SizedBox(
              width: 200,
              child: Skeleton(
                height: 280,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              ),
            ),
          ),
        ),
      );
    }
    final promos = (_products ?? const <Product>[]).where((p) => p.hasPromo).toList();
    if (promos.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 280,
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          itemCount: promos.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) => SizedBox(width: 200, child: ProductCard(product: promos[i])),
        ),
      ),
    );
  }

  Widget _productsSliver() {
    if (_loading) {
      return SliverPadding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.66,
          ),
          delegate: SliverChildBuilderDelegate(
            (_, __) => Skeleton(
              height: 240,
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            ),
            childCount: 6,
          ),
        ),
      );
    }
    final products = _products ?? const <Product>[];
    if (products.isEmpty) {
      return const SliverToBoxAdapter(
        child: EmptyState(
          icon: Icons.inventory_2_outlined,
          title: 'No products yet',
          message: 'Check back soon — fresh stock arrives daily.',
        ),
      );
    }
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.66,
        ),
        delegate: SliverChildBuilderDelegate(
          (_, i) => ProductCard(product: products[i]),
          childCount: products.length,
        ),
      ),
    );
  }

  String _greetingPrefix() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }
}

class _ReorderStrip extends StatelessWidget {
  const _ReorderStrip({required this.order, required this.onReorder});
  final OrderSummary order;
  final VoidCallback onReorder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lines = order.lines.take(3).toList();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: scheme.outlineVariant),
          boxShadow: AppShadows.soft(context),
        ),
        child: Row(
          children: [
            Container(
              height: 44,
              width: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.replay_rounded, color: scheme.primary, size: 22),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Reorder your last shop',
                    style: theme.textTheme.titleMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${order.itemCount} items · ${formatGBP(order.total)} · #${order.orderNumber}',
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (lines.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      lines.map((l) => l.nameOrFallback).join(' · '),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 10),
            PremiumButton(
              label: 'Reorder',
              icon: Icons.add_shopping_cart_rounded,
              compact: true,
              onPressed: onReorder,
            ),
          ],
        ),
      ),
    );
  }
}

class _MemberStrip extends StatelessWidget {
  const _MemberStrip();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const progress = 0.72;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          gradient: AppColors.elegantGradient,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          boxShadow: [
            BoxShadow(
              color: AppColors.blue700.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 12),
              spreadRadius: -6,
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                height: 110,
                width: 110,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFE0B250).withValues(alpha: 0.45),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  height: 44,
                  width: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFFE08A), Color(0xFFB87B22)],
                    ),
                  ),
                  child: const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Text(
                            "You're £28 from Platinum",
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Spend more this month to unlock free delivery on every order.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.82),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        child: const LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: Color(0x33FFFFFF),
                          valueColor: AlwaysStoppedAnimation(Color(0xFFFFD580)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerCarousel extends StatefulWidget {
  const _BannerCarousel({required this.banners, required this.loading});
  final List<BannerSpec>? banners;
  final bool loading;

  @override
  State<_BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<_BannerCarousel> {
  late final PageController _ctrl = PageController(viewportFraction: 0.92);
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.loading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: Skeleton(
          height: 220,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        ),
      );
    }
    final banners = widget.banners ?? const <BannerSpec>[];
    if (banners.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: _BannerCard.fallback(),
      );
    }
    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            controller: _ctrl,
            itemCount: banners.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) {
              final b = banners[i];
              const gradients = [
                AppColors.royalGradient,
                AppColors.elegantGradient,
                AppColors.bloodGradient,
              ];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: _BannerCard(banner: b, gradient: gradients[i % gradients.length]),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            banners.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: 5,
              width: i == _index ? 20 : 5,
              decoration: BoxDecoration(
                color: i == _index
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _BannerCard extends StatelessWidget {
  const _BannerCard({required this.banner, required this.gradient});

  factory _BannerCard.fallback() => const _BannerCard(
        banner: BannerSpec(
          id: 'fallback',
          eyebrow: 'WELCOME',
          title: 'Premium groceries, delivered fast',
          caption: 'Fresh stock, free over £40, real care.',
        ),
        gradient: AppColors.royalGradient,
      );

  final BannerSpec banner;
  final Gradient gradient;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        boxShadow: [
          BoxShadow(
            color: AppColors.glowBlue,
            blurRadius: 40,
            offset: const Offset(0, 20),
            spreadRadius: -6,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Decorative concentric rings
          Positioned(
            right: -90,
            bottom: -90,
            child: Container(
              height: 240,
              width: 240,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
          Positioned(
            right: -40,
            bottom: -40,
            child: Container(
              height: 160,
              width: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.10),
              ),
            ),
          ),
          Positioned(
            left: -50,
            top: -50,
            child: Container(
              height: 140,
              width: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.20),
                    Colors.white.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          // Sparkle accents
          Positioned(
            right: 24,
            top: 18,
            child: Icon(
              Icons.auto_awesome_rounded,
              size: 22,
              color: Colors.white.withValues(alpha: 0.35),
            ),
          ),
          Positioned(
            right: 56,
            top: 56,
            child: Icon(
              Icons.auto_awesome_rounded,
              size: 14,
              color: Colors.white.withValues(alpha: 0.25),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (banner.eyebrow.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.22),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          height: 6,
                          width: 6,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          banner.eyebrow,
                          style: t.labelSmall?.copyWith(
                            color: Colors.white,
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  const SizedBox.shrink(),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      banner.title,
                      style: t.displaySmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.6,
                        height: 1.05,
                        shadows: [
                          Shadow(
                            color: Colors.black.withValues(alpha: 0.18),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      banner.caption,
                      style: t.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 14),
                    // Soft CTA pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.18),
                            blurRadius: 14,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Text(
                            'Shop the offer',
                            style: TextStyle(
                              color: AppColors.blue700,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.red500),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickStats extends StatelessWidget {
  const _QuickStats();

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final store = context.watch<StoreProvider>().selected!;
    final remaining =
        (store.freeDeliveryThreshold - cart.subtotal).clamp(0.0, double.infinity);
    final progress = (cart.subtotal / store.freeDeliveryThreshold).clamp(0.0, 1.0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          const Expanded(
            child: _StatCard(
              icon: Icons.electric_moped_rounded,
              colorA: AppColors.blue500,
              colorB: AppColors.blue800,
              title: '30 min',
              caption: 'Avg. delivery',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Icons.local_shipping_rounded,
              colorA: AppColors.red500,
              colorB: AppColors.red700,
              title: remaining == 0 ? 'Free delivery!' : '${formatGBP(remaining)} to go',
              caption: 'Free over ${formatGBP(store.freeDeliveryThreshold)}',
              progress: progress,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.colorA,
    required this.colorB,
    required this.title,
    required this.caption,
    this.progress,
  });

  final IconData icon;
  final Color colorA;
  final Color colorB;
  final String title;
  final String caption;
  final double? progress;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.base),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: theme.colorScheme.outlineVariant),
        boxShadow: AppShadows.soft(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 32,
            width: 32,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [colorA, colorB]),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(title, style: theme.textTheme.titleMedium),
          const SizedBox(height: 2),
          Text(caption, style: theme.textTheme.bodySmall),
          if (progress != null) ...[
            const SizedBox(height: AppSpacing.sm),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 5,
                backgroundColor: theme.colorScheme.surfaceContainerHigh,
                valueColor: const AlwaysStoppedAnimation(AppColors.red500),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
