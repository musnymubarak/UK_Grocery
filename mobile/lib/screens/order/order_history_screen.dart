import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/order.dart';
import '../../state/auth_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';
import '../../widgets/status_badge.dart';

enum _OrderFilter { all, active, delivered, cancelled }

extension _OrderFilterX on _OrderFilter {
  String get label => switch (this) {
        _OrderFilter.all => 'All',
        _OrderFilter.active => 'In Progress',
        _OrderFilter.delivered => 'Delivered',
        _OrderFilter.cancelled => 'Cancelled',
      };
}

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  List<OrderSummary>? _orders;
  bool _loading = true;
  String? _error;
  _OrderFilter _selectedFilter = _OrderFilter.all;
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!context.read<AuthProvider>().isAuthenticated) {
      setState(() {
        _loading = false;
        _orders = const [];
        _error = null;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await Api.instance.orders.myOrders();
      if (!mounted) return;
      setState(() {
        _orders = list;
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
        _error = "Couldn't load your orders";
        _loading = false;
      });
    }
  }

  bool _isActive(OrderStatus status) {
    return status == OrderStatus.placed ||
        status == OrderStatus.confirmed ||
        status == OrderStatus.picking ||
        status == OrderStatus.dispatched;
  }

  List<OrderSummary> _filterOrders(List<OrderSummary> list) {
    var filtered = list;
    switch (_selectedFilter) {
      case _OrderFilter.all:
        break;
      case _OrderFilter.active:
        filtered = filtered.where((o) => _isActive(o.status)).toList();
        break;
      case _OrderFilter.delivered:
        filtered = filtered.where((o) => o.status == OrderStatus.delivered).toList();
        break;
      case _OrderFilter.cancelled:
        filtered = filtered.where((o) => o.status == OrderStatus.cancelled).toList();
        break;
    }

    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      filtered = filtered.where((o) {
        if (o.orderNumber.toLowerCase().contains(q)) return true;
        for (final line in o.lines) {
          if (line.nameOrFallback.toLowerCase().contains(q)) return true;
        }
        return false;
      }).toList();
    }

    return filtered;
  }

  int _countForFilter(_OrderFilter filter, List<OrderSummary> list) {
    switch (filter) {
      case _OrderFilter.all:
        return list.length;
      case _OrderFilter.active:
        return list.where((o) => _isActive(o.status)).length;
      case _OrderFilter.delivered:
        return list.where((o) => o.status == OrderStatus.delivered).length;
      case _OrderFilter.cancelled:
        return list.where((o) => o.status == OrderStatus.cancelled).length;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            const PremiumAppBar(title: 'Your orders'),
            if (auth.isAuthenticated && _orders != null && _orders!.isNotEmpty)
              _buildFilterAndSearchSection(),
            Expanded(child: _body(auth)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterAndSearchSection() {
    final allOrders = _orders ?? const [];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 12),
      child: Column(
        children: [
          // Search input for orders
          Container(
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                    decoration: InputDecoration(
                      filled: false,
                      fillColor: Colors.transparent,
                      hintText: 'Search by order # or item name...',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 16, color: Color(0xFF94A3B8)),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Filter Segment Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _OrderFilter.values.map((f) {
                final count = _countForFilter(f, allOrders);
                final isSelected = _selectedFilter == f;

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: AnimatedPress(
                    onTap: () => setState(() => _selectedFilter = f),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF001D3D) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF001D3D) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            f.label,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected ? Colors.white : const Color(0xFF475569),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.2)
                                  : const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$count',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? Colors.white : const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _body(AuthProvider auth) {
    if (!auth.isAuthenticated) {
      return EmptyState(
        icon: Icons.login_rounded,
        title: 'Sign in to see your orders',
        message: 'Your order history syncs across every device once you sign in.',
        action: PremiumButton(
          label: 'Sign in',
          icon: Icons.login_rounded,
          onPressed: () => Navigator.of(context).pushNamed(AppRouter.login),
        ),
      );
    }
    if (_loading) {
      return ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 16, AppSpacing.lg, AppSpacing.xxl),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (_, __) => Skeleton(
          height: 180,
          borderRadius: BorderRadius.circular(16),
        ),
      );
    }
    if (_error != null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load orders",
        message: _error!,
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }
    final allOrders = _orders ?? const <OrderSummary>[];
    if (allOrders.isEmpty) {
      return const EmptyState(
        icon: Icons.receipt_long_rounded,
        title: 'No past orders yet',
        message: "When you place your first order, you'll find it tracked live right here.",
      );
    }

    final filtered = _filterOrders(allOrders);
    if (filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.filter_list_off_rounded, size: 28, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 16),
              const Text(
                'No orders match this filter',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 6),
              const Text(
                'Try selecting a different filter or clearing your search.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () {
                  setState(() {
                    _selectedFilter = _OrderFilter.all;
                    _searchQuery = '';
                    _searchCtrl.clear();
                  });
                },
                child: const Text('Reset filters'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.blue600,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 16, AppSpacing.lg, AppSpacing.xxl),
        itemBuilder: (_, i) => _OrderCard(order: filtered[i]),
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemCount: filtered.length,
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});
  final OrderSummary order;

  String _formatDate(DateTime t) {
    final now = DateTime.now();
    final d = now.difference(t);
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    if (d.inDays < 7) return '${d.inDays}d ago';
    return '${t.day}/${t.month}/${t.year}';
  }

  bool get _isActive =>
      order.status == OrderStatus.placed ||
      order.status == OrderStatus.confirmed ||
      order.status == OrderStatus.picking ||
      order.status == OrderStatus.dispatched;

  @override
  Widget build(BuildContext context) {
    return AnimatedPress(
      onTap: () => Navigator.of(context).pushNamed(
        AppRouter.orderTracking,
        arguments: {'id': order.id},
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isActive
                ? const Color(0xFF0056B3).withValues(alpha: 0.35)
                : const Color(0xFFE2E8F0),
            width: _isActive ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Section: Icon, Order # and Status Badge
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: _isActive
                              ? const Color(0xFF0056B3).withValues(alpha: 0.1)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          _isActive ? Icons.local_shipping_rounded : Icons.receipt_long_rounded,
                          size: 20,
                          color: _isActive ? const Color(0xFF0056B3) : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Order #${order.orderNumber}',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${order.itemCount} items · ${_formatDate(order.placedAt)}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      StatusBadge(status: order.status),
                    ],
                  ),

                  // Item preview snippets if available
                  if (order.lines.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFEDF2F7)),
                      ),
                      child: Text(
                        order.lines.take(2).map((l) => '${l.nameOrFallback} × ${l.qty}').join(', ') +
                            (order.lines.length > 2 ? ' + ${order.lines.length - 2} more' : ''),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF475569),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],

                  // Active Order Banner Highlight
                  if (_isActive) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF2563EB),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'In progress · Tap to view live tracking',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1D4ED8),
                              ),
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF1D4ED8)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const Divider(height: 1, color: Color(0xFFF1F5F9)),

            // Bottom Section: Total Price & Action Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total paid',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatGBP(order.total),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF001D3D),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _isActive ? const Color(0xFF001D3D) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _isActive ? 'Track Live' : 'Details',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: _isActive ? Colors.white : const Color(0xFF334155),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 16,
                          color: _isActive ? Colors.white : const Color(0xFF334155),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
