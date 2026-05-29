import 'package:flutter/material.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/order.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

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
    // Tracking is time-sensitive — refresh quietly when returning to the app.
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
      ('Delivered', 'Enjoy!', Icons.home_rounded),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const PremiumAppBar(title: 'Live tracking'),
            Expanded(child: _body()),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    final theme = Theme.of(context);
    if (_loading) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
        children: [
          Skeleton(height: 240, borderRadius: BorderRadius.circular(AppSpacing.radiusXl)),
          const SizedBox(height: AppSpacing.xl),
          Skeleton(height: 90, borderRadius: BorderRadius.circular(AppSpacing.radiusLg)),
          const SizedBox(height: AppSpacing.xl),
          for (int i = 0; i < 4; i++) ...[
            Skeleton(height: 60, borderRadius: BorderRadius.circular(8)),
            const SizedBox(height: 12),
          ],
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
    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        children: [
        Stack(
          children: [
            Container(
              height: 240,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.blue500, AppColors.blue800],
                ),
                boxShadow: AppShadows.glowBlue(),
              ),
              child: Stack(
                children: [
                  CustomPaint(size: Size.infinite, painter: _MapGridPainter(theme.colorScheme.primary)),
                  AnimatedBuilder(
                    animation: _pulse,
                    builder: (_, __) {
                      final t = _pulse.value;
                      return Center(
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              height: 120 * t,
                              width: 120 * t,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.18 * (1 - t)),
                              ),
                            ),
                            Container(
                              height: 64,
                              width: 64,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.red500.withValues(alpha: 0.5),
                                    blurRadius: 30,
                                    spreadRadius: -2,
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.electric_moped_rounded, color: AppColors.red500, size: 30),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            Positioned(
              left: 12,
              top: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      height: 8,
                      width: 8,
                      decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.greenAccent),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      order.status.label.toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(color: theme.colorScheme.outlineVariant),
            boxShadow: AppShadows.soft(context),
          ),
          child: Row(
            children: [
              Container(
                height: 56,
                width: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.red500, AppColors.red700],
                  ),
                  boxShadow: AppShadows.glowRed(),
                ),
                child: const Icon(Icons.receipt_long_rounded, color: Colors.white),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order #${order.orderNumber}', style: theme.textTheme.titleLarge),
                    Text(
                      '${order.itemCount} items · ${formatGBP(order.total)}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Text('Progress', style: theme.textTheme.titleLarge),
        const SizedBox(height: AppSpacing.md),
        ...List.generate(steps.length, (i) {
          final last = i == steps.length - 1;
          return _Timeline(step: steps[i], isLast: last);
        }),
        const SizedBox(height: AppSpacing.xl),
        PremiumButton(
          label: 'Need help with this order?',
          icon: Icons.support_agent_rounded,
          variant: PremiumButtonVariant.ghost,
          expand: true,
          onPressed: () {},
        ),
      ],
      ),
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
        ? AppColors.red500
        : (step.done ? AppColors.success : theme.colorScheme.outlineVariant);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            children: [
              Container(
                height: 36,
                width: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: step.done || step.current ? accent : theme.colorScheme.surfaceContainerHigh,
                  boxShadow: step.current
                      ? [
                          BoxShadow(
                            color: AppColors.red500.withValues(alpha: 0.45),
                            blurRadius: 20,
                            spreadRadius: -2,
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  step.done ? Icons.check_rounded : step.icon,
                  size: 18,
                  color: step.done || step.current ? Colors.white : theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (!isLast)
                Expanded(child: Container(width: 2, color: theme.colorScheme.outlineVariant)),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: step.done || step.current
                          ? theme.colorScheme.onSurface
                          : theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(step.detail, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  const _MapGridPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 1;
    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), p);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), p);
    }
    final route = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(20, size.height - 30)
      ..cubicTo(size.width * 0.4, size.height - 20, size.width * 0.3, size.height * 0.3, size.width * 0.55, size.height * 0.45)
      ..cubicTo(size.width * 0.7, size.height * 0.55, size.width * 0.7, size.height * 0.4, size.width * 0.85, 40);
    canvas.drawPath(path, route);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
