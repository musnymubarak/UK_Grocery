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
import '../../data/models/branding.dart';
import '../../data/models/category.dart';
import '../../data/models/home_layout.dart';
import '../../state/branding_provider.dart';
import '../../state/content_provider.dart';
import '../../state/home_layout_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/announcement_bar.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/sections/section_builder.dart';
import '../../widgets/skeleton.dart';

/// Faithful port of the storefront `Home` (`/browse`): store-name strip, a hero
/// banner carousel (or the blue "Free Delivery" promo fallback), the three promo
/// cards, then the "Categories" image-tile grid. No product grid — matches the
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
      _refreshLayout();
    }
  }

  /// Fetch the server-driven home layout for the active store. When it returns
  /// no sections (or fails) the hardcoded fallback layout below is shown.
  void _refreshLayout() {
    final storeId = context.read<StoreProvider>().selected?.id;
    context.read<HomeLayoutProvider>().refresh(storeId);
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
    final branding = context.watch<BrandingProvider>().branding;
    final storeProvider = context.watch<StoreProvider>();
    if (!storeProvider.hasStore) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!context.mounted) return;
        Navigator.of(context).pushNamedAndRemoveUntil(AppRouter.stores, (_) => false);
      });
      return const SizedBox.shrink();
    }
    final store = storeProvider.selected!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Header with logo and search bar
            Container(
              width: double.infinity,
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: theme.colorScheme.outlineVariant)),
              ),
              child: Row(
                children: [
                  _logo(theme, branding),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.of(context).pushNamed(AppRouter.search),
                      borderRadius: BorderRadius.circular(24),
                      child: Container(
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Icon(Icons.search_rounded, color: Colors.grey.shade600, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Search for products...',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Admin-controlled announcement strip (hidden when none is active)
            const AnnouncementBar(),
            // Store name banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: AppSpacing.base),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: theme.colorScheme.outlineVariant)),
              ),
              child: Text(
                store.name.isNotEmpty ? store.name : 'Daily Grocer Local',
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: Colors.black,
                  fontSize: 15,
                ),
              ),
            ),
            Expanded(child: _body(theme, store.minOrderValue)),
          ],
        ),
      ),
    );
  }

  /// Header brand logo. Renders the admin-set remote logo when one is
  /// configured (resolving relative `/uploads/...` URLs the same way banners
  /// do), falling back to the bundled asset, then to the brand name text.
  Widget _logo(ThemeData theme, BrandingConfig branding) {
    final asset = Image.asset(
      'assets/logo_playful.png',
      height: 30,
      fit: BoxFit.contain,
      errorBuilder: (_, __, ___) => Text(
        branding.appName,
        style: theme.textTheme.titleLarge?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
    if (branding.logoUrl.isEmpty) return asset;
    final url = ApiConfig.resolveUploadUrl(branding.logoUrl);
    if (url.isEmpty) return asset;
    return CachedNetworkImage(
      imageUrl: url,
      height: 30,
      fit: BoxFit.contain,
      placeholder: (_, __) => asset,
      errorWidget: (_, __, ___) => asset,
    );
  }

  Widget _body(ThemeData theme, double minOrder) {
    // Server-driven layout takes precedence when the admin has published
    // sections; otherwise we fall through to the hardcoded default below.
    final layoutProvider = context.watch<HomeLayoutProvider>();
    final t = context.watch<ContentProvider>().t;
    final sections = layoutProvider.layout?.sections ?? const <HomeSection>[];
    if (sections.isNotEmpty) {
      return RefreshIndicator(
        onRefresh: () async {
          await _load();
          _refreshLayout();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.base)),
            for (final section in sections)
              SliverToBoxAdapter(child: SectionBuilder(section: section)),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxl)),
          ],
        ),
      );
    }

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
            childAspectRatio: 0.85,
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
                    t('home.categories_title', 'Categories'),
                    style: const TextStyle(
                      color: Color(0xFF001D3D),
                      fontSize: 22,
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
                  childAspectRatio: 0.85,
                ),
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _CategoryTile(category: categories[i]),
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
    final t = context.watch<ContentProvider>().t;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0056B3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('home.fallback_hero_title', 'Free Delivery Today!'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            t('home.fallback_hero_subtitle', 'On all orders over £30. Stock up now.'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFE6203A),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                t('home.fallback_hero_cta', 'Shop Now'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
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
    return AnimatedPress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFE0F2FE),
              ),
              child: const Icon(Icons.pedal_bike_rounded, size: 20, color: Color(0xFF0056B3)),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PRICING INFO',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF64748B),
                      letterSpacing: 0.5,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '£1.99 - £5.99',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.info_outline_rounded, size: 20, color: Color(0xFF64748B)),
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
    final t = context.watch<ContentProvider>().t;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0056B3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('home.rewards_label', 'DAILY GROCER REWARDS'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            t('home.rewards_title', 'Get Rewards in a Snap!'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFE6203A),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                t('home.rewards_cta', 'Find out more'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
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
    final t = context.watch<ContentProvider>().t;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFE6203A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Transform.rotate(
            angle: -0.05,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'FREE\nDELIVERY',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFFE6203A),
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  height: 1.0,
                ),
              ),
            ),
          ),
          Expanded(
            child: Text(
              t('home.free_delivery_threshold', 'ON ALL ORDERS OVER £40'),
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.category});
  final Category category;

  @override
  Widget build(BuildContext context) {
    return AnimatedPress(
      onTap: () => Navigator.of(context).pushNamed(
        AppRouter.aisle,
        arguments: {'id': category.id, 'title': category.name},
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image stage — product image fills the frame on a clean surface
            // (no more tiny circle floating in whitespace).
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: _image(),
              ),
            ),
            // Footer — label on the left, neutral chevron on the right.
            Container(
              height: 54,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      category.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF1A1A1A),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFF64748B)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _image() {
    final url = category.imageUrl;
    if (url != null && url.trim().isNotEmpty) {
      final resolvedUrl = url.startsWith('/images/categories/')
          ? 'https://dailygrocer.co.uk$url'
          : ApiConfig.resolveUploadUrl(url);
      return CachedNetworkImage(
        imageUrl: resolvedUrl,
        imageBuilder: (context, imageProvider) => Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: imageProvider,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
        ),
        errorWidget: (_, __, ___) => _asset(),
      );
    }
    return _asset();
  }

  Widget _asset() => Image.asset(
        category.assetImage,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.high,
        errorBuilder: (_, __, ___) => Icon(category.icon, size: 40),
      );
}
