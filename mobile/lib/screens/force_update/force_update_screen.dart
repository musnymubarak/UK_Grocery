import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// Blocking full-screen gate shown when the running build is below the backend's
/// minimum supported version (`force_update`) or when the platform is in
/// maintenance mode. It cannot be dismissed with the back button.
class ForceUpdateScreen extends StatelessWidget {
  const ForceUpdateScreen({
    super.key,
    this.maintenance = false,
    this.updateUrl,
    this.onRetry,
  });

  /// When true, shows a maintenance message instead of an update prompt.
  final bool maintenance;
  final String? updateUrl;
  final VoidCallback? onRetry;

  Future<void> _openStore() async {
    final raw = updateUrl;
    if (raw == null || raw.trim().isEmpty) return;
    final uri = Uri.tryParse(raw);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final Widget action;
    if (maintenance) {
      action = onRetry != null
          ? OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            )
          : const SizedBox.shrink();
    } else {
      action = SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: _openStore,
          icon: const Icon(Icons.download_rounded),
          label: const Text('Update now'),
        ),
      );
    }

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.neutral50,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    height: 88,
                    width: 88,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.blue50,
                    ),
                    child: Icon(
                      maintenance
                          ? Icons.build_circle_outlined
                          : Icons.system_update_rounded,
                      size: 44,
                      color: AppColors.blue600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    maintenance ? 'We\'ll be right back' : 'Update required',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    maintenance
                        ? 'Daily Grocer is undergoing scheduled maintenance. '
                            'Please check back in a little while.'
                        : 'A newer version of Daily Grocer is available. '
                            'Please update to keep shopping.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  action,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
