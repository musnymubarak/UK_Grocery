import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_spacing.dart';

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.accent,
  });

  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final stripeColor = accent ?? t.colorScheme.primary;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            height: 26,
            width: 4,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [stripeColor, AppColors.red500],
              ),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: t.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: t.textTheme.bodySmall?.copyWith(color: t.colorScheme.onSurfaceVariant),
                  ),
                ],
              ],
            ),
          ),
          if (actionLabel != null)
            TextButton(
              onPressed: onAction,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(actionLabel!),
                  const SizedBox(width: 2),
                  const Icon(Icons.arrow_forward_rounded, size: 16),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
