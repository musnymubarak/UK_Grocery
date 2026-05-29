import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Typography matching the storefront: Hanken Grotesk for headings/display,
/// Inter for body + labels.
class AppTypography {
  AppTypography._();

  static TextTheme textTheme(Color onSurface, Color onSurfaceMuted) {
    TextStyle heading(double size, FontWeight weight, {double? letter, double? lineH}) =>
        GoogleFonts.hankenGrotesk(
          fontSize: size,
          fontWeight: weight,
          letterSpacing: letter,
          height: lineH,
          color: onSurface,
        );

    TextStyle body(double size, FontWeight weight, {double? letter, double? lineH, Color? color}) =>
        GoogleFonts.inter(
          fontSize: size,
          fontWeight: weight,
          letterSpacing: letter,
          height: lineH,
          color: color ?? onSurface,
        );

    return TextTheme(
      displayLarge: heading(48, FontWeight.w800, letter: -1.0, lineH: 1.05),
      displayMedium: heading(36, FontWeight.w800, letter: -0.6, lineH: 1.08),
      displaySmall: heading(28, FontWeight.w700, letter: -0.4, lineH: 1.15),
      headlineLarge: heading(24, FontWeight.w700, letter: -0.3, lineH: 1.2),
      headlineMedium: heading(20, FontWeight.w700, letter: -0.2, lineH: 1.25),
      headlineSmall: heading(18, FontWeight.w700, letter: -0.1, lineH: 1.3),
      titleLarge: heading(17, FontWeight.w700, lineH: 1.35),
      titleMedium: body(15, FontWeight.w600, lineH: 1.4),
      titleSmall: body(13, FontWeight.w600, lineH: 1.4, color: onSurfaceMuted),
      bodyLarge: body(16, FontWeight.w400, lineH: 1.5),
      bodyMedium: body(14, FontWeight.w400, lineH: 1.5),
      bodySmall: body(12.5, FontWeight.w400, lineH: 1.45, color: onSurfaceMuted),
      labelLarge: body(14, FontWeight.w600, letter: 0.1),
      labelMedium: body(12, FontWeight.w600, letter: 0.3, color: onSurfaceMuted),
      labelSmall: body(10.5, FontWeight.w700, letter: 0.5, color: onSurfaceMuted),
    );
  }
}
