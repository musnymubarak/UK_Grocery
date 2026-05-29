import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_spacing.dart';
import 'premium_button.dart';

/// Replaces Flutter's red error banner with a branded retry screen.
/// Hook into `MaterialApp.builder` so it covers every route.
class ErrorBoundary extends StatefulWidget {
  const ErrorBoundary({super.key, required this.child});
  final Widget child;

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  FlutterErrorDetails? _details;

  @override
  void initState() {
    super.initState();
    // Capture build / framework errors so they render via [_FriendlyError]
    // instead of the default red banner.
    ErrorWidget.builder = (details) => _FriendlyError(
          details: details,
          onReset: () => setState(() => _details = null),
        );
  }

  @override
  Widget build(BuildContext context) {
    if (_details != null) {
      return _FriendlyError(
        details: _details!,
        onReset: () => setState(() => _details = null),
      );
    }
    return widget.child;
  }
}

class _FriendlyError extends StatelessWidget {
  const _FriendlyError({required this.details, required this.onReset});
  final FlutterErrorDetails details;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: Colors.white,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 64,
                  width: 64,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.red500.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: const Icon(
                    Icons.error_outline_rounded,
                    color: AppColors.red600,
                    size: 32,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const Text(
                  'Something went wrong',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.neutral900,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                const Text(
                  "We hit an unexpected error. Tap retry to keep shopping — your basket is safe.",
                  style: TextStyle(
                    fontSize: 15,
                    color: AppColors.neutral600,
                    height: 1.4,
                  ),
                ),
                if (kDebugMode) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: AppColors.neutral100,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    ),
                    child: Text(
                      details.exceptionAsString(),
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: AppColors.neutral800,
                      ),
                      maxLines: 6,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.xl),
                PremiumButton(
                  label: 'Try again',
                  icon: Icons.refresh_rounded,
                  expand: true,
                  onPressed: onReset,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
