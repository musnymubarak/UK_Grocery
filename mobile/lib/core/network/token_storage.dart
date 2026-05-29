import 'package:shared_preferences/shared_preferences.dart';

/// Persists the customer JWT (+ refresh token) across app launches. Mirrors the
/// storefront's `customer_token` localStorage key.
class TokenStorage {
  static const _tokenKey = 'customer_token';
  static const _refreshKey = 'customer_refresh_token';

  String? _cached;
  String? _refreshCached;

  Future<String?> read() async {
    if (_cached != null) return _cached;
    final prefs = await SharedPreferences.getInstance();
    _cached = prefs.getString(_tokenKey);
    return _cached;
  }

  Future<String?> readRefresh() async {
    if (_refreshCached != null) return _refreshCached;
    final prefs = await SharedPreferences.getInstance();
    _refreshCached = prefs.getString(_refreshKey);
    return _refreshCached;
  }

  Future<void> write(String token, {String? refresh}) async {
    _cached = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    if (refresh != null && refresh.isNotEmpty) {
      _refreshCached = refresh;
      await prefs.setString(_refreshKey, refresh);
    }
  }

  Future<void> clear() async {
    _cached = null;
    _refreshCached = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshKey);
  }
}
