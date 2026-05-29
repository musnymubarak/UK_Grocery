import 'package:flutter/material.dart';

import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/premium_app_bar.dart';

/// One reusable legal page used for Privacy, Terms, and Cookie policy —
/// mirrors the storefront's `/privacy`, `/terms`, `/cookies` routes.
class LegalScreen extends StatelessWidget {
  const LegalScreen({
    super.key,
    required this.title,
    required this.icon,
    required this.lastUpdated,
    required this.sections,
  });

  final String title;
  final IconData icon;
  final String lastUpdated;
  final List<LegalSection> sections;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            PremiumAppBar(title: title),
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      color: scheme.surfaceContainerLow,
                      border: Border.all(color: scheme.outlineVariant),
                      boxShadow: AppShadows.soft(context),
                    ),
                    child: Row(
                      children: [
                        Container(
                          height: 48,
                          width: 48,
                          decoration: BoxDecoration(
                            color: scheme.primary.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(icon, color: scheme.primary, size: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title, style: theme.textTheme.titleLarge),
                              Text(
                                'Last updated · $lastUpdated',
                                style: theme.textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  for (final s in sections) ...[
                    Text(s.heading, style: theme.textTheme.headlineSmall),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      s.body,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: scheme.onSurfaceVariant,
                        height: 1.55,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LegalSection {
  const LegalSection(this.heading, this.body);
  final String heading;
  final String body;
}

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const LegalScreen(
      title: 'Privacy Policy',
      icon: Icons.privacy_tip_rounded,
      lastUpdated: 'October 2025',
      sections: [
        LegalSection(
          'What we collect',
          'We collect only what we need to deliver your groceries: your name, contact details, addresses, and order history. Payment information is handled by Stripe and never stored on our servers.',
        ),
        LegalSection(
          'How we use it',
          'To fulfil orders, send delivery updates, process refunds, and improve our service. We never sell your personal data — to anyone, ever.',
        ),
        LegalSection(
          'Your rights under GDPR',
          'You can request a copy of your data, ask us to correct inaccuracies, or have your account deleted at any time. Just email us at privacy@dailygrocer.co.uk.',
        ),
        LegalSection(
          'Contact',
          'Our Data Protection Officer can be reached at dpo@dailygrocer.co.uk. Complaints can be escalated to the UK Information Commissioner\'s Office (ico.org.uk).',
        ),
      ],
    );
  }
}

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const LegalScreen(
      title: 'Terms of Service',
      icon: Icons.description_rounded,
      lastUpdated: 'October 2025',
      sections: [
        LegalSection(
          'Using Daily Grocer',
          'By using the app, you agree to provide accurate information, treat our team with respect, and only place orders you intend to receive.',
        ),
        LegalSection(
          'Orders & payment',
          'Prices are inclusive of VAT. Final basket totals may vary slightly based on weighed items (fruit, meat). You will only be charged for what is actually delivered.',
        ),
        LegalSection(
          'Cancellations & refunds',
          'You can cancel free of charge before we begin picking your order. Refunds for missing or damaged items are processed within 24 hours to your original payment method.',
        ),
        LegalSection(
          'Age-restricted items',
          'Alcohol and tobacco are sold only to customers aged 18 or over. Our drivers will request photo ID and may refuse delivery without it.',
        ),
      ],
    );
  }
}

class CookiePolicyScreen extends StatelessWidget {
  const CookiePolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const LegalScreen(
      title: 'Cookie Policy',
      icon: Icons.cookie_rounded,
      lastUpdated: 'October 2025',
      sections: [
        LegalSection(
          'What are cookies',
          'Small text files stored on your device that help us remember things like your cart, your selected store, and whether you\'re signed in.',
        ),
        LegalSection(
          'Essential cookies',
          'Required for the app to work — authentication, cart persistence, store selection. These cannot be disabled.',
        ),
        LegalSection(
          'Analytics cookies',
          'Help us understand how customers use the app so we can improve it. You can opt out anytime in Profile settings.',
        ),
        LegalSection(
          'Marketing cookies',
          'Off by default. We never sell your data to advertisers.',
        ),
      ],
    );
  }
}
