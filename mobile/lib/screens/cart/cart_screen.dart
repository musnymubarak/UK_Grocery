import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../state/cart_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/product_thumb.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final theme = Theme.of(context);
    final empty = cart.itemCount == 0;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!embedded)
              PremiumAppBar(
                title: 'Your cart',
                actions: [
                  if (!empty)
                    TextButton(
                      onPressed: cart.clear,
                      child: const Text('Clear'),
                    ),
                ],
              ),
            if (embedded)
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, 0),
                child: Row(
                  children: [
                    Expanded(child: Text('Your cart', style: theme.textTheme.displaySmall)),
                    if (!empty)
                      TextButton(onPressed: cart.clear, child: const Text('Clear')),
                  ],
                ),
              ),
            const SizedBox(height: AppSpacing.md),
            if (empty)
              Expanded(
                child: EmptyState(
                  icon: Icons.shopping_bag_outlined,
                  title: 'Your cart is empty',
                  message: 'Add a few favourites to get started. Free delivery over £40.',
                  action: PremiumButton(
                    label: 'Start shopping',
                    icon: Icons.storefront_rounded,
                    onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                      AppRouter.shell,
                      (_) => false,
                    ),
                  ),
                ),
              )
            else
              Expanded(
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, 220),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final line = cart.items[i];
                    return Dismissible(
                      key: ValueKey(line.product.id),
                      direction: DismissDirection.endToStart,
                      onDismissed: (_) => cart.setQty(line.product.id, 0),
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: AppColors.red500.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                        ),
                        child: const Icon(Icons.delete_outline_rounded, color: AppColors.red600),
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                          border: Border.all(color: theme.colorScheme.outlineVariant),
                          boxShadow: AppShadows.soft(context),
                        ),
                        child: Row(
                          children: [
                            ProductThumb(product: line.product, size: 72),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(line.product.name, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                                  Text(line.product.unit, style: theme.textTheme.bodySmall),
                                  const SizedBox(height: 6),
                                  Text(
                                    formatGBP(line.subtotal),
                                    style: theme.textTheme.titleMedium?.copyWith(
                                      color: theme.colorScheme.primary,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            _MiniStepper(
                              qty: line.qty,
                              onMinus: () => cart.remove(line.product.id),
                              onPlus: () => cart.add(line.product),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      bottomSheet: empty ? null : _CartFooter(),
    );
  }
}

class _MiniStepper extends StatelessWidget {
  const _MiniStepper({required this.qty, required this.onMinus, required this.onPlus});
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
          AnimatedPress(
            onTap: onMinus,
            child: Container(
              height: 32,
              width: 32,
              alignment: Alignment.center,
              child: const Icon(Icons.remove_rounded, size: 16),
            ),
          ),
          SizedBox(
            width: 24,
            child: Text(
              '$qty',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleSmall,
            ),
          ),
          AnimatedPress(
            onTap: onPlus,
            child: Container(
              height: 32,
              width: 32,
              alignment: Alignment.center,
              child: const Icon(Icons.add_rounded, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}

class _CartFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final theme = Theme.of(context);
    final delivery = cart.subtotal > 40 ? 0.0 : 2.99;
    final total = cart.subtotal + delivery;
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXxl)),
        boxShadow: AppShadows.elevated(context),
      ),
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xl),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _LineRow(label: 'Subtotal', value: formatGBP(cart.subtotal)),
            const SizedBox(height: 8),
            _LineRow(
              label: 'Delivery',
              value: delivery == 0 ? 'Free' : formatGBP(delivery),
              accent: delivery == 0,
            ),
            if (cart.savings > 0) ...[
              const SizedBox(height: 8),
              _LineRow(
                label: 'You save',
                value: '−${formatGBP(cart.savings)}',
                color: AppColors.success,
              ),
            ],
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Divider(),
            ),
            Row(
              children: [
                Text('Total', style: theme.textTheme.titleLarge),
                const Spacer(),
                Text(
                  formatGBP(total),
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            PremiumButton(
              label: 'Checkout securely',
              icon: Icons.lock_outline_rounded,
              trailingIcon: Icons.arrow_forward_rounded,
              expand: true,
              variant: PremiumButtonVariant.accent,
              onPressed: () => Navigator.of(context).pushNamed(AppRouter.checkout),
            ),
          ],
        ),
      ),
    );
  }
}

class _LineRow extends StatelessWidget {
  const _LineRow({required this.label, required this.value, this.accent = false, this.color});
  final String label;
  final String value;
  final bool accent;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Text(label, style: theme.textTheme.bodyMedium),
        const Spacer(),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            color: color ?? (accent ? AppColors.success : theme.colorScheme.onSurface),
          ),
        ),
      ],
    );
  }
}
