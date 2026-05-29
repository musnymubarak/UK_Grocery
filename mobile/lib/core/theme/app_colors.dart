import 'package:flutter/material.dart';

/// Brand palette — deep royal blue primary, rich vibrant red accent.
/// Built for layered surfaces, glass overlays, and controlled contrast.
class AppColors {
  AppColors._();

  // Royal Blue (primary)
  static const Color blue50 = Color(0xFFEEF2FF);
  static const Color blue100 = Color(0xFFDDE4FF);
  static const Color blue200 = Color(0xFFB8C5FF);
  static const Color blue300 = Color(0xFF8A9DFF);
  static const Color blue400 = Color(0xFF5970F5);
  static const Color blue500 = Color(0xFF2747D8);
  static const Color blue600 = Color(0xFF1A2F9E);
  static const Color blue700 = Color(0xFF0F1E6E);
  static const Color blue800 = Color(0xFF0A1450);
  static const Color blue900 = Color(0xFF060F3E);
  static const Color blue950 = Color(0xFF030723);

  // Rich Red (accent)
  static const Color red50 = Color(0xFFFFF1F2);
  static const Color red100 = Color(0xFFFFDEE2);
  static const Color red300 = Color(0xFFFF8A95);
  static const Color red400 = Color(0xFFFF5A6A);
  static const Color red500 = Color(0xFFFF1F36);
  static const Color red600 = Color(0xFFE00F26);
  static const Color red700 = Color(0xFFA60A1F);

  // Neutrals (cool-tinted to harmonize with blue)
  static const Color neutral0 = Color(0xFFFFFFFF);
  static const Color neutral50 = Color(0xFFF7F8FC);
  static const Color neutral100 = Color(0xFFEEF0F7);
  static const Color neutral200 = Color(0xFFE2E6F0);
  static const Color neutral300 = Color(0xFFCFD4E3);
  static const Color neutral400 = Color(0xFFA8B0C6);
  static const Color neutral500 = Color(0xFF7C849D);
  static const Color neutral600 = Color(0xFF5A6585);
  static const Color neutral700 = Color(0xFF3A4365);
  static const Color neutral800 = Color(0xFF1F2547);
  static const Color neutral900 = Color(0xFF0C1330);

  // Semantic
  static const Color success = Color(0xFF12B981);
  static const Color successDeep = Color(0xFF067A4D);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);
  static const Color danger = red500;

  // Glow / accent overlays
  static const Color glowBlue = Color(0x661A2F9E);
  static const Color glowRed = Color(0x66FF1F36);

  // Brand gradients — pick from these three only. Everywhere else should
  // use one of: [royalGradient] (cool primary), [bloodGradient] (red CTA),
  // [elegantGradient] (premium / member surfaces).
  static const Gradient royalGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [blue600, blue800, blue950],
    stops: [0.0, 0.55, 1.0],
  );

  static const Gradient bloodGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [red600, red700],
  );

  static const Gradient elegantGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [blue700, blue900, red700],
    stops: [0.0, 0.6, 1.2],
  );

  static const Gradient surfaceLight = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [neutral0, neutral50],
  );

  static const Gradient surfaceDark = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0A1132), Color(0xFF050922)],
  );
}
