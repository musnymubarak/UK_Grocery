import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppShadows {
  AppShadows._();

  static List<BoxShadow> soft(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark
        ? const [
            BoxShadow(
              color: Color(0x66000000),
              blurRadius: 24,
              spreadRadius: 0,
              offset: Offset(0, 8),
            ),
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 4,
              spreadRadius: 0,
              offset: Offset(0, 1),
            ),
          ]
        : const [
            BoxShadow(
              color: Color(0x14111A4D),
              blurRadius: 30,
              spreadRadius: 0,
              offset: Offset(0, 10),
            ),
            BoxShadow(
              color: Color(0x0A111A4D),
              blurRadius: 6,
              spreadRadius: 0,
              offset: Offset(0, 2),
            ),
          ];
  }

  static List<BoxShadow> elevated(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark
        ? const [
            BoxShadow(
              color: Color(0x99000000),
              blurRadius: 40,
              spreadRadius: -8,
              offset: Offset(0, 18),
            ),
          ]
        : const [
            BoxShadow(
              color: Color(0x1F1A2F9E),
              blurRadius: 40,
              spreadRadius: -8,
              offset: Offset(0, 22),
            ),
            BoxShadow(
              color: Color(0x14111A4D),
              blurRadius: 12,
              spreadRadius: -4,
              offset: Offset(0, 6),
            ),
          ];
  }

  static List<BoxShadow> glowBlue() => const [
        BoxShadow(
          color: AppColors.glowBlue,
          blurRadius: 32,
          spreadRadius: -4,
          offset: Offset(0, 12),
        ),
      ];

  static List<BoxShadow> glowRed() => const [
        BoxShadow(
          color: AppColors.glowRed,
          blurRadius: 32,
          spreadRadius: -4,
          offset: Offset(0, 12),
        ),
      ];
}
