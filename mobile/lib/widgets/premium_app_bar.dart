import 'package:flutter/material.dart';

import '../core/theme/app_spacing.dart';
import 'animated_press.dart';

/// A compact, modern app bar with a back chip + optional trailing actions.
class PremiumAppBar extends StatelessWidget implements PreferredSizeWidget {
  const PremiumAppBar({
    super.key,
    this.title,
    this.actions,
    this.showBack = true,
    this.background,
  });

  final String? title;
  final List<Widget>? actions;
  final bool showBack;
  final Color? background;

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      color: background ?? Colors.transparent,
      padding: EdgeInsets.fromLTRB(
        AppSpacing.base,
        MediaQuery.of(context).padding.top + 8,
        AppSpacing.base,
        8,
      ),
      child: Row(
        children: [
          if (showBack)
            Semantics(
              button: true,
              label: 'Back',
              child: Tooltip(
                message: 'Back',
                child: AnimatedPress(
                  onTap: () => Navigator.of(context).maybePop(),
                  child: Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      shape: BoxShape.circle,
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Icon(Icons.arrow_back_rounded, size: 20, color: scheme.onSurface),
                  ),
                ),
              ),
            ),
          if (showBack) const SizedBox(width: AppSpacing.md),
          Expanded(
            child: title == null
                ? const SizedBox.shrink()
                : Text(
                    title!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
          ),
          ...?actions,
        ],
      ),
    );
  }
}

class CircleIconButton extends StatelessWidget {
  const CircleIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.badge,
    this.semanticLabel,
  });
  final IconData icon;
  final VoidCallback? onTap;
  final int? badge;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final label = semanticLabel ?? 'Action';
    return Semantics(
      button: true,
      label: badge != null && badge! > 0 ? '$label ($badge)' : label,
      child: Tooltip(
        message: label,
        child: AnimatedPress(
          onTap: onTap,
          child: Container(
            height: 44,
            width: 44,
            margin: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(
              color: scheme.surface,
              shape: BoxShape.circle,
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                Icon(icon, size: 20, color: scheme.onSurface),
                if (badge != null && badge! > 0)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      height: 9,
                      width: 9,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.secondary,
                        shape: BoxShape.circle,
                        border: Border.all(color: scheme.surface, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
