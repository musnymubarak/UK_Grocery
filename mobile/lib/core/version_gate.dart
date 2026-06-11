import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../data/api/api_registry.dart';
import '../data/models/app_config.dart';
import '../screens/force_update/force_update_screen.dart';

/// Wraps the app and consults `GET /storefront/app-config` once at startup.
///
/// If the running build is below the backend's minimum supported version (or
/// the global `force_update` switch is on) it shows a blocking
/// [ForceUpdateScreen]; if `maintenance_mode` is on it shows the maintenance
/// variant. Any failure to reach app-config is non-fatal — the app proceeds
/// normally so a config outage never bricks the client.
class VersionGate extends StatefulWidget {
  const VersionGate({super.key, required this.child});

  final Widget child;

  @override
  State<VersionGate> createState() => _VersionGateState();
}

class _VersionGateState extends State<VersionGate> {
  bool _mustUpdate = false;
  bool _maintenance = false;
  String? _updateUrl;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      final AppConfig cfg = await Api.instance.catalog.getAppConfig();
      final pkg = await PackageInfo.fromPlatform();

      final isIos = defaultTargetPlatform == TargetPlatform.iOS;
      final minVersion = isIos ? cfg.minIos : cfg.minAndroid;
      final updateUrl = isIos ? cfg.updateUrlIos : cfg.updateUrlAndroid;

      final outdated = _isOlder(pkg.version, minVersion);
      if (!mounted) return;
      setState(() {
        _maintenance = cfg.maintenanceMode;
        _mustUpdate = !cfg.maintenanceMode && (outdated || cfg.forceUpdate);
        _updateUrl = updateUrl;
      });
    } catch (_) {
      // Non-fatal: leave the gate open.
    }
  }

  /// True when [current] is a strictly lower semantic version than [minimum].
  /// Defensive against missing/garbage components.
  static bool _isOlder(String current, String minimum) {
    final a = _parse(current);
    final b = _parse(minimum);
    for (var i = 0; i < 3; i++) {
      if (a[i] != b[i]) return a[i] < b[i];
    }
    return false;
  }

  static List<int> _parse(String v) {
    final core = v.split('+').first.split('-').first;
    final parts = core.split('.');
    int at(int i) =>
        i < parts.length ? (int.tryParse(parts[i].trim()) ?? 0) : 0;
    return [at(0), at(1), at(2)];
  }

  @override
  Widget build(BuildContext context) {
    if (_maintenance) {
      return ForceUpdateScreen(maintenance: true, onRetry: _check);
    }
    if (_mustUpdate) {
      return ForceUpdateScreen(updateUrl: _updateUrl);
    }
    return widget.child;
  }
}
