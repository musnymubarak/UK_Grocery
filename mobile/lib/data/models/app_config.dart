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
  const AppConfig({
    this.featureFlags = const {},
    this.minIos = '0.0.0',
    this.minAndroid = '0.0.0',
    this.forceUpdate = false,
    this.maintenanceMode = false,
    this.updateUrlIos = '',
    this.updateUrlAndroid = '',
  });

  final Map<String, bool> featureFlags;
  final String minIos;
  final String minAndroid;
  final bool forceUpdate;
  final bool maintenanceMode;
  final String updateUrlIos;
  final String updateUrlAndroid;

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    final flagsRaw = json['feature_flags'];
    final flags = <String, bool>{};
    if (flagsRaw is Map<String, dynamic>) {
      flagsRaw.forEach((key, value) {
        if (value is bool) flags[key] = value;
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
    );
  }
}
