import 'dart:io';

import 'package:flutter/foundation.dart';

/// Resolve the backend base URL.
///
/// Priority:
///   1. `--dart-define=API_BASE_URL=...` (most flexible, works everywhere)
///   2. Platform default:
///      - Android emulator → 10.0.2.2 (loopback to host)
///      - Otherwise → localhost:8000 (Windows/macOS/iOS-sim/web)
///
/// For a physical device on the same Wi-Fi, pass `--dart-define`:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.42:8000
class ApiConfig {
  ApiConfig._();

  static const _explicit = String.fromEnvironment('API_BASE_URL');

  /// Production backend. Release builds (App Store / Play Store) hit this by
  /// default; debug/profile builds talk to a local backend. An explicit
  /// `--dart-define=API_BASE_URL` overrides everything.
  static const _prod = 'https://api.dailygrocer.co.uk';

  static String get baseUrl {
    if (_explicit.isNotEmpty) return _explicit;
    if (kReleaseMode) return _prod;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:8000';
    return 'http://localhost:8000';
  }

  static String get apiBase => '$baseUrl/api/v1';

  /// Resolve a relative `/uploads/...` URL coming from the backend.
  static String resolveUploadUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$baseUrl$path';
  }
}
