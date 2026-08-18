import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/order.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';
import '../../widgets/status_badge.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key, required this.orderId});
  final String orderId;

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  )..repeat();

  OrderSummary? _order;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pulse.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _order != null) {
      _load(silent: true);
    }
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final order = await Api.instance.orders.getOrder(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = order;
        _error = null;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (_order == null) _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (_order == null) _error = "Couldn't load this order";
      });
    }
  }

  List<_Step> _stepsFor(OrderStatus status) {
    int activeIdx;
    switch (status) {
      case OrderStatus.placed:
        activeIdx = 0;
        break;
      case OrderStatus.confirmed:
      case OrderStatus.picking:
        activeIdx = 1;
        break;
      case OrderStatus.dispatched:
        activeIdx = 2;
        break;
      case OrderStatus.delivered:
        activeIdx = 3;
        break;
      case OrderStatus.cancelled:
        activeIdx = -1;
        break;
    }
    final raw = [
      ('Order placed', 'Confirmed by the store', Icons.check_rounded),
      ('Picking your items', 'Selected at your store', Icons.shopping_basket_rounded),
      ('Out for delivery', 'On its way to you', Icons.electric_moped_rounded),
      ('Delivered', 'Enjoy your groceries!', Icons.home_rounded),
    ];
    return [
      for (var i = 0; i < raw.length; i++)
        _Step(
          label: raw[i].$1,
          detail: raw[i].$2,
          icon: raw[i].$3,
          done: activeIdx > i || status == OrderStatus.delivered,
          current: activeIdx == i && status != OrderStatus.delivered,
        ),
    ];
  }

  String _formatDateTime(DateTime t) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hour = t.hour > 12 ? t.hour - 12 : (t.hour == 0 ? 12 : t.hour);
    final minute = t.minute.toString().padLeft(2, '0');
    final period = t.hour >= 12 ? 'PM' : 'AM';
    return '${t.day} ${months[t.month - 1]} ${t.year} at $hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            const PremiumAppBar(title: 'Order Details'),
            Expanded(child: _body()),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Skeleton(height: 180, borderRadius: BorderRadius.circular(16)),
          const SizedBox(height: 16),
          Skeleton(height: 220, borderRadius: BorderRadius.circular(16)),
          const SizedBox(height: 16),
          Skeleton(height: 180, borderRadius: BorderRadius.circular(16)),
        ],
      );
    }
    if (_error != null || _order == null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load order",
        message: _error ?? 'Try again in a moment.',
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }

    final order = _order!;
    final steps = _stepsFor(order.status);
    final isDelivered = order.status == OrderStatus.delivered;
    final isCancelled = order.status == OrderStatus.cancelled;
    final isActive = !isDelivered && !isCancelled;

    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      color: AppColors.blue600,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        children: [
          // 1. Order Summary & Status Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isActive
                            ? const Color(0xFF0056B3).withValues(alpha: 0.1)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isActive ? Icons.electric_moped_rounded : (isDelivered ? Icons.check_circle_rounded : Icons.receipt_long_rounded),
                        size: 24,
                        color: isActive ? const Color(0xFF0056B3) : (isDelivered ? AppColors.success : const Color(0xFF64748B)),
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
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatDateTime(order.placedAt),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    StatusBadge(status: order.status),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2. Status Tracking Timeline (if active or progress tracked)
          if (!isCancelled) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Order Status',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(steps.length, (i) {
                    final last = i == steps.length - 1;
                    return _Timeline(step: steps[i], isLast: last);
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // 3. Ordered Items Breakdown
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Ordered Items',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${order.itemCount} items',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // List of items
                if (order.lines.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'No item details available.',
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                    ),
                  )
                else
                  ...order.lines.map((line) => _buildOrderItemRow(line)),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 4. Delivery Address Details (if present)
          if (order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.location_on_rounded, size: 18, color: Color(0xFF0056B3)),
                      SizedBox(width: 8),
                      Text(
                        'Delivery Address',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    order.deliveryAddress!,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF334155),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (order.deliveryPostcode != null && order.deliveryPostcode!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      order.deliveryPostcode!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  if (order.notes != null && order.notes!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Note: ${order.notes}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // 5. Payment & Cost Summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Payment Summary',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 12),
                _priceRow('Subtotal', formatGBP(order.subtotal)),
                const SizedBox(height: 8),
                _priceRow('Delivery Fee', order.deliveryFee > 0 ? formatGBP(order.deliveryFee) : 'Free'),
                if (order.serviceFee > 0) ...[
                  const SizedBox(height: 8),
                  _priceRow('Service Fee', formatGBP(order.serviceFee)),
                ],
                if (order.tip > 0) ...[
                  const SizedBox(height: 8),
                  _priceRow('Driver Tip', formatGBP(order.tip)),
                ],
                if (order.discount > 0) ...[
                  const SizedBox(height: 8),
                  _priceRow('Discount', '-${formatGBP(order.discount)}', isDiscount: true),
                ],
                const SizedBox(height: 12),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text(
                      'Total Paid',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      formatGBP(order.total),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF001D3D),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      order.paymentMethod.toLowerCase() == 'cod' ? Icons.money_rounded : Icons.credit_card_rounded,
                      size: 14,
                      color: const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      order.paymentMethod.toLowerCase() == 'cod' ? 'Cash on Delivery' : 'Paid Online (Card)',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Help / Support
          PremiumButton(
            label: 'Need help with this order?',
            icon: Icons.support_agent_rounded,
            variant: PremiumButtonVariant.ghost,
            expand: true,
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Support team is ready to assist you.')),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItemRow(OrderLine line) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Product Thumbnail
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFEDF2F7)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: line.productImageUrl != null && line.productImageUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: line.productImageUrl!,
                      fit: BoxFit.contain,
                      placeholder: (_, __) => const Center(
                        child: SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                      errorWidget: (_, __, ___) => const Icon(
                        Icons.shopping_basket_outlined,
                        size: 22,
                        color: Color(0xFF94A3B8),
                      ),
                    )
                  : const Icon(
                      Icons.shopping_basket_outlined,
                      size: 22,
                      color: Color(0xFF94A3B8),
                    ),
            ),
          ),
          const SizedBox(width: 12),

          // Title & Qty
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  line.nameOrFallback,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  line.unitPrice != null
                      ? 'Qty: ${line.qty} × ${formatGBP(line.unitPrice!)}'
                      : 'Qty: ${line.qty}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // Total Price for this line
          Text(
            formatGBP(line.subtotal),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _priceRow(String label, String value, {bool isDiscount = false}) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w500,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            color: isDiscount ? AppColors.success : const Color(0xFF0F172A),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _Step {
  const _Step({
    required this.label,
    required this.detail,
    required this.icon,
    this.done = false,
    this.current = false,
  });
  final String label;
  final String detail;
  final IconData icon;
  final bool done;
  final bool current;
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.step, required this.isLast});
  final _Step step;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = step.current
        ? const Color(0xFF0056B3)
        : (step.done ? AppColors.success : theme.colorScheme.outlineVariant);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            children: [
              Container(
                height: 32,
                width: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: step.done || step.current ? accent : const Color(0xFFF1F5F9),
                ),
                child: Icon(
                  step.done ? Icons.check_rounded : step.icon,
                  size: 16,
                  color: step.done || step.current ? Colors.white : const Color(0xFF94A3B8),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: step.done ? AppColors.success.withValues(alpha: 0.5) : const Color(0xFFE2E8F0),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: step.done || step.current
                          ? const Color(0xFF0F172A)
                          : const Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    step.detail,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
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
