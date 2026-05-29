import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/premium_button.dart';

/// Mirrors storefront `/` (Landing). Marketing hero, value props, and a
/// primary "Shop now" CTA into the browse experience.
class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      body: Stack(
        children: [
          // Hero gradient background
          Positioned.fill(
            child: ColoredBox(color: scheme.surface),
          ),
          const SizedBox.shrink(),
          const SizedBox.shrink(),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    children: [
                      Container(
                        height: 40,
                        width: 40,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.blue900,
                        ),
                        child: const Icon(Icons.shopping_basket_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Daily Grocer',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const Spacer(),
                      AnimatedPress(
                        onTap: () => Navigator.of(context).pushNamed(AppRouter.login),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: scheme.surface,
                            border: Border.all(color: scheme.outlineVariant),
                            borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.login_rounded, size: 16, color: scheme.onSurface),
                              const SizedBox(width: 6),
                              Text(
                                'Sign in',
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: scheme.onSurface,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(flex: 2),
                  FadeTransition(
                    opacity: CurvedAnimation(parent: _c, curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: scheme.primary.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt_rounded, size: 14, color: scheme.primary),
                          const SizedBox(width: 6),
                          Text(
                            'DELIVERED IN 30 MINUTES',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: scheme.primary,
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  SlideTransition(
                    position: Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
                      CurvedAnimation(parent: _c, curve: const Interval(0.1, 0.7, curve: Curves.easeOutCubic)),
                    ),
                    child: Text(
                      'Premium groceries.',
                      style: theme.textTheme.displayLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.02,
                      ),
                    ),
                  ),
                  ShaderMask(
                    shaderCallback: (rect) => const LinearGradient(
                      colors: [AppColors.blue600, AppColors.red500],
                    ).createShader(rect),
                    child: Text(
                      'Hand-delivered.',
                      style: theme.textTheme.displayLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.02,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'A curated UK grocery store, brought to your door in under half an hour. Real produce, real care, real fast.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    children: const [
                      Expanded(child: _ValueChip(icon: Icons.electric_moped_rounded, label: '30 min')),
                      SizedBox(width: 8),
                      Expanded(child: _ValueChip(icon: Icons.local_florist_rounded, label: 'Fresh')),
                      SizedBox(width: 8),
                      Expanded(child: _ValueChip(icon: Icons.shield_rounded, label: 'Refunded')),
                    ],
                  ),
                  const Spacer(flex: 2),
                  Consumer<StoreProvider>(
                    builder: (_, store, __) {
                      final hasStore = store.hasStore;
                      return Column(
                        children: [
                          PremiumButton(
                            label: hasStore ? 'Continue shopping' : 'Shop now',
                            icon: Icons.storefront_rounded,
                            trailingIcon: Icons.arrow_forward_rounded,
                            expand: true,
                            onPressed: () => Navigator.of(context).pushReplacementNamed(
                              hasStore ? AppRouter.shell : AppRouter.stores,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          if (hasStore)
                            AnimatedPress(
                              onTap: () => Navigator.of(context).pushNamed(AppRouter.stores),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                                  border: Border.all(color: scheme.outlineVariant),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.swap_horiz_rounded, size: 18, color: scheme.onSurface),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Change store · ${store.selected!.name.split(' · ').last}',
                                      style: theme.textTheme.labelLarge,
                                    ),
                                  ],
                                ),
                              ),
                            )
                          else
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.place_outlined, size: 14, color: scheme.onSurfaceVariant),
                                  const SizedBox(width: 6),
                                  Text(
                                    "We'll ask you to pick a store next.",
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Center(
                    child: Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pushNamed(AppRouter.privacy),
                          child: const Text('Privacy'),
                        ),
                        Text('·', style: theme.textTheme.labelMedium),
                        TextButton(
                          onPressed: () => Navigator.of(context).pushNamed(AppRouter.terms),
                          child: const Text('Terms'),
                        ),
                        Text('·', style: theme.textTheme.labelMedium),
                        TextButton(
                          onPressed: () => Navigator.of(context).pushNamed(AppRouter.cookies),
                          child: const Text('Cookies'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ValueChip extends StatelessWidget {
  const _ValueChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: t.colorScheme.surface,
        border: Border.all(color: t.colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        children: [
          Icon(icon, color: t.colorScheme.primary, size: 22),
          const SizedBox(height: 4),
          Text(
            label,
            style: t.textTheme.labelMedium?.copyWith(
              color: t.colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
