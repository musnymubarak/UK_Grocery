import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/network/api_config.dart';
import '../core/theme/app_spacing.dart';
import '../data/models/product.dart';

/// Product thumbnail with a tiered fallback:
///   1. If the backend ships a non-empty [Product.imageUrl], render it via
///      `cached_network_image` (in-memory + disk cache + smooth fade-in).
///   2. While that loads / on error, the gradient + icon shows underneath.
///   3. If no URL at all, the gradient + icon stays — keeps the tile
///      visually intentional even when artwork is missing.
class ProductThumb extends StatelessWidget {
  const ProductThumb({
    super.key,
    required this.product,
    this.size = 96,
    this.radius,
  });

  final Product product;
  final double size;
  final double? radius;

  bool get _hasImage =>
      product.imageUrl != null && product.imageUrl!.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final r = radius ?? AppSpacing.radiusLg;
    return SizedBox(
      width: size,
      height: size,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(r),
        child: Stack(
          fit: StackFit.expand,
          children: [
            _GradientBackdrop(product: product, size: size),
            if (_hasImage)
              CachedNetworkImage(
                imageUrl: ApiConfig.resolveUploadUrl(product.imageUrl),
                fit: BoxFit.cover,
                fadeInDuration: const Duration(milliseconds: 220),
                fadeOutDuration: const Duration(milliseconds: 120),
                placeholder: (_, __) => const SizedBox.shrink(),
                errorWidget: (_, __, ___) => const SizedBox.shrink(),
              ),
          ],
        ),
      ),
    );
  }
}

/// The premium gradient + icon tile that backed the original thumb. Pulled
/// out so the real-image variant can layer over it as a fallback / poster.
class _GradientBackdrop extends StatelessWidget {
  const _GradientBackdrop({required this.product, required this.size});
  final Product product;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                product.colorA.withValues(alpha: 0.85),
                product.colorB,
              ],
            ),
          ),
        ),
        Positioned(
          left: -20,
          top: -20,
          child: Container(
            height: size * 0.7,
            width: size * 0.7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Colors.white.withValues(alpha: 0.35),
                  Colors.white.withValues(alpha: 0.0),
                ],
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.18),
                ],
              ),
            ),
          ),
        ),
        Center(
          child: Icon(
            product.icon,
            size: size * 0.46,
            color: Colors.white.withValues(alpha: 0.92),
          ),
        ),
      ],
    );
  }
}
