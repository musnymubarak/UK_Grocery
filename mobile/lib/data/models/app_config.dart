import 'announcement.dart';
import 'branding.dart';

/// Remote app configuration. Built from `GET /storefront/app-config`:
///
/// ```json
/// {
///   "feature_flags": {"<key>": bool},
///   "min_supported_version": {"ios": "1.0.0", "android": "1.0.0"},
///   "latest_version": {"ios": "1.2.0", "android": "1.2.0"},
///   "force_update": false,
///   "maintenance_mode": false,
///   "update_url": {"ios": "...", "android": "..."}
/// }
/// ```
///
/// Drives the startup version gate (`core/version_gate.dart`).
class AppConfig {
  AppConfig({
    this.featureFlags = const {},
    this.minIos = '0.0.0',
    this.minAndroid = '0.0.0',
    this.forceUpdate = false,
    this.maintenanceMode = false,
    this.updateUrlIos = '',
    this.updateUrlAndroid = '',
    this.content = const {},
    this.announcement,
    BrandingConfig? branding,
  }) : branding = branding ?? BrandingConfig.defaults();

  final Map<String, bool> featureFlags;
  final String minIos;
  final String minAndroid;
  final bool forceUpdate;
  final bool maintenanceMode;
  final String updateUrlIos;
  final String updateUrlAndroid;

  /// Admin-editable marketing copy keyed by dotted string (e.g.
  /// `home.rewards_title`). Source: `GET /storefront/app-config` → `content`.
  final Map<String, String> content;

  /// Active announcement bar (null when none). Source: `app-config` →
  /// `announcement` (already schedule-gated server-side).
  final Announcement? announcement;

  /// Admin-controlled branding (app name, logo, palette). Source: `app-config`
  /// → `branding`. Defaults to the built-in brand when absent.
  final BrandingConfig branding;

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    final flagsRaw = json['feature_flags'];
    final flags = <String, bool>{};
    if (flagsRaw is Map<String, dynamic>) {
      flagsRaw.forEach((key, value) {
        if (value is bool) flags[key] = value;
      });
    }

    final contentRaw = json['content'];
    final content = <String, String>{};
    if (contentRaw is Map) {
      contentRaw.forEach((key, value) {
        if (key is String && value != null) content[key] = value.toString();
      });
    }

    final minVersion = json['min_supported_version'];
    final updateUrl = json['update_url'];

    String pick(dynamic map, String key, String fallback) {
      if (map is Map<String, dynamic>) {
        final v = map[key];
        if (v is String && v.isNotEmpty) return v;
      }
      return fallback;
    }

    return AppConfig(
      featureFlags: flags,
      minIos: pick(minVersion, 'ios', '0.0.0'),
      minAndroid: pick(minVersion, 'android', '0.0.0'),
      forceUpdate: json['force_update'] as bool? ?? false,
      maintenanceMode: json['maintenance_mode'] as bool? ?? false,
      updateUrlIos: pick(updateUrl, 'ios', ''),
      updateUrlAndroid: pick(updateUrl, 'android', ''),
      content: content,
      announcement: Announcement.fromJson(json['announcement']),
      branding: BrandingConfig.fromJson(json['branding']),
    );
  }
}
