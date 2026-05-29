import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_spacing.dart';

/// A frosted glass surface with a soft inner gradient and hairline border.
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? BorderRadius.circular(AppSpacing.radiusLg);
    final defaultTint = isDark
        ? Colors.white.withValues(alpha: 0.06)
        : Colors.white.withValues(alpha: 0.55);
    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: tint ?? defaultTint,
            borderRadius: radius,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [
                      Colors.white.withValues(alpha: 0.05),
                      Colors.white.withValues(alpha: 0.0),
                    ]
                  : [
                      Colors.white.withValues(alpha: 0.7),
                      Colors.white.withValues(alpha: 0.3),
                    ],
            ),
            border: Border.all(
              color: borderColor ??
                  (isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : Colors.white.withValues(alpha: 0.7)),
              width: 1,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
