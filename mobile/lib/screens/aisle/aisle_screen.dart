import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/product.dart';
import '../../state/store_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton.dart';

class AisleScreen extends StatefulWidget {
  const AisleScreen({super.key, this.categoryId, this.title});
  final String? categoryId;
  final String? title;

  @override
  State<AisleScreen> createState() => _AisleScreenState();
}

class _AisleScreenState extends State<AisleScreen> {
  String _sort = 'Popular';
  final _filters = const ['All', 'On offer'];
  String _active = 'All';

  static const _pageSize = 24;
  final _scrollCtrl = ScrollController();

  List<Product>? _products;
  String? _error;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_loadingMore || !_hasMore || _loading) return;
    final pos = _scrollCtrl.position;
    if (pos.pixels >= pos.maxScrollExtent - 600) {
      _loadMore();
    }
  }

  /// Initial / pull-to-refresh load — clears the buffer and fetches page 1.
  Future<void> _load() async {
    final storeId = context.read<StoreProvider>().selected?.id;
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
      _hasMore = true;
    });
    try {
      final list = await Api.instance.catalog.getProducts(
        categoryId: widget.categoryId,
        storeId: storeId,
        skip: 0,
        limit: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        _products = list;
        _loading = false;
        _hasMore = list.length >= _pageSize;
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
        _error = "Couldn't load products.";
        _loading = false;
      });
    }
  }

  /// Appends the next page of products. No-op if a fetch is already in
  /// flight or the previous page returned fewer than [_pageSize] items.
  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _products == null) return;
    final storeId = context.read<StoreProvider>().selected?.id;
    setState(() => _loadingMore = true);
    try {
      final next = await Api.instance.catalog.getProducts(
        categoryId: widget.categoryId,
        storeId: storeId,
        skip: _products!.length,
        limit: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        _products = [..._products!, ...next];
        _hasMore = next.length >= _pageSize;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
    }
  }

  List<Product> get _filtered {
    final all = _products ?? const <Product>[];
    if (_active == 'On offer') return all.where((p) => p.hasPromo).toList();
    return all;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            PremiumAppBar(
              title: widget.title ?? 'Aisle',
              actions: const [
                CircleIconButton(icon: Icons.search_rounded),
                CircleIconButton(icon: Icons.tune_rounded),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      _loading ? 'Loading…' : '${_filtered.length} items',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _openSort,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainer,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        border: Border.all(color: theme.colorScheme.outlineVariant),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.swap_vert_rounded, size: 16),
                          const SizedBox(width: 6),
                          Text(_sort, style: theme.textTheme.labelMedium),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 6),
                itemBuilder: (_, i) {
                  final f = _filters[i];
                  final selected = f == _active;
                  return GestureDetector(
                    onTap: () => setState(() => _active = f),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: selected ? theme.colorScheme.primary : theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        border: Border.all(
                          color: selected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          f,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: selected ? Colors.white : theme.colorScheme.onSurface,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  );
                },
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemCount: _filters.length,
              ),
            ),
            const SizedBox(height: 4),
            Expanded(child: _body()),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return GridView.builder(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.xxl),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.66,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => Skeleton(
          height: 240,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      );
    }
    if (_error != null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load this aisle",
        message: _error!,
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }
    final products = _filtered;
    if (products.isEmpty) {
      return const EmptyState(
        icon: Icons.inventory_2_outlined,
        title: 'Nothing here yet',
        message: 'Try a different filter or check back tomorrow for fresh stock.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: Theme.of(context).colorScheme.primary,
      child: CustomScrollView(
        controller: _scrollCtrl,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
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
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xxl),
              child: Center(
                child: _loadingMore
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : !_hasMore && products.length > _pageSize
                        ? Text(
                            "You've reached the end",
                            style: Theme.of(context).textTheme.bodySmall,
                          )
                        : const SizedBox.shrink(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openSort() {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) {
        final options = ['Popular', 'Price: low to high', 'Price: high to low', 'Newest'];
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sort by', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                ...options.map(
                  (o) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(o),
                    trailing: _sort == o
                        ? Icon(Icons.check_rounded, color: Theme.of(context).colorScheme.primary)
                        : null,
                    onTap: () {
                      setState(() => _sort = o);
                      Navigator.of(context).pop();
                    },
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }
}
