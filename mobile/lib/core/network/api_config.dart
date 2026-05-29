/// Resolves the backend base URL.
///
/// Priority:
///   1. `--dart-define=API_BASE_URL=...` — override for local dev or staging, e.g.
///      `--dart-define=API_BASE_URL=http://10.0.2.2:8000` (Android emulator) or
///      `http://localhost:8000` (desktop / iOS simulator).
///   2. Production: https://api.dailygrocer.co.uk
class ApiConfig {
  ApiConfig._();

  static const _explicit = String.fromEnvironment('API_BASE_URL');
  static const _prod = 'https://api.dailygrocer.co.uk';

  /// Production by default; pass `--dart-define=API_BASE_URL` to point at a local
  /// backend during development.
  static String get baseUrl => _explicit.isNotEmpty ? _explicit : _prod;

  static String get apiBase => '$baseUrl/api/v1';

  /// Resolve a relative `/uploads/...` URL coming from the backend.
  static String resolveUploadUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$baseUrl$path';
  }
}
