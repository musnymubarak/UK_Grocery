import 'package:flutter/material.dart';

/// Brand palette — aligned to the storefront's flat/light design system:
/// deep navy structure, action-blue accents, action-red CTAs, crisp light
/// neutral surfaces. Symbol names are kept stable so screens/widgets that
/// reference specific shades re-skin automatically.
class AppColors {
  AppColors._();

  // Blue ramp — action-blue (#0056b3) accents up to navy (#001d3d) structure.
  static const Color blue50 = Color(0xFFEAF1FB);
  static const Color blue100 = Color(0xFFCFE0F4);
  static const Color blue200 = Color(0xFF9FC0E8);
  static const Color blue300 = Color(0xFF5E93D6);
  static const Color blue400 = Color(0xFF2C72C4);
  static const Color blue500 = Color(0xFF0E63BD);
  static const Color blue600 = Color(0xFF0056B3); // action-blue (primary)
  static const Color blue700 = Color(0xFF00417F);
  static const Color blue800 = Color(0xFF002B5C);
  static const Color blue900 = Color(0xFF001D3D); // navy (structure)
  static const Color blue950 = Color(0xFF001027);

  // Red ramp — action-red (#e6203a).
  static const Color red50 = Color(0xFFFDECEE);
  static const Color red100 = Color(0xFFFAD2D7);
  static const Color red300 = Color(0xFFF38A95);
  static const Color red400 = Color(0xFFEE5365);
  static const Color red500 = Color(0xFFE6203A); // action-red (secondary)
  static const Color red600 = Color(0xFFC71A30);
  static const Color red700 = Color(0xFF9E1325);

  // Neutrals — light, crisp; low indices are surfaces, high are text/borders.
  static const Color neutral0 = Color(0xFFFFFFFF);
  static const Color neutral50 = Color(0xFFF8F9FA); // page background
  static const Color neutral100 = Color(0xFFF3F4F5);
  static const Color neutral200 = Color(0xFFEDEEEF);
  static const Color neutral300 = Color(0xFFE1E3E4);
  static const Color neutral400 = Color(0xFFC4C6CF); // hairline border
  static const Color neutral500 = Color(0xFFA0A3AB);
  static const Color neutral600 = Color(0xFF74777F); // outline
  static const Color neutral700 = Color(0xFF44474E); // muted text
  static const Color neutral800 = Color(0xFF2A2D31);
  static const Color neutral900 = Color(0xFF191C1D); // on-surface

  // Semantic
  static const Color success = Color(0xFF28A745);
  static const Color successDeep = Color(0xFF1E7E34);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF0056B3);
  static const Color danger = red500;

  // Retained for API compatibility; the flat design no longer paints glows.
  static const Color glowBlue = Color(0x00000000);
  static const Color glowRed = Color(0x00000000);

  // Brand gradients retained for compatibility, recoloured to navy/blue. The
  // flat design prefers solid fills; remaining inline gradients are swept out.
  static const Gradient royalGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [blue700, blue900],
  );

  static const Gradient bloodGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [red500, red600],
  );

  static const Gradient elegantGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [blue800, blue900],
  );

  static const Gradient surfaceLight = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [neutral0, neutral50],
  );

  static const Gradient surfaceDark = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [blue900, blue950],
  );
}
