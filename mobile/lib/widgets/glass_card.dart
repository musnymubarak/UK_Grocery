import 'package:flutter/material.dart';

import '../core/theme/app_spacing.dart';

/// A flat surface card with a hairline border (storefront style). The `blur`
/// param is retained for source compatibility but no longer paints a glass
/// effect.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.lg),
    this.borderRadius,
    this.blur = 22,
    this.tint,
    this.borderColor,
  });

  final Widget child;
  final EdgeInsets padding;
  final BorderRadius? borderRadius;
  final double blur;
  final Color? tint;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final radius = borderRadius ?? BorderRadius.circular(AppSpacing.radiusLg);
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: tint ?? scheme.surface,
        borderRadius: radius,
        border: Border.all(color: borderColor ?? scheme.outlineVariant, width: 1),
      ),
      child: child,
    );
  }
}
