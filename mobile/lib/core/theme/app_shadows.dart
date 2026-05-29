import 'package:flutter/material.dart';

/// Flat/light design: cards rely on hairline borders, not shadows. `soft`
/// returns no shadow; `elevated` keeps a single subtle lift for genuinely
/// floating surfaces (bottom nav, sheets, dialogs). Glows are disabled.
class AppShadows {
  AppShadows._();

  static List<BoxShadow> soft(BuildContext context) => const [];

  static List<BoxShadow> elevated(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark
        ? const [
            BoxShadow(
              color: Color(0x66000000),
              blurRadius: 16,
              spreadRadius: 0,
              offset: Offset(0, 6),
            ),
          ]
        : const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 16,
              spreadRadius: 0,
              offset: Offset(0, 6),
            ),
          ];
  }

  static List<BoxShadow> glowBlue() => const [];

  static List<BoxShadow> glowRed() => const [];
}
