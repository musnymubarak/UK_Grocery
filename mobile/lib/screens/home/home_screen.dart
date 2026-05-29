import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_config.dart';
import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/banner_spec.dart';
import '../../data/models/category.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

/// Faithful port of the storefront `Home` (`/browse`): store-name strip, a hero
/// banner carousel (or the blue "Free Delivery" promo fallback), the three promo
/// cards, then the "Categories" circle-tile grid. No product grid — matches the
/// storefront, where Home links into aisles.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Category>? _categories;
  List<BannerSpec> _banners = const [];
  bool _loading = true;
  String? _error;
  String? _lastStoreId;

  int _currentBanner = 0;
  final _pageCtrl = PageController();
  Timer? _bannerTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
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

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _pageCtrl.dispose();
    super.dispose();
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
      ]);
      if (!mounted) return;
      setState(() {
        _categories = (results[0] as List<Category>)
            .where((c) => c.parentId == null)
            .toList();
        _banners = results[1] as List<BannerSpec>;
        _loading = false;
        _currentBanner = 0;
      });
      _startBannerTimer();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load application data';
        _loading = false;
      });
    }
  }

  void _startBannerTimer() {
    _bannerTimer?.cancel();
    if (_banners.length <= 1) return;
    _bannerTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_pageCtrl.hasClients) return;
      final next = (_currentBanner + 1) % _banners.length;
      _pageCtrl.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  void _showPricingInfo(double minOrder) {
    final theme = Theme.of(context);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Delivery pricing', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Delivery fees range from £1.99 to £5.99 based on distance. '
              'Orders over £40 are delivered free.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            if (minOrder > 0) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Minimum order ${formatGBP(minOrder)}.',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ],
        ),
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

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          // Store header strip (mobile) — centred store name on a bordered bar.
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: AppSpacing.base),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border(bottom: BorderSide(color: theme.colorScheme.outlineVariant)),
            ),
            child: Text(
              store.name.isNotEmpty ? store.name : 'Daily Grocer Local',
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          Expanded(child: _body(theme, store.minOrderValue)),
        ],
      ),
    );
  }

  Widget _body(ThemeData theme, double minOrder) {
    if (_loading) {
      return ListView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, AppSpacing.xxl),
        children: [
          Skeleton(height: 180, borderRadius: BorderRadius.circular(AppSpacing.radiusXl)),
          const SizedBox(height: AppSpacing.lg),
          Skeleton(height: 96, borderRadius: BorderRadius.circular(AppSpacing.radiusXl)),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: AppSpacing.base,
            crossAxisSpacing: AppSpacing.base,
            childAspectRatio: 0.95,
            children: List.generate(
              6,
              (_) => Skeleton(borderRadius: BorderRadius.circular(AppSpacing.radiusXl)),
            ),
          ),
        ],
      );
    }
    if (_error != null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: 'Failed to load',
        message: _error!,
        action: PremiumButton(label: 'Try again', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }
    final categories = _categories ?? const <Category>[];
    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _banners.isNotEmpty ? _bannerCarousel() : const _PromoHero(),
                  const SizedBox(height: AppSpacing.lg),
                  _PricingChip(onTap: () => _showPricingInfo(minOrder)),
                  const SizedBox(height: AppSpacing.md),
                  const _RewardsCard(),
                  const SizedBox(height: AppSpacing.md),
                  const _FreeDeliveryCard(),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Categories',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
            ),
          ),
          if (categories.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: Text('No categories available yet. Check back soon!')),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, 0, AppSpacing.base, AppSpacing.xxl),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSpacing.base,
                  crossAxisSpacing: AppSpacing.base,
                  childAspectRatio: 0.95,
                ),
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _CategoryCircleTile(category: categories[i]),
                  childCount: categories.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _bannerCarousel() {
    final theme = Theme.of(context);
    return SizedBox(
      height: 180,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        child: Stack(
          children: [
            PageView.builder(
              controller: _pageCtrl,
              itemCount: _banners.length,
              onPageChanged: (i) => setState(() => _currentBanner = i),
              itemBuilder: (_, i) {
                final url = ApiConfig.resolveUploadUrl(_banners[i].imageUrl);
                if (url.isEmpty) {
                  return Container(color: theme.colorScheme.surfaceContainer);
                }
                return CachedNetworkImage(
                  imageUrl: url,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  placeholder: (_, __) => Container(color: theme.colorScheme.surfaceContainer),
                  errorWidget: (_, __, ___) => Container(color: theme.colorScheme.surfaceContainer),
                );
              },
            ),
            if (_banners.length > 1)
              Positioned(
                bottom: 8,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_banners.length, (i) {
                    final active = i == _currentBanner;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      height: 6,
                      width: active ? 16 : 6,
                      decoration: BoxDecoration(
                        color: active ? theme.colorScheme.secondary : Colors.white.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                      ),
                    );
                  }),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Default blue promotional hero shown when there are no banners.
class _PromoHero extends StatelessWidget {
  const _PromoHero();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      constraints: const BoxConstraints(minHeight: 160),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Free Delivery Today!',
            style: theme.textTheme.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'On all orders over £30. Stock up now.',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.9)),
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
            decoration: BoxDecoration(
              color: theme.colorScheme.secondary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: const Text(
              'Shop Now',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _PricingChip extends StatelessWidget {
  const _PricingChip({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return AnimatedPress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: scheme.outlineVariant),
        ),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: scheme.primary.withValues(alpha: 0.1),
              ),
              child: Icon(Icons.pedal_bike_rounded, size: 20, color: scheme.primary),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PRICING INFO',
                    style: theme.textTheme.labelSmall?.copyWith(
                      letterSpacing: 1,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '£1.99 - £5.99',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            Icon(Icons.info_outline_rounded, size: 18, color: scheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _RewardsCard extends StatelessWidget {
  const _RewardsCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'DAILY GROCER REWARDS',
            style: theme.textTheme.labelMedium?.copyWith(color: Colors.white, letterSpacing: 0.4),
          ),
          const SizedBox(height: 6),
          Text(
            'Get Rewards in a Snap!',
            style: theme.textTheme.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: theme.colorScheme.secondary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: const Text(
              'Find out more',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _FreeDeliveryCard extends StatelessWidget {
  const _FreeDeliveryCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.secondary,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Row(
        children: [
          Transform.rotate(
            angle: -0.05,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Text(
                'FREE\nDELIVERY',
                textAlign: TextAlign.center,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: theme.colorScheme.secondary,
                  fontWeight: FontWeight.w800,
                  height: 0.95,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.base),
          Expanded(
            child: Text(
              'ON ALL ORDERS OVER £40',
              textAlign: TextAlign.right,
              style: theme.textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryCircleTile extends StatelessWidget {
  const _CategoryCircleTile({required this.category});
  final Category category;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return AnimatedPress(
      onTap: () => Navigator.of(context).pushNamed(
        AppRouter.aisle,
        arguments: {'id': category.id, 'title': category.name},
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          border: Border.all(color: scheme.outlineVariant),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              height: 96,
              width: 96,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: scheme.surfaceContainerLow,
              ),
              child: _image(),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              category.name,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelLarge?.copyWith(height: 1.15),
            ),
          ],
        ),
      ),
    );
  }

  Widget _image() {
    final url = category.imageUrl;
    if (url != null && url.trim().isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: ApiConfig.resolveUploadUrl(url),
        fit: BoxFit.contain,
        errorWidget: (_, __, ___) => _asset(),
      );
    }
    return _asset();
  }

  Widget _asset() => Image.asset(
        category.assetImage,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Icon(category.icon, size: 40),
      );
}
