import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/store.dart';
import '../../state/cart_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

enum _Filter { all, openNow, freeDelivery }

class StoreSelectionScreen extends StatefulWidget {
  const StoreSelectionScreen({super.key});

  @override
  State<StoreSelectionScreen> createState() => _StoreSelectionScreenState();
}

class _StoreSelectionScreenState extends State<StoreSelectionScreen> {
  String _q = '';
  _Filter _filter = _Filter.all;
  bool _locating = false;
  final _searchCtrl = TextEditingController();
  final _postcodeRegex = RegExp(r'^[A-Z0-9 ]{3,10}$');

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<StoreLocation> _applyFilter(List<StoreLocation> stores) {
    final byFilter = switch (_filter) {
      _Filter.all => stores,
      _Filter.openNow => stores.where((s) => s.isOpen).toList(),
      _Filter.freeDelivery => stores.where((s) => s.defaultDeliveryFee == 0).toList(),
    };
    if (_q.trim().isEmpty) return byFilter;
    final q = _q.toLowerCase();
    return byFilter
        .where((s) => '${s.name} ${s.postcode} ${s.city}'.toLowerCase().contains(q))
        .toList();
  }

  Future<void> _onNearMe(StoreProvider provider) async {
    if (_locating) return;
    setState(() => _locating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        _toast('Turn on location services to find nearby stores.');
        return;
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        _toast('Location permission permanently denied. Enable it in system settings.');
        return;
      }
      if (perm == LocationPermission.denied) {
        _toast('Location permission required to find nearby stores.');
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      provider.sortByDistance(pos.latitude, pos.longitude);
      _toast('Sorted by distance from your location.');
    } catch (e) {
      _toast("Couldn't get your location. Try again in a moment.");
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), duration: const Duration(seconds: 3)),
    );
  }

  String _headerLabel(int count, StoreProvider provider) {
    final upper = _q.toUpperCase().trim();
    final isPostcode = _postcodeRegex.hasMatch(upper);
    if (isPostcode) return '$count stores near $upper';
    if (provider.nearbyMode) return '$count stores nearby';
    if (_q.trim().isNotEmpty) return '$count stores matching "${_q.trim()}"';
    return '$count stores';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final provider = context.watch<StoreProvider>();
    final isFirstSelection = !provider.hasStore;
    final stores = _applyFilter(provider.all);

    final allCount = provider.all.length;
    final openCount = provider.all.where((s) => s.isOpen).length;
    final freeCount = provider.all.where((s) => s.defaultDeliveryFee == 0).length;

    return PopScope(
      canPop: !isFirstSelection,
      child: Scaffold(
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              if (!isFirstSelection)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(AppSpacing.base, 8, AppSpacing.base, 0),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: AnimatedPress(
                        onTap: () => Navigator.of(context).maybePop(),
                        child: Container(
                          height: 44,
                          width: 44,
                          decoration: BoxDecoration(
                            color: scheme.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: scheme.outlineVariant),
                          ),
                          child: Icon(Icons.arrow_back_rounded, size: 20, color: scheme.onSurface),
                        ),
                      ),
                    ),
                  ),
                ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isFirstSelection) ...[
                        _Eyebrow(label: 'ONBOARDING'),
                        const SizedBox(height: AppSpacing.md),
                      ],
                      RichText(
                        text: TextSpan(
                          style: theme.textTheme.displayMedium?.copyWith(
                            color: scheme.onSurface,
                            fontWeight: FontWeight.w800,
                          ),
                          children: [
                            const TextSpan(text: 'Choose your '),
                            TextSpan(
                              text: 'store.',
                              style: theme.textTheme.displayMedium?.copyWith(
                                color: scheme.primary,
                                fontWeight: FontWeight.w800,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      _InfoBanner(),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, AppSpacing.sm),
                  child: Text(
                    'SEARCH',
                    style: theme.textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.4,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: _SearchRow(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _q = v),
                    locating: _locating,
                    onNearMe: () => _onNearMe(provider),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.base),
                  child: SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                      children: [
                        _FilterChip(
                          label: 'All stores',
                          count: allCount,
                          selected: _filter == _Filter.all,
                          onTap: () => setState(() => _filter = _Filter.all),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Open now',
                          count: openCount,
                          selected: _filter == _Filter.openNow,
                          onTap: () => setState(() => _filter = _Filter.openNow),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Free delivery',
                          count: freeCount,
                          selected: _filter == _Filter.freeDelivery,
                          onTap: () => setState(() => _filter = _Filter.freeDelivery),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.sm),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _headerLabel(stores.length, provider),
                          style: theme.textTheme.titleSmall?.copyWith(color: scheme.onSurfaceVariant),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        provider.nearbyMode ? 'Sort: Nearest' : 'Sort: Default',
                        style: theme.textTheme.labelMedium?.copyWith(color: scheme.onSurface, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
              ..._buildListSlivers(theme, provider, stores, isFirstSelection),
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxxl)),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildListSlivers(
    ThemeData theme,
    StoreProvider provider,
    List<StoreLocation> stores,
    bool isFirstSelection,
  ) {
    if (provider.isLoading && provider.all.isEmpty) {
      return [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 0),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, __) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Skeleton(
                  height: 110,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                ),
              ),
              childCount: 3,
            ),
          ),
        ),
      ];
    }
    if (provider.error != null && provider.all.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: EmptyState(
            icon: Icons.cloud_off_rounded,
            title: "Couldn't load stores",
            message: provider.error!,
            action: PremiumButton(
              label: 'Retry',
              icon: Icons.refresh_rounded,
              onPressed: provider.refresh,
            ),
          ),
        ),
      ];
    }
    if (stores.isEmpty) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: EmptyState(
            icon: Icons.storefront_outlined,
            title: 'No stores found',
            message: 'Try a different filter, postcode, or check back soon.',
          ),
        ),
      ];
    }
    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 0),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, i) {
              final s = stores[i];
              final selected = !isFirstSelection && s.id == provider.selected!.id;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _StoreCard(
                  store: s,
                  selected: selected,
                  showDistance: provider.nearbyMode,
                  onTap: () async {
                    HapticFeedback.selectionClick();
                    final cart = context.read<CartProvider>();
                    final navigator = Navigator.of(context);
                    final switching =
                        !isFirstSelection && s.id != provider.selected!.id;
                    if (switching && cart.items.isNotEmpty) {
                      final confirmed = await _confirmStoreSwitch(context, s.name);
                      if (confirmed != true) return;
                      cart.clear();
                    }
                    provider.select(s);
                    if (isFirstSelection) {
                      navigator.pushReplacementNamed(AppRouter.shell);
                    } else {
                      navigator.pop();
                    }
                  },
                ),
              );
            },
            childCount: stores.length,
          ),
        ),
      ),
    ];
  }
}

// ──────────────────────────────────────────────────────────────────────
// Header bits
// ──────────────────────────────────────────────────────────────────────

Future<bool?> _confirmStoreSwitch(BuildContext context, String storeName) {
  final theme = Theme.of(context);
  return showDialog<bool>(
    context: context,
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          boxShadow: AppShadows.elevated(context),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Switch store?', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Your basket has items from your current store. '
              'Switching to $storeName will empty it.',
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: PremiumButton(
                    label: 'Keep current',
                    variant: PremiumButtonVariant.ghost,
                    onPressed: () => Navigator.of(ctx).pop(false),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: PremiumButton(
                    label: 'Switch & clear',
                    variant: PremiumButtonVariant.accent,
                    onPressed: () => Navigator.of(ctx).pop(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: scheme.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: scheme.primary,
              letterSpacing: 1.6,
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: scheme.outlineVariant),
      ),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: scheme.primary.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.place_rounded, color: scheme.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Pick where to shop from', style: theme.textTheme.titleMedium),
                Text(
                  'Pricing, delivery and stock are tied to your store.',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Search row with embedded Near me pill
// ──────────────────────────────────────────────────────────────────────

class _SearchRow extends StatelessWidget {
  const _SearchRow({
    required this.controller,
    required this.onChanged,
    required this.locating,
    required this.onNearMe,
  });
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final bool locating;
  final VoidCallback onNearMe;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: scheme.outlineVariant),
        boxShadow: AppShadows.soft(context),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              textInputAction: TextInputAction.search,
              style: theme.textTheme.bodyLarge,
              decoration: InputDecoration(
                hintText: 'Postcode or store name',
                hintStyle: theme.textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
                prefixIcon: Icon(Icons.search_rounded, color: scheme.onSurfaceVariant, size: 20),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          Container(
            height: 32,
            width: 1,
            color: scheme.outlineVariant,
          ),
          AnimatedPress(
            onTap: locating ? null : onNearMe,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (locating)
                    SizedBox(
                      height: 14,
                      width: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(scheme.primary),
                      ),
                    )
                  else
                    Icon(Icons.my_location_rounded, size: 16, color: scheme.primary),
                  const SizedBox(width: 6),
                  Text(
                    'Near me',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: scheme.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Filter chip with count badge
// ──────────────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return AnimatedPress(
      onTap: onTap,
      scale: 0.95,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? scheme.onSurface : scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
          border: Border.all(
            color: selected ? scheme.onSurface : scheme.outlineVariant,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: theme.textTheme.labelMedium?.copyWith(
                color: selected ? scheme.surface : scheme.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
              decoration: BoxDecoration(
                color: selected
                    ? scheme.surface.withValues(alpha: 0.18)
                    : scheme.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
              ),
              child: Text(
                '$count',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: selected ? scheme.surface : scheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Store card
// ──────────────────────────────────────────────────────────────────────

class _StoreCard extends StatelessWidget {
  const _StoreCard({
    required this.store,
    required this.selected,
    required this.showDistance,
    required this.onTap,
  });
  final StoreLocation store;
  final bool selected;
  final bool showDistance;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final distanceLabel = (showDistance && store.distanceMiles.isFinite)
        ? ' · ${store.distanceMiles.toStringAsFixed(1)} mi'
        : '';
    return AnimatedPress(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: selected ? scheme.primary : scheme.outlineVariant,
            width: selected ? 1.5 : 1,
          ),
          boxShadow: AppShadows.soft(context),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Icon w/ green check overlay when selected
            SizedBox(
              height: 56,
              width: 56,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    height: 56,
                    width: 56,
                    decoration: BoxDecoration(
                      color: AppColors.blue900,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 26),
                  ),
                  if (selected)
                    Positioned(
                      bottom: -4,
                      left: -4,
                      child: Container(
                        height: 20,
                        width: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.success,
                          border: Border.all(color: scheme.surface, width: 2),
                        ),
                        child: const Icon(Icons.check_rounded, color: Colors.white, size: 12),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            // Middle: name + address + chips
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    store.name,
                    style: theme.textTheme.titleMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${[store.address, store.city].where((s) => s.isNotEmpty).join(', ')}$distanceLabel',
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      _Pill(
                        icon: Icons.access_time_rounded,
                        label: store.isOpen ? 'Open · ${store.openUntil}' : 'Closed',
                        color: store.isOpen ? AppColors.success : AppColors.red500,
                      ),
                      _Pill(
                        icon: Icons.local_shipping_rounded,
                        label: store.defaultDeliveryFee == 0
                            ? 'Free delivery'
                            : 'Free ${formatGBP(store.freeDeliveryThreshold)}+',
                        color: AppColors.success,
                      ),
                      if (store.minOrderValue > 0)
                        _Pill(
                          icon: Icons.shopping_bag_outlined,
                          label: 'Min ${formatGBP(store.minOrderValue)}',
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Right: radio circle
            AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              height: 24,
              width: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? scheme.primary : Colors.transparent,
                border: Border.all(
                  color: selected ? scheme.primary : scheme.outline,
                  width: 1.6,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label, this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = color ?? theme.colorScheme.onSurfaceVariant;
    final bg = color != null
        ? color!.withValues(alpha: 0.10)
        : theme.colorScheme.surfaceContainerLow;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: c),
          const SizedBox(width: 4),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(color: c, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
