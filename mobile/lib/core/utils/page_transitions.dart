import 'package:flutter/material.dart';

enum SlideDirection { right, up }

/// Standard native page route providing platform-adaptive transitions (Cupertino
/// with swipe-to-back on iOS/macOS, smooth predictive/zoom on Android).
class PremiumPageRoute<T> extends MaterialPageRoute<T> {
  PremiumPageRoute({
    required Widget child,
    required super.settings,
    SlideDirection direction = SlideDirection.right,
  }) : super(builder: (_) => child);
}

/// Lightweight fade transition used for root app changes (e.g. Splash -> Shell).
class PremiumFadeRoute<T> extends PageRouteBuilder<T> {
  PremiumFadeRoute({required this.child, required RouteSettings settings})
      : super(
          settings: settings,
          transitionDuration: const Duration(milliseconds: 250),
          reverseTransitionDuration: const Duration(milliseconds: 200),
          pageBuilder: (_, __, ___) => child,
          transitionsBuilder: (_, a, __, c) => FadeTransition(
            opacity: CurvedAnimation(parent: a, curve: Curves.easeOutCubic),
            child: c,
          ),
        );

  final Widget child;
}
