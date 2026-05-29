import 'package:flutter/material.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/premium_button.dart';

class OrderSuccessScreen extends StatefulWidget {
  const OrderSuccessScreen({super.key, required this.orderId});
  final String orderId;

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            // Confetti-ish floating circles
            for (int i = 0; i < 16; i++)
              AnimatedBuilder(
                animation: _c,
                builder: (_, __) {
                  final t = _c.value;
                  final phase = (i * 0.27) % 1.0;
                  final dx = MediaQuery.of(context).size.width * (0.05 + (i * 0.12 % 0.9));
                  final dy = -40 + 600 * ((t + phase) % 1.0);
                  final size = 6.0 + (i % 4) * 4;
                  return Positioned(
                    left: dx,
                    top: dy,
                    child: Opacity(
                      opacity: 0.6 - (i % 4) * 0.1,
                      child: Container(
                        height: size,
                        width: size,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: i.isEven ? AppColors.red500 : AppColors.blue500,
                        ),
                      ),
                    ),
                  );
                },
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                children: [
                  const Spacer(),
                  ScaleTransition(
                    scale: CurvedAnimation(parent: _c, curve: Curves.easeOutBack),
                    child: Container(
                      height: 140,
                      width: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppColors.blue500, AppColors.blue800],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.blue500.withValues(alpha: 0.4),
                            blurRadius: 60,
                            spreadRadius: -8,
                            offset: const Offset(0, 28),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.check_rounded, color: Colors.white, size: 72),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'Order placed!',
                    style: theme.textTheme.displaySmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Order #${widget.orderId} is on its way.\nWe\'ll keep you posted in real time.',
                    style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    textAlign: TextAlign.center,
                  ),
                  const Spacer(),
                  PremiumButton(
                    label: 'Track your order',
                    icon: Icons.location_on_rounded,
                    expand: true,
                    onPressed: () => Navigator.of(context).pushReplacementNamed(
                      AppRouter.orderTracking,
                      arguments: {'id': widget.orderId},
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  PremiumButton(
                    label: 'Back to home',
                    variant: PremiumButtonVariant.ghost,
                    expand: true,
                    onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                      AppRouter.shell,
                      (_) => false,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
