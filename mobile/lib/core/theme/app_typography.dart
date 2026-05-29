import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Premium typography scale — Plus Jakarta Sans.
class AppTypography {
  AppTypography._();

  static TextTheme textTheme(Color onSurface, Color onSurfaceMuted) {
    final base = GoogleFonts.plusJakartaSansTextTheme();
    return base.copyWith(
      // Display
      displayLarge: base.displayLarge?.copyWith(
        fontSize: 48,
        height: 1.05,
        letterSpacing: -1.2,
        fontWeight: FontWeight.w800,
        color: onSurface,
      ),
      displayMedium: base.displayMedium?.copyWith(
        fontSize: 36,
        height: 1.08,
        letterSpacing: -0.8,
        fontWeight: FontWeight.w800,
        color: onSurface,
      ),
      displaySmall: base.displaySmall?.copyWith(
        fontSize: 28,
        height: 1.15,
        letterSpacing: -0.4,
        fontWeight: FontWeight.w700,
        color: onSurface,
      ),
      // Headline
      headlineLarge: base.headlineLarge?.copyWith(
        fontSize: 24,
        height: 1.2,
        letterSpacing: -0.3,
        fontWeight: FontWeight.w700,
        color: onSurface,
      ),
      headlineMedium: base.headlineMedium?.copyWith(
        fontSize: 20,
        height: 1.25,
        letterSpacing: -0.2,
        fontWeight: FontWeight.w700,
        color: onSurface,
      ),
      headlineSmall: base.headlineSmall?.copyWith(
        fontSize: 18,
        height: 1.3,
        letterSpacing: -0.1,
        fontWeight: FontWeight.w700,
        color: onSurface,
      ),
      // Title
      titleLarge: base.titleLarge?.copyWith(
        fontSize: 17,
        height: 1.35,
        fontWeight: FontWeight.w700,
        color: onSurface,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontSize: 15,
        height: 1.4,
        fontWeight: FontWeight.w600,
        color: onSurface,
      ),
      titleSmall: base.titleSmall?.copyWith(
        fontSize: 13,
        height: 1.4,
        fontWeight: FontWeight.w600,
        color: onSurfaceMuted,
      ),
      // Body
      bodyLarge: base.bodyLarge?.copyWith(
        fontSize: 16,
        height: 1.5,
        fontWeight: FontWeight.w500,
        color: onSurface,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        fontSize: 14,
        height: 1.5,
        fontWeight: FontWeight.w500,
        color: onSurface,
      ),
      bodySmall: base.bodySmall?.copyWith(
        fontSize: 12.5,
        height: 1.45,
        fontWeight: FontWeight.w500,
        color: onSurfaceMuted,
      ),
      // Label
      labelLarge: base.labelLarge?.copyWith(
        fontSize: 14,
        height: 1.3,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
        color: onSurface,
      ),
      labelMedium: base.labelMedium?.copyWith(
        fontSize: 12,
        height: 1.3,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.4,
        color: onSurfaceMuted,
      ),
      labelSmall: base.labelSmall?.copyWith(
        fontSize: 10.5,
        height: 1.3,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.6,
        color: onSurfaceMuted,
      ),
    );
  }
}
