import 'package:flutter/material.dart';

enum SlideDirection { right, up }

class PremiumPageRoute<T> extends PageRouteBuilder<T> {
  PremiumPageRoute({
    required this.child,
    required RouteSettings settings,
    this.direction = SlideDirection.right,
  }) : super(
          settings: settings,
          transitionDuration: const Duration(milliseconds: 380),
          reverseTransitionDuration: const Duration(milliseconds: 280),
          pageBuilder: (_, __, ___) => child,
          transitionsBuilder: (_, a, sa, c) {
            final offset = direction == SlideDirection.right
                ? const Offset(0.04, 0)
                : const Offset(0, 0.05);
            return FadeTransition(
              opacity: CurvedAnimation(parent: a, curve: Curves.easeOutCubic),
              child: SlideTransition(
                position: Tween<Offset>(begin: offset, end: Offset.zero)
                    .animate(CurvedAnimation(parent: a, curve: Curves.easeOutCubic)),
                child: c,
              ),
            );
          },
        );

  final Widget child;
  final SlideDirection direction;
}

class PremiumFadeRoute<T> extends PageRouteBuilder<T> {
  PremiumFadeRoute({required this.child, required RouteSettings settings})
      : super(
          settings: settings,
          transitionDuration: const Duration(milliseconds: 320),
          reverseTransitionDuration: const Duration(milliseconds: 220),
          pageBuilder: (_, __, ___) => child,
          transitionsBuilder: (_, a, __, c) => FadeTransition(
            opacity: CurvedAnimation(parent: a, curve: Curves.easeOutCubic),
            child: c,
          ),
        );

  final Widget child;
}
