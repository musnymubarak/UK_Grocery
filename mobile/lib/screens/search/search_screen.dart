import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/recent_searches.dart';
import '../../core/telemetry.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/category.dart';
import '../../data/models/product.dart';
import '../../state/store_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/premium_text_field.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, this.embedded = false, this.initialQuery});
  final bool embedded;

  /// Seed the search with a query (e.g. from a home-layout `search` action).
  final String? initialQuery;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _debounce;
  String _q = '';
  bool _loading = false;
  bool _loadingMore = false;
  bool _hasMore = true;
  String? _error;
  List<Product> _results = const [];
  List<Category>? _categories;

  static const _pageSize = 24;
  final _trending = const ['Avocado', 'Sourdough', 'Olive oil', 'Eggs', 'Salmon', 'Coffee'];

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    Api.instance.catalog.getCategories().then((cats) {
      if (mounted) setState(() => _categories = cats);
    }).catchError((_) {/* ignore — search keeps working */});
    RecentSearches.instance.hydrate().then((_) {
      if (mounted) setState(() {});
    });
    final seed = widget.initialQuery?.trim();
    if (seed != null && seed.isNotEmpty) {
      _ctrl.text = seed;
      WidgetsBinding.instance.addPostFrameCallback((_) => _onChanged(seed));
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
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

  void _onChanged(String v) {
    _debounce?.cancel();
    setState(() => _q = v);
    if (v.trim().isEmpty) {
      setState(() {
        _results = const [];
        _loading = false;
        _error = null;
        _hasMore = true;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 320), _runSearch);
  }

  Future<void> _runSearch() async {
    final term = _q.trim();
    if (term.isEmpty) return;
    final storeId = context.read<StoreProvider>().selected?.id;
    setState(() {
      _loading = true;
      _error = null;
      _hasMore = true;
    });
    try {
      final list = await Api.instance.catalog.getProducts(
        search: term,
        storeId: storeId,
        skip: 0,
        limit: _pageSize,
      );
      if (!mounted || _q.trim() != term) return;
      setState(() {
        _results = list;
        _loading = false;
        _hasMore = list.length >= _pageSize;
      });
      Telemetry.event('search_run', {'q': term, 'results': list.length});
      if (list.isNotEmpty) {
        await RecentSearches.instance.remember(term);
        if (mounted) setState(() {});
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Search failed';
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    final term = _q.trim();
    if (term.isEmpty) return;
    final storeId = context.read<StoreProvider>().selected?.id;
    setState(() => _loadingMore = true);
    try {
      final next = await Api.instance.catalog.getProducts(
        search: term,
        storeId: storeId,
        skip: _results.length,
        limit: _pageSize,
      );
      if (!mounted || _q.trim() != term) return;
      setState(() {
        _results = [..._results, ...next];
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
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!widget.embedded) const PremiumAppBar(title: 'Search'),
            if (widget.embedded)
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, 0),
                child: Text('Search', style: theme.textTheme.displaySmall),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 0),
              child: PremiumTextField(
                label: 'What are you craving?',
                hint: 'Try “sourdough” or “olive oil”',
                icon: Icons.search_rounded,
                controller: _ctrl,
                autofocus: !widget.embedded,
                onChanged: _onChanged,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Expanded(child: _body(theme)),
          ],
        ),
      ),
    );
  }

  Widget _body(ThemeData theme) {
    if (_q.trim().isEmpty) return _idleSuggestions(theme);
    if (_loading) {
      return GridView.builder(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.xxxl),
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
        title: 'Search unavailable',
        message: _error!,
        action: PremiumButton(
          label: 'Retry',
          icon: Icons.refresh_rounded,
          onPressed: _runSearch,
        ),
      );
    }
    if (_results.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No matches',
        message: 'Try a different word or check our trending searches.',
      );
    }
    return RefreshIndicator(
      onRefresh: _runSearch,
      color: theme.colorScheme.primary,
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
                (_, i) => ProductCard(product: _results[i]),
                childCount: _results.length,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xxxl),
              child: Center(
                child: _loadingMore
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : !_hasMore && _results.length > _pageSize
                        ? Text(
                            'End of results',
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

  Widget _idleSuggestions(ThemeData theme) {
    final cats = _categories ?? const <Category>[];
    final recent = RecentSearches.instance.items;
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(0, 0, 0, AppSpacing.xxl),
      children: [
        if (recent.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              children: [
                Expanded(
                  child: Text('Recent searches', style: theme.textTheme.titleSmall),
                ),
                TextButton(
                  onPressed: () async {
                    await RecentSearches.instance.clear();
                    if (mounted) setState(() {});
                  },
                  style: TextButton.styleFrom(
                    minimumSize: const Size(0, 32),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  child: const Text('Clear'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: recent
                  .map(
                    (t) => GestureDetector(
                      onTap: () {
                        _ctrl.text = t;
                        _onChanged(t);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.history_rounded, size: 14, color: theme.colorScheme.onSurfaceVariant),
                            const SizedBox(width: 6),
                            Text(
                              t,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Text('Trending searches', style: theme.textTheme.titleSmall),
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _trending
                .map(
                  (t) => GestureDetector(
                    onTap: () {
                      _ctrl.text = t;
                      _onChanged(t);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                        border: Border.all(color: theme.colorScheme.outlineVariant),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.trending_up_rounded, size: 14, color: theme.colorScheme.primary),
                          const SizedBox(width: 6),
                          Text(t, style: theme.textTheme.labelMedium),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        if (cats.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xl),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Text('Popular categories', style: theme.textTheme.titleSmall),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              itemCount: cats.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final c = cats[i];
                return GestureDetector(
                  onTap: () {
                    _ctrl.text = c.name;
                    _onChanged(c.name);
                  },
                  child: Container(
                    width: 130,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: c.colorA,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(c.icon, color: Colors.white),
                        Text(
                          c.name,
                          style: theme.textTheme.titleSmall?.copyWith(color: Colors.white),
                          maxLines: 2,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}
