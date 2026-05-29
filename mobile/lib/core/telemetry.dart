import 'package:flutter/foundation.dart';

/// Lightweight event log. Today it's a structured `debugPrint`; tomorrow this
/// is the single place we'd wire a real analytics SDK (Mixpanel, PostHog,
/// Firebase) so callers don't change.
///
/// Conventions:
///   • `name` snake_case ("cart_add", "checkout_start", "search_run")
///   • `props` flat map of primitives — keep values short
///   • Surface user-facing actions and errors, not internal lifecycle ticks
class Telemetry {
  Telemetry._();

  static void event(String name, [Map<String, Object?> props = const {}]) {
    if (!kDebugMode) return;
    final body = props.isEmpty
        ? ''
        : ' ${props.entries.map((e) => '${e.key}=${e.value}').join(' ')}';
    debugPrint('[evt] $name$body');
  }

  static void error(String name, Object error, [Map<String, Object?> props = const {}]) {
    if (!kDebugMode) return;
    final body = props.isEmpty
        ? ''
        : ' ${props.entries.map((e) => '${e.key}=${e.value}').join(' ')}';
    debugPrint('[err] $name$body err=$error');
  }
}
