import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../state/auth_provider.dart';
import '../../widgets/animated_press.dart';

/// Mirrors storefront `/profile`. For unauthenticated visitors it shows a
/// sign-in CTA; signed-in users get account links that map to the storefront
/// destinations (orders, refunds, stores, legal pages).
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, AppSpacing.xxxl),
          children: [
            Text('Profile', style: theme.textTheme.displaySmall),
            const SizedBox(height: AppSpacing.xl),
            if (auth.isAuthenticated)
              _SignedInHero(name: auth.displayName, email: auth.email, initials: auth.initials)
            else
              const _SignInPrompt(),
            const SizedBox(height: AppSpacing.xl),
            if (auth.isAuthenticated) ...[
              const Row(
                children: [
                  Expanded(child: _Stat(label: 'Orders', value: '12')),
                  SizedBox(width: 10),
                  Expanded(child: _Stat(label: 'Saved', value: '£48')),
                  SizedBox(width: 10),
                  Expanded(child: _Stat(label: 'Points', value: '720')),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
            Text('Shop', style: theme.textTheme.titleLarge),
            const SizedBox(height: 10),
            _Tile(
              icon: Icons.receipt_long_rounded,
              title: 'Your orders',
              caption: 'Track, reorder, request a refund',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.orders),
            ),
            _Tile(
              icon: Icons.replay_rounded,
              title: 'Refunds & returns',
              caption: 'See the status of any refund',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.refunds),
            ),
            _Tile(
              icon: Icons.storefront_rounded,
              title: 'Your store',
              caption: 'Switch delivery location',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.stores),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Account', style: theme.textTheme.titleLarge),
            const SizedBox(height: 10),
            _Tile(
              icon: Icons.settings_outlined,
              title: 'Settings',
              caption: 'Legal, app info & preferences',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.settings),
            ),
            if (auth.isAuthenticated) ...[
              const SizedBox(height: AppSpacing.xl),
              AnimatedPress(
                onTap: () {
                  context.read<AuthProvider>().signOut();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.red500.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Text(
                    'Sign out',
                    style: theme.textTheme.labelLarge?.copyWith(color: AppColors.red600),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SignInPrompt extends StatelessWidget {
  const _SignInPrompt();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.blue900,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 56,
                width: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.18),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                ),
                child: const Icon(Icons.person_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Guest',
                      style: theme.textTheme.headlineSmall?.copyWith(color: Colors.white),
                    ),
                    Text(
                      'Sign in to save addresses and track orders.',
                      style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.78)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: AnimatedPress(
                  onTap: () => Navigator.of(context).pushNamed(AppRouter.login),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Text(
                      'Sign in',
                      style: theme.textTheme.labelLarge?.copyWith(color: AppColors.blue700),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AnimatedPress(
                  onTap: () => Navigator.of(context).pushNamed(
                    AppRouter.login,
                    arguments: {'mode': 'signup'},
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      'Sign up',
                      style: theme.textTheme.labelLarge?.copyWith(color: Colors.white),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SignedInHero extends StatelessWidget {
  const _SignedInHero({required this.name, required this.email, required this.initials});
  final String name;
  final String? email;
  final String initials;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.blue900,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
      ),
      child: Row(
        children: [
          Container(
            height: 64,
            width: 64,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
            ),
            child: ShaderMask(
              shaderCallback: (rect) => const LinearGradient(
                colors: [AppColors.blue700, AppColors.red500],
              ).createShader(rect),
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: theme.textTheme.headlineSmall?.copyWith(color: Colors.white),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  email ?? '',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.7)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  ),
                  child: const Text(
                    'MEMBER',
                    style: TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: t.colorScheme.outlineVariant),
        boxShadow: AppShadows.soft(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: t.textTheme.headlineSmall),
          const SizedBox(height: 2),
          Text(label, style: t.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
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
                borderRadius: BorderRadius.circular(12),
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
