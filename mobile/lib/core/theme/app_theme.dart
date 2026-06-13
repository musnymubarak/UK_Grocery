import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light({
    Color? brandPrimary,
    Color? brandAction,
    Color? brandAccent,
  }) {
    const surface = AppColors.neutral0; // white cards
    const background = AppColors.neutral50; // #f8f9fa page background
    const onSurface = AppColors.neutral900; // #191c1d
    const onSurfaceMuted = AppColors.neutral700; // #44474e

    final scheme = ColorScheme.light(
      primary: brandAccent ?? AppColors.blue600, // action-blue #0056b3
      onPrimary: AppColors.neutral0,
      secondary: brandAction ?? AppColors.red500, // action-red #e6203a
      onSecondary: AppColors.neutral0,
      tertiary: brandPrimary ?? AppColors.blue900, // navy #001d3d
      surface: surface,
      onSurface: onSurface,
      surfaceContainerLowest: AppColors.neutral0,
      surfaceContainerLow: AppColors.neutral50,
      surfaceContainer: AppColors.neutral100,
      surfaceContainerHigh: AppColors.neutral200,
      surfaceContainerHighest: AppColors.neutral300,
      onSurfaceVariant: onSurfaceMuted,
      outline: AppColors.neutral600, // #74777f
      outlineVariant: AppColors.neutral400, // #c4c6cf hairline
      error: AppColors.red600,
      onError: AppColors.neutral0,
    );

    return _base(scheme, background, onSurface, onSurfaceMuted);
  }

  static ThemeData dark() {
    const surface = Color(0xFF0A1132);
    const background = Color(0xFF050922);
    const onSurface = Color(0xFFEFF1FF);
    const onSurfaceMuted = Color(0xFFA8B0C6);

    final scheme = const ColorScheme.dark(
      primary: AppColors.blue400,
      onPrimary: AppColors.neutral0,
      secondary: AppColors.red400,
      onSecondary: AppColors.neutral0,
      tertiary: AppColors.blue300,
      surface: surface,
      onSurface: onSurface,
      surfaceContainerLowest: Color(0xFF050922),
      surfaceContainerLow: Color(0xFF0A1132),
      surfaceContainer: Color(0xFF101A45),
      surfaceContainerHigh: Color(0xFF18234E),
      surfaceContainerHighest: Color(0xFF1E2A5C),
      onSurfaceVariant: onSurfaceMuted,
      outline: Color(0xFF1E2A5C),
      outlineVariant: Color(0xFF101A45),
      error: AppColors.red400,
      onError: AppColors.neutral0,
    );

    return _base(scheme, background, onSurface, onSurfaceMuted, isDark: true);
  }

  static ThemeData _base(
    ColorScheme scheme,
    Color background,
    Color onSurface,
    Color onSurfaceMuted, {
    bool isDark = false,
  }) {
    final textTheme = AppTypography.textTheme(onSurface, onSurfaceMuted);
    return ThemeData(
      useMaterial3: true,
      brightness: scheme.brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      canvasColor: scheme.surface,
      splashFactory: InkSparkle.splashFactory,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      fontFamily: textTheme.bodyMedium?.fontFamily,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent)
            : SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
        titleTextStyle: textTheme.headlineSmall,
        iconTheme: IconThemeData(color: onSurface),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          side: BorderSide(color: scheme.outlineVariant),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      iconTheme: IconThemeData(color: onSurface, size: 22),
      dividerTheme: DividerThemeData(
        color: scheme.outlineVariant,
        thickness: 1,
        space: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainerLow,
        hintStyle: textTheme.bodyMedium?.copyWith(color: onSurfaceMuted),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.base,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          borderSide: BorderSide(color: scheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          borderSide: BorderSide(color: scheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          borderSide: BorderSide(color: scheme.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          borderSide: BorderSide(color: scheme.error),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          textStyle: textTheme.labelLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          foregroundColor: scheme.primary,
          side: BorderSide(color: scheme.outline),
          textStyle: textTheme.labelLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: scheme.primary,
          textStyle: textTheme.labelLarge,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? const Color(0xFF18234E) : AppColors.neutral900,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surfaceContainerLow,
        selectedColor: scheme.primary,
        labelStyle: textTheme.labelMedium!,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        ),
        side: BorderSide(color: scheme.outline),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        elevation: 0,
        modalElevation: 0,
        showDragHandle: true,
        dragHandleColor: scheme.outline,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppSpacing.radiusXxl),
          ),
        ),
      ),
    );
  }
}
