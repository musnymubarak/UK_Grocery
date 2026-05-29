import 'package:flutter/material.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/premium_app_bar.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const PremiumAppBar(title: 'Settings'),
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxxl),
                children: [
                  Text('Legal', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 10),
                  _SettingsTile(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Privacy policy',
                    caption: 'How we handle your data',
                    onTap: () => Navigator.of(context).pushNamed(AppRouter.privacy),
                  ),
                  _SettingsTile(
                    icon: Icons.description_outlined,
                    title: 'Terms of service',
                    caption: 'The fine print',
                    onTap: () => Navigator.of(context).pushNamed(AppRouter.terms),
                  ),
                  _SettingsTile(
                    icon: Icons.cookie_outlined,
                    title: 'Cookie policy',
                    caption: 'Cookies & tracking preferences',
                    onTap: () => Navigator.of(context).pushNamed(AppRouter.cookies),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text('About', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.base),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      border: Border.all(color: theme.colorScheme.outlineVariant),
                      boxShadow: AppShadows.soft(context),
                    ),
                    child: Row(
                      children: [
                        Container(
                          height: 40,
                          width: 40,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                          ),
                          child: Icon(Icons.shopping_basket_rounded, color: theme.colorScheme.primary, size: 20),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Daily Grocer', style: theme.textTheme.titleMedium),
                              // Mirrors pubspec.yaml `version:`.
                              Text('Version 1.0.0', style: theme.textTheme.bodySmall),
                            ],
                          ),
                        ),
                      ],
                    ),
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

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.caption,
    this.onTap,
  });
  final IconData icon;
  final String title;
  final String caption;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return AnimatedPress(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: t.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: t.colorScheme.outlineVariant),
        ),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: t.colorScheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Icon(icon, color: t.colorScheme.primary, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: t.textTheme.titleMedium),
                  Text(caption, style: t.textTheme.bodySmall),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: t.colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
