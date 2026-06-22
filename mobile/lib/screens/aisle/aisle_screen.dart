import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/product.dart';
import '../../state/store_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/product_list_tile.dart';
import '../../widgets/skeleton.dart';

class AisleScreen extends StatefulWidget {
  const AisleScreen({super.key, this.categoryId, this.title});
  final String? categoryId;
  final String? title;

  @override
  State<AisleScreen> createState() => _AisleScreenState();
}

class _AisleScreenState extends State<AisleScreen> {
  static const _pageSize = 24;
  final _scrollCtrl = ScrollController();
  final _searchCtrl = TextEditingController();
  Timer? _debounce;

  List<Product>? _products;
  String? _error;
  String _searchQuery = '';
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
    _debounce?.cancel();
    _searchCtrl.dispose();
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted && _searchQuery != query) {
        setState(() => _searchQuery = query);
        _load();
      }
    });
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
        search: _searchQuery,
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
        search: _searchQuery,
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final storeName = context.watch<StoreProvider>().selected?.name ?? 'Navalanka Super City';
    
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        titleSpacing: 0,
        title: Text(
          storeName.length > 30 ? '${storeName.substring(0, 30)}...' : storeName,
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w700, fontSize: 16),
        ),

      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search_rounded, color: theme.colorScheme.onSurfaceVariant, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchCtrl,
                        onChanged: _onSearchChanged,
                        decoration: InputDecoration(
                          hintText: 'Search in $storeName',
                          hintStyle: TextStyle(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontSize: 14,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                        style: TextStyle(
                          color: theme.colorScheme.onSurface,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),
            Expanded(child: _body()),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        itemCount: 6,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => Skeleton(
          height: 120,
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
    final products = _products ?? const [];
    if (products.isEmpty) {
      return const EmptyState(
        icon: Icons.inventory_2_outlined,
        title: 'Nothing here yet',
        message: 'Check back tomorrow for fresh stock.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: Theme.of(context).colorScheme.primary,
      child: ListView.separated(
        controller: _scrollCtrl,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: products.length + 1,
        separatorBuilder: (_, __) => const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
        itemBuilder: (_, i) {
          if (i == products.length) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
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
            );
          }
          return ProductListTile(product: products[i]);
        },
      ),
    );
  }
}
