import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/network/api_config.dart';
import '../../core/router/action_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/models/category.dart';
import '../../data/models/home_layout.dart';
import '../../data/models/product.dart';
import '../animated_press.dart';
import '../product_card.dart';

/// Renders one server-driven [HomeSection] into the right native widget.
///
/// Unknown section types resolve to [SizedBox.shrink] so an out-of-date app
/// silently skips sections it doesn't understand (graceful degradation).
class SectionBuilder extends StatelessWidget {
  const SectionBuilder({super.key, required this.section});

  final HomeSection section;

  @override
  Widget build(BuildContext context) {
    switch (section.type) {
      case 'hero_slider':
        return _HeroSliderSection(section: section);
      case 'banner_strip':
        return _BannerStripSection(section: section);
      case 'promo_grid':
        return _PromoGridSection(section: section);
      case 'product_carousel':
        return _ProductCarouselSection(section: section);
      case 'category_grid':
        return _CategoryGridSection(section: section);
      default:
        return const SizedBox.shrink();
    }
  }
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const _hPad = EdgeInsets.symmetric(horizontal: AppSpacing.base);

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, this.subtitle, this.onSeeAll});

  final String title;
  final String? subtitle;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.blue900,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (subtitle != null && subtitle!.trim().isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ],
            ),
          ),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              behavior: HitTestBehavior.opaque,
              child: const Row(
                children: [
                  Text(
                    'See all',
                    style: TextStyle(
                      color: AppColors.blue600,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded,
                      size: 18, color: AppColors.blue600),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

Widget _sectionImage(String? url, {BoxFit fit = BoxFit.cover}) {
  final resolved = ApiConfig.resolveUploadUrl(url);
  if (resolved.isEmpty) {
    return Container(color: AppColors.neutral200);
  }
  return CachedNetworkImage(
    imageUrl: resolved,
    fit: fit,
    width: double.infinity,
    placeholder: (_, __) => Container(color: AppColors.neutral200),
    errorWidget: (_, __, ___) => Container(color: AppColors.neutral200),
  );
}

/// Bottom gradient + title/subtitle/badge overlay shared by hero & banners.
class _ItemOverlay extends StatelessWidget {
  const _ItemOverlay({required this.item});
  final SectionItem item;

  @override
  Widget build(BuildContext context) {
    final hasText = (item.title?.trim().isNotEmpty ?? false) ||
        (item.subtitle?.trim().isNotEmpty ?? false) ||
        (item.badge?.trim().isNotEmpty ?? false);
    if (!hasText) return const SizedBox.shrink();
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withValues(alpha: 0.55),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (item.badge?.trim().isNotEmpty ?? false)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.red500,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                ),
                child: Text(
                  item.badge!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            if (item.title?.trim().isNotEmpty ?? false)
              Text(
                item.title!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            if (item.subtitle?.trim().isNotEmpty ?? false)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  item.subtitle!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// hero_slider
// ---------------------------------------------------------------------------

class _HeroSliderSection extends StatefulWidget {
  const _HeroSliderSection({required this.section});
  final HomeSection section;

  @override
  State<_HeroSliderSection> createState() => _HeroSliderSectionState();
}

class _HeroSliderSectionState extends State<_HeroSliderSection> {
  final _ctrl = PageController();
  Timer? _timer;
  int _current = 0;

  List<SectionItem> get _items => widget.section.items;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (_items.length <= 1 || !widget.section.autoplay) return;
    _timer = Timer.periodic(
      Duration(milliseconds: widget.section.intervalMs),
      (_) {
        if (!mounted || !_ctrl.hasClients) return;
        final next = (_current + 1) % _items.length;
        _ctrl.animateToPage(
          next,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      },
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: _hPad.add(const EdgeInsets.only(bottom: AppSpacing.lg)),
      child: SizedBox(
        height: 180,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          child: Stack(
            children: [
              PageView.builder(
                controller: _ctrl,
                itemCount: items.length,
                onPageChanged: (i) => setState(() => _current = i),
                itemBuilder: (_, i) {
                  final item = items[i];
                  return GestureDetector(
                    onTap: () => ActionRouter.navigate(context, item.action),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _sectionImage(item.imageUrl),
                        _ItemOverlay(item: item),
                      ],
                    ),
                  );
                },
              ),
              if (items.length > 1)
                Positioned(
                  bottom: 8,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(items.length, (i) {
                      final active = i == _current;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        height: 6,
                        width: active ? 16 : 6,
                        decoration: BoxDecoration(
                          color: active
                              ? AppColors.red500
                              : Colors.white.withValues(alpha: 0.8),
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusPill),
                        ),
                      );
                    }),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// banner_strip
// ---------------------------------------------------------------------------

class _BannerStripSection extends StatelessWidget {
  const _BannerStripSection({required this.section});
  final HomeSection section;

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    if (items.isEmpty) return const SizedBox.shrink();

    Widget banner(SectionItem item, {double? width}) {
      return GestureDetector(
        onTap: () => ActionRouter.navigate(context, item.action),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          child: SizedBox(
            width: width,
            height: 120,
            child: Stack(
              fit: StackFit.expand,
              children: [
                _sectionImage(item.imageUrl),
                _ItemOverlay(item: item),
              ],
            ),
          ),
        ),
      );
    }

    if (items.length == 1) {
      return Padding(
        padding: _hPad.add(const EdgeInsets.only(bottom: AppSpacing.lg)),
        child: banner(items.first),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: SizedBox(
        height: 120,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: _hPad,
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
          itemBuilder: (_, i) => banner(items[i], width: 280),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// promo_grid
// ---------------------------------------------------------------------------

class _PromoGridSection extends StatelessWidget {
  const _PromoGridSection({required this.section});
  final HomeSection section;

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    if (items.isEmpty) return const SizedBox.shrink();
    final columns = section.columns.clamp(1, 4).toInt();

    return Padding(
      padding: _hPad.add(const EdgeInsets.only(bottom: AppSpacing.lg)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (section.title?.trim().isNotEmpty ?? false)
            _SectionHeading(title: section.title!, subtitle: section.subtitle),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 1.5,
            ),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => ActionRouter.navigate(context, item.action),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _sectionImage(item.imageUrl),
                      _ItemOverlay(item: item),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// product_carousel
// ---------------------------------------------------------------------------

class _ProductCarouselSection extends StatelessWidget {
  const _ProductCarouselSection({required this.section});
  final HomeSection section;

  @override
  Widget build(BuildContext context) {
    final products = section.products;
    if (products.isEmpty) return const SizedBox.shrink();
    final seeAll = section.seeAll;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: _hPad,
            child: _SectionHeading(
              title: section.title?.trim().isNotEmpty ?? false
                  ? section.title!
                  : 'Featured',
              subtitle: section.subtitle,
              onSeeAll: seeAll == null
                  ? null
                  : () => ActionRouter.navigate(context, seeAll),
            ),
          ),
          SizedBox(
            height: 272,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: _hPad,
              itemCount: products.length,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
              itemBuilder: (_, i) => SizedBox(
                width: 168,
                child: ProductCard(product: products[i]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// category_grid
// ---------------------------------------------------------------------------

class _CategoryGridSection extends StatelessWidget {
  const _CategoryGridSection({required this.section});
  final HomeSection section;

  @override
  Widget build(BuildContext context) {
    final categories = section.categories;
    if (categories.isEmpty) return const SizedBox.shrink();
    final columns = 2;

    return Padding(
      padding: _hPad.add(const EdgeInsets.only(bottom: AppSpacing.lg)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (section.title?.trim().isNotEmpty ?? false)
            _SectionHeading(title: section.title!, subtitle: section.subtitle),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              mainAxisSpacing: AppSpacing.base,
              crossAxisSpacing: AppSpacing.base,
              childAspectRatio: columns == 4 ? 0.65 : (columns == 3 ? 0.75 : 0.85),
            ),
            itemCount: categories.length,
            itemBuilder: (_, i) => _CategoryGridTile(category: categories[i]),
          ),
        ],
      ),
    );
  }
}

/// Image-forward category tile matching the home grid look (white card,
/// contained image, footer label + chevron). Taps open the aisle directly.
class _CategoryGridTile extends StatelessWidget {
  const _CategoryGridTile({required this.category});
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
          border: Border.all(color: AppColors.neutral300),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: _image(),
              ),
            ),
            Container(
              height: 54,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.neutral300)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      category.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.neutral900,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right_rounded,
                      size: 18, color: AppColors.neutral600),
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
      final resolved = url.startsWith('/images/categories/')
          ? 'https://dailygrocer.co.uk$url'
          : ApiConfig.resolveUploadUrl(url);
      return CachedNetworkImage(
        imageUrl: resolved,
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
