import 'package:flutter/material.dart';

import '../core/router/app_router.dart';
import '../core/theme/app_shadows.dart';
import '../core/theme/app_spacing.dart';
import '../data/models/category.dart';
import 'animated_press.dart';

/// Full-width category card with a coloured chevron on the left (containing
/// the category name) and a product image on the right — modelled after the
/// Snappy-shopper-style category banners.
class CategoryTile extends StatelessWidget {
  const CategoryTile({super.key, required this.category, this.height = 96});

  final Category category;
  final double height;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AnimatedPress(
      onTap: () => Navigator.of(context).pushNamed(
        AppRouter.aisle,
        arguments: {'id': category.id, 'title': category.name},
      ),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: scheme.outlineVariant),
          boxShadow: AppShadows.soft(context),
        ),
        clipBehavior: Clip.antiAlias,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final w = constraints.maxWidth;
            // ~48:52 split — coloured chevron gets a little more room so
            // longer category names fit in one line. The chevron's arrow tip
            // overlaps slightly into the image side for visual continuity.
            final chevronW = w * 0.48;
            final imageW = w * 0.52 + 24;
            return Stack(
              children: [
                // Product image — fills the right 60%
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: imageW,
                  child: _CategoryImage(asset: category.assetImage),
                ),
                // Coloured chevron with text on top — left 40%
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: chevronW,
                  child: ClipPath(
                    clipper: _ChevronClipper(),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [category.colorA, category.colorB],
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 14, 44, 14),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            category.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              height: 1.1,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// Right-pointing chevron clipper.
///
///     0,0 ─────────────── (w-arrow), 0
///        │                          \
///        │                           > w, h/2
///        │                          /
///     0,h ─────────────── (w-arrow), h
class _ChevronClipper extends CustomClipper<Path> {
  static const double _arrow = 32;

  @override
  Path getClip(Size size) {
    final w = size.width;
    final h = size.height;
    return Path()
      ..moveTo(0, 0)
      ..lineTo(w - _arrow, 0)
      ..lineTo(w, h / 2)
      ..lineTo(w - _arrow, h)
      ..lineTo(0, h)
      ..close();
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

class _CategoryImage extends StatelessWidget {
  const _CategoryImage({required this.asset});
  final String asset;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      asset,
      fit: BoxFit.contain,
      alignment: Alignment.centerRight,
      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
    );
  }
}
