import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/router/app_router.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_shadows.dart';
import '../core/theme/app_spacing.dart';
import '../data/models/product.dart';
import '../state/cart_provider.dart';
import 'animated_press.dart';
import 'product_thumb.dart';

/// Premium product tile, modelled on the Snappy Shopper card pattern:
/// big image, prominent price, bright green ADD pill / qty stepper.
class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, this.compact = false});

  final Product product;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final cart = context.watch<CartProvider>();
    final qty = cart.qtyOf(product.id);

    return AnimatedPress(
      onTap: () => Navigator.of(context).pushNamed(
        AppRouter.product,
        arguments: {'id': product.id},
      ),
      child: Container(
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: scheme.outlineVariant),
          boxShadow: AppShadows.soft(context),
        ),
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                children: [
                  Positioned.fill(child: ProductThumb(product: product)),
                  if (product.hasPromo)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: _SavingsPill(
                        text: product.tag,
                      ),
                    ),
                  if (product.memberPrice != null && !product.hasPromo)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: _MemberPill(price: product.memberPrice!),
                    ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              product.name,
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              product.unit,
              style: theme.textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: _PriceBlock(product: product),
                ),
                const SizedBox(width: 6),
                _AddControl(product: product, qty: qty),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceBlock extends StatelessWidget {
  const _PriceBlock({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        RichText(
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          text: TextSpan(
            style: TextStyle(color: scheme.onSurface, fontWeight: FontWeight.w800, height: 1.0),
            children: [
              TextSpan(
                text: '£',
                style: TextStyle(
                  fontSize: 14,
                  color: scheme.onSurface.withValues(alpha: 0.7),
                  fontWeight: FontWeight.w700,
                ),
              ),
              TextSpan(
                text: product.effectivePrice.toStringAsFixed(2),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.5),
              ),
            ],
          ),
        ),
        if (product.hasPromo)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              '£${product.price.toStringAsFixed(2)}',
              style: theme.textTheme.bodySmall?.copyWith(
                decoration: TextDecoration.lineThrough,
                color: scheme.onSurfaceVariant,
              ),
              maxLines: 1,
            ),
          ),
      ],
    );
  }
}

/// Bright green "ADD" pill that morphs into a − qty + stepper once a unit is
/// in the cart. Mirrors the Snappy Shopper interaction model.
class _AddControl extends StatelessWidget {
  const _AddControl({required this.product, required this.qty});
  final Product product;
  final int qty;

  static const _green = AppColors.success;
  static const _greenDeep = AppColors.successDeep;

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    if (qty == 0) {
      return Semantics(
        button: true,
        label: 'Add ${product.name} to cart',
        child: Tooltip(
          message: 'Add to cart',
          child: AnimatedPress(
            onTap: () => cart.add(product),
            scale: 0.92,
            child: Container(
              height: 34,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_green, _greenDeep],
                ),
                borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                boxShadow: [
                  BoxShadow(
                    color: _green.withValues(alpha: 0.45),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                    spreadRadius: -2,
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add_rounded, size: 16, color: Colors.white),
                  SizedBox(width: 4),
                  Text(
                    'ADD',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
    return Semantics(
      label: '${product.name}, $qty in cart',
      child: Container(
      height: 34,
      padding: const EdgeInsets.symmetric(horizontal: 2),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_green, _greenDeep],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        boxShadow: [
          BoxShadow(
            color: _green.withValues(alpha: 0.45),
            blurRadius: 16,
            offset: const Offset(0, 6),
            spreadRadius: -2,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepperButton(
            icon: Icons.remove_rounded,
            onTap: () => cart.remove(product.id),
          ),
          SizedBox(
            width: 22,
            child: Text(
              '$qty',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          _StepperButton(
            icon: Icons.add_rounded,
            onTap: () => cart.add(product),
          ),
        ],
      ),
    ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = icon == Icons.add_rounded ? 'Increase quantity' : 'Decrease quantity';
    return Semantics(
      button: true,
      label: label,
      child: Tooltip(
        message: label,
        child: AnimatedPress(
          onTap: onTap,
          scale: 0.9,
          child: SizedBox(
            height: 30,
            width: 26,
            child: Center(child: Icon(icon, size: 16, color: Colors.white)),
          ),
        ),
      ),
    );
  }
}

class _SavingsPill extends StatelessWidget {
  const _SavingsPill({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        // Darker red stack — white-on-#FF1F36 fails WCAG AA (~3.8:1) for
        // small text. red600→red700 raises contrast above 4.5:1.
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.red600, AppColors.red700],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        boxShadow: [
          BoxShadow(
            color: AppColors.red600.withValues(alpha: 0.5),
            blurRadius: 12,
            spreadRadius: -2,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: 11,
          letterSpacing: 0.5,
          height: 1.1,
        ),
      ),
    );
  }
}

class _MemberPill extends StatelessWidget {
  const _MemberPill({required this.price});
  final double price;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFE0B250), Color(0xFFB07920)],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.workspace_premium_rounded, size: 10, color: Colors.white),
          const SizedBox(width: 3),
          Text(
            'Member £${price.toStringAsFixed(2)}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 10,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
