import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_shadows.dart';
import '../core/theme/app_spacing.dart';
import 'animated_press.dart';

enum PremiumButtonVariant { primary, accent, ghost, surface }

class PremiumButton extends StatelessWidget {
  const PremiumButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.trailingIcon,
    this.variant = PremiumButtonVariant.primary,
    this.expand = false,
    this.loading = false,
    this.compact = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final IconData? trailingIcon;
  final PremiumButtonVariant variant;
  final bool expand;
  final bool loading;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final scheme = theme.colorScheme;

    Gradient? gradient;
    Color bg = scheme.surfaceContainer;
    Color fg = scheme.onSurface;
    List<BoxShadow> shadow = const [];
    Border? border;

    switch (variant) {
      case PremiumButtonVariant.primary:
        gradient = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            isDark ? AppColors.blue500 : AppColors.blue600,
            AppColors.blue800,
          ],
        );
        fg = Colors.white;
        shadow = AppShadows.glowBlue();
        break;
      case PremiumButtonVariant.accent:
        gradient = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.red500, AppColors.red700],
        );
        fg = Colors.white;
        shadow = AppShadows.glowRed();
        break;
      case PremiumButtonVariant.ghost:
        bg = Colors.transparent;
        fg = scheme.onSurface;
        border = Border.all(color: scheme.outline);
        break;
      case PremiumButtonVariant.surface:
        bg = scheme.surfaceContainer;
        fg = scheme.onSurface;
        shadow = AppShadows.soft(context);
        break;
    }

    final isDisabled = onPressed == null && !loading;
    final content = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (loading)
          SizedBox(
            height: 18,
            width: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(fg),
            ),
          )
        else ...[
          if (icon != null) ...[
            Icon(icon, size: 18, color: fg),
            const SizedBox(width: AppSpacing.sm),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelLarge?.copyWith(color: fg),
            ),
          ),
          if (trailingIcon != null) ...[
            const SizedBox(width: AppSpacing.sm),
            Icon(trailingIcon, size: 18, color: fg),
          ],
        ],
      ],
    );

    return Opacity(
      opacity: isDisabled ? 0.55 : 1,
      child: AnimatedPress(
        onTap: (loading || isDisabled) ? null : onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          width: expand ? double.infinity : null,
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 16 : 24,
            vertical: compact ? 11 : 16,
          ),
          decoration: BoxDecoration(
            color: gradient == null ? bg : null,
            gradient: gradient,
            border: border,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            boxShadow: shadow,
          ),
          child: content,
        ),
      ),
    );
  }
}
