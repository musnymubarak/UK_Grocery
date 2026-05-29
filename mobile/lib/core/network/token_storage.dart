import 'package:shared_preferences/shared_preferences.dart';

/// Persists the customer JWT across app launches. Mirrors the storefront's
/// `localStorage.getItem('customer_token')` pattern.
class TokenStorage {
  static const _tokenKey = 'customer_token';

  String? _cached;

  Future<String?> read() async {
    if (_cached != null) return _cached;
    final prefs = await SharedPreferences.getInstance();
    _cached = prefs.getString(_tokenKey);
    return _cached;
  }

  Future<void> write(String token) async {
    _cached = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clear() async {
    _cached = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }
}
