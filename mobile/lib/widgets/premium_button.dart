import 'package:flutter/material.dart';

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
    final scheme = theme.colorScheme;

    Color bg;
    Color fg;
    Border? border;

    switch (variant) {
      case PremiumButtonVariant.primary:
        bg = scheme.primary;
        fg = scheme.onPrimary;
        break;
      case PremiumButtonVariant.accent:
        bg = scheme.secondary;
        fg = scheme.onSecondary;
        break;
      case PremiumButtonVariant.ghost:
        bg = Colors.transparent;
        fg = scheme.onSurface;
        border = Border.all(color: scheme.outline);
        break;
      case PremiumButtonVariant.surface:
        bg = scheme.surface;
        fg = scheme.onSurface;
        border = Border.all(color: scheme.outlineVariant);
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
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          width: expand ? double.infinity : null,
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 16 : 24,
            vertical: compact ? 11 : 15,
          ),
          decoration: BoxDecoration(
            color: bg,
            border: border,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: content,
        ),
      ),
    );
  }
}
