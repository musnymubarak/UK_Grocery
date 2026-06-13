import 'package:flutter/material.dart';

/// Admin-controlled branding from `GET /storefront/app-config` → `branding`:
///
/// ```json
/// {
///   "app_name": "Daily Grocer",
///   "logo_url": "",
///   "colors": {"primary": "#001d3d", "action": "#e6203a", "accent": "#0056b3"}
/// }
/// ```
///
/// `logo_url` may be empty, a relative `/uploads/branding/x.png` path, or a full
/// URL. Drives the app title, theme palette and the home-header logo. Always
/// falls back to the built-in defaults so a missing/garbage config never breaks
/// the brand.
class BrandingConfig {
  const BrandingConfig._({
    required this.appName,
    required this.logoUrl,
    required this.primary,
    required this.action,
    required this.accent,
  });

  /// Brand display name (app title + header fallback text).
  final String appName;

  /// Logo image URL (empty, relative `/uploads/...`, or absolute).
  final String logoUrl;

  /// Navy structure colour (maps to `tertiary` in the theme).
  final Color primary;

  /// Action-red CTA colour (maps to `secondary` in the theme).
  final Color action;

  /// Action-blue accent colour (maps to `primary` in the theme).
  final Color accent;

  /// Built-in defaults, mirroring the storefront palette.
  factory BrandingConfig.defaults() => const BrandingConfig._(
        appName: 'Daily Grocer',
        logoUrl: '',
        primary: Color(0xFF001D3D),
        action: Color(0xFFE6203A),
        accent: Color(0xFF0056B3),
      );

  /// Build from the `branding` JSON object, falling back to [defaults] for any
  /// missing or invalid field (and when [json] isn't a Map at all).
  factory BrandingConfig.fromJson(dynamic json) {
    if (json is! Map) return BrandingConfig.defaults();
    final defaults = BrandingConfig.defaults();

    final appNameRaw = json['app_name'];
    final logoRaw = json['logo_url'];
    final colors = json['colors'];

    final colorsMap = colors is Map ? colors : const {};

    return BrandingConfig._(
      appName: appNameRaw is String && appNameRaw.isNotEmpty
          ? appNameRaw
          : defaults.appName,
      logoUrl: logoRaw is String ? logoRaw : defaults.logoUrl,
      primary: _hex(colorsMap['primary'], defaults.primary),
      action: _hex(colorsMap['action'], defaults.action),
      accent: _hex(colorsMap['accent'], defaults.accent),
    );
  }

  /// Parse a `#rrggbb` (or `rrggbb`) hex string into a [Color], returning
  /// [fallback] on anything invalid.
  static Color _hex(dynamic v, Color fallback) {
    if (v is! String) return fallback;
    var s = v.trim();
    if (s.startsWith('#')) s = s.substring(1);
    if (s.length != 6) return fallback;
    final value = int.tryParse(s, radix: 16);
    if (value == null) return fallback;
    return Color(0xFF000000 | value);
  }
}
