import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/router/app_router.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_spacing.dart';
import '../data/models/product.dart';
import '../state/cart_provider.dart';
import 'animated_press.dart';
import 'product_thumb.dart';

class ProductListTile extends StatelessWidget {
  const ProductListTile({super.key, required this.product});

  final Product product;

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
        color: scheme.surface,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (product.hasPromo) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E88E5), // Blue pill as in screenshot
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        product.tag.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        'LKR ${product.effectivePrice.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                      if (product.hasPromo) ...[
                        const SizedBox(width: 8),
                        Text(
                          'LKR ${product.price.toStringAsFixed(2)}',
                          style: TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: scheme.onSurfaceVariant,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.thumb_up, size: 12, color: scheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        '91% (100+)',
                        style: TextStyle(
                          color: scheme.onSurfaceVariant,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            SizedBox(
              width: 100,
              height: 100,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: ProductThumb(product: product),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: _AddSquareButton(product: product, qty: qty),
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

class _AddSquareButton extends StatelessWidget {
  const _AddSquareButton({required this.product, required this.qty});
  final Product product;
  final int qty;

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    final isAdded = qty > 0;

    return Semantics(
      button: true,
      label: isAdded ? 'Remove ${product.name}' : 'Add ${product.name} to cart',
      child: AnimatedPress(
        onTap: () {
          if (isAdded) {
            cart.remove(product.id);
          } else {
            cart.add(product);
          }
        },
        scale: 0.9,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE0C097)), // Light brownish/golden border
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(
            isAdded ? Icons.remove_rounded : Icons.add_rounded,
            size: 20,
            color: const Color(0xFFB07920), // Brownish cross
          ),
        ),
      ),
    );
  }
}
