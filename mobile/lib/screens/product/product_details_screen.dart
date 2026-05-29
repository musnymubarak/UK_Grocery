import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/product.dart';
import '../../state/cart_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton.dart';

class ProductDetailsScreen extends StatefulWidget {
  const ProductDetailsScreen({super.key, required this.productId});
  final String productId;

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  Product? _p;
  List<Product> _related = const [];
  String? _error;
  bool _loading = true;
  int _qty = 1;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final storeId = context.read<StoreProvider>().selected?.id;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final product = await Api.instance.catalog.getProduct(widget.productId);
      List<Product> related = const [];
      if (product.categoryId.isNotEmpty) {
        try {
          final list = await Api.instance.catalog.getProducts(
            categoryId: product.categoryId,
            storeId: storeId,
            limit: 8,
          );
          related = list.where((p) => p.id != product.id).take(6).toList();
        } catch (_) {/* non-fatal — keep details usable */}
      }
      if (!mounted) return;
      setState(() {
        _p = product;
        _related = related;
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
        _error = "Couldn't load this product";
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return _loadingScaffold();
    if (_error != null || _p == null) {
      return Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: AnimatedPress(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      height: 44,
                      width: 44,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                      ),
                      child: const Icon(Icons.arrow_back_rounded, size: 20),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: EmptyState(
                  icon: Icons.cloud_off_rounded,
                  title: "Couldn't load product",
                  message: _error ?? 'Try again in a moment.',
                  action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
                ),
              ),
            ],
          ),
        ),
      );
    }
    return _detailScaffold(_p!);
  }

  Widget _loadingScaffold() {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),
            Skeleton(height: 320, width: double.infinity, borderRadius: BorderRadius.circular(0)),
            const SizedBox(height: AppSpacing.lg),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Skeleton(height: 30, width: 200, borderRadius: BorderRadius.circular(8)),
                  const SizedBox(height: 12),
                  Skeleton(height: 18, width: 120, borderRadius: BorderRadius.circular(8)),
                  const SizedBox(height: 18),
                  Skeleton(height: 60, width: double.infinity, borderRadius: BorderRadius.circular(8)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailScaffold(Product p) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final cart = context.watch<CartProvider>();
    final inCart = cart.qtyOf(p.id);

    return Scaffold(
      backgroundColor: scheme.surface,
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: 380,
                pinned: true,
                stretch: true,
                backgroundColor: scheme.surface,
                surfaceTintColor: Colors.transparent,
                leadingWidth: 64,
                leading: Padding(
                  padding: const EdgeInsets.only(left: AppSpacing.md, top: 8),
                  child: AnimatedPress(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      height: 44,
                      width: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.85),
                        shape: BoxShape.circle,
                        boxShadow: AppShadows.soft(context),
                      ),
                      child: Icon(Icons.arrow_back_rounded, color: scheme.onSurface, size: 20),
                    ),
                  ),
                ),
                actions: [
                  Padding(
                    padding: const EdgeInsets.only(right: AppSpacing.md, top: 8),
                    child: AnimatedPress(
                      onTap: () {},
                      child: Container(
                        height: 44,
                        width: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                          boxShadow: AppShadows.soft(context),
                        ),
                        child: Icon(Icons.favorite_border_rounded, color: scheme.onSurface, size: 20),
                      ),
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  collapseMode: CollapseMode.parallax,
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [p.colorA, p.colorB],
                          ),
                        ),
                      ),
                      Positioned(
                        right: -60,
                        top: -40,
                        child: Container(
                          height: 200,
                          width: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.18),
                          ),
                        ),
                      ),
                      Positioned(
                        left: -40,
                        bottom: -60,
                        child: Container(
                          height: 220,
                          width: 220,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.10),
                          ),
                        ),
                      ),
                      Center(
                        child: SizedBox(
                          width: 220,
                          height: 220,
                          child: Icon(p.icon, size: 160, color: Colors.white.withValues(alpha: 0.95)),
                        ),
                      ),
                      Align(
                        alignment: Alignment.bottomLeft,
                        child: Padding(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.22),
                              borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                                const SizedBox(width: 4),
                                Text(
                                  '${p.rating}  ·  ${p.reviewCount} reviews',
                                  style: theme.textTheme.labelSmall?.copyWith(color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Container(
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXxl)),
                  ),
                  transform: Matrix4.translationValues(0, -28, 0),
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: scheme.primary.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                            ),
                            child: Text(
                              p.tag,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: scheme.primary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(p.unit, style: theme.textTheme.bodySmall),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(p.name, style: theme.textTheme.displaySmall),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            formatGBP(p.effectivePrice),
                            style: theme.textTheme.displaySmall?.copyWith(
                              color: scheme.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          if (p.hasPromo) ...[
                            const SizedBox(width: 10),
                            Text(
                              formatGBP(p.price),
                              style: theme.textTheme.titleMedium?.copyWith(
                                decoration: TextDecoration.lineThrough,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      if (p.description.isNotEmpty) Text(p.description, style: theme.textTheme.bodyLarge),
                      const SizedBox(height: AppSpacing.xl),
                      _InfoGrid(product: p),
                      const SizedBox(height: AppSpacing.xl),
                      if (_related.isNotEmpty) ...[
                        Text('You may also like', style: theme.textTheme.headlineSmall),
                        const SizedBox(height: AppSpacing.md),
                        SizedBox(
                          height: 280,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _related.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (_, i) =>
                                SizedBox(width: 180, child: ProductCard(product: _related[i])),
                          ),
                        ),
                      ],
                      const SizedBox(height: 140),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.base),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                    border: Border.all(color: scheme.outlineVariant),
                    boxShadow: AppShadows.elevated(context),
                  ),
                  child: Row(
                    children: [
                      _QtyStepper(
                        qty: _qty,
                        onMinus: () => setState(() => _qty = (_qty - 1).clamp(1, 99)),
                        onPlus: () => setState(() => _qty = (_qty + 1).clamp(1, 99)),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: PremiumButton(
                          variant: PremiumButtonVariant.accent,
                          label: inCart > 0
                              ? 'View cart · ${formatGBP(p.effectivePrice * _qty)}'
                              : 'Add to cart · ${formatGBP(p.effectivePrice * _qty)}',
                          icon: Icons.shopping_bag_rounded,
                          expand: true,
                          onPressed: () {
                            if (inCart > 0) {
                              Navigator.of(context).pushNamed(AppRouter.shell);
                              return;
                            }
                            for (var i = 0; i < _qty; i++) {
                              context.read<CartProvider>().add(p);
                            }
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${p.name} added to cart'),
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyStepper extends StatelessWidget {
  const _QtyStepper({required this.qty, required this.onMinus, required this.onPlus});
  final int qty;
  final VoidCallback onMinus;
  final VoidCallback onPlus;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _round(onTap: onMinus, icon: Icons.remove_rounded),
          SizedBox(
            width: 28,
            child: Text(
              '$qty',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          _round(onTap: onPlus, icon: Icons.add_rounded),
        ],
      ),
    );
  }

  Widget _round({required VoidCallback onTap, required IconData icon}) => AnimatedPress(
        onTap: onTap,
        child: Container(
          height: 36,
          width: 36,
          alignment: Alignment.center,
          decoration: const BoxDecoration(shape: BoxShape.circle),
          child: Icon(icon, size: 18),
        ),
      );
}

class _InfoGrid extends StatelessWidget {
  const _InfoGrid({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final items = [
      const _InfoItem(icon: Icons.electric_moped_rounded, label: 'Delivery', value: 'In 30 min'),
      const _InfoItem(icon: Icons.verified_rounded, label: 'Quality', value: 'Hand-picked'),
      const _InfoItem(icon: Icons.shield_rounded, label: 'Returns', value: 'Free in 24h'),
      _InfoItem(
        icon: Icons.warning_amber_rounded,
        label: 'Allergens',
        value: product.allergens.isEmpty ? 'None' : product.allergens.join(', '),
      ),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 2.7,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final it = items[i];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: t.colorScheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: t.colorScheme.outlineVariant),
          ),
          child: Row(
            children: [
              Container(
                height: 36,
                width: 36,
                decoration: BoxDecoration(
                  color: t.colorScheme.primary.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(it.icon, color: t.colorScheme.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(it.label, style: t.textTheme.labelSmall),
                    Text(it.value, style: t.textTheme.titleSmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _InfoItem {
  const _InfoItem({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;
}
