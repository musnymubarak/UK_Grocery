import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists the customer JWT (+ refresh token) across app launches. Mirrors the
/// storefront's `customer_token` localStorage key.
///
/// Backed by the platform Keychain (iOS) / Keystore (Android) via
/// flutter_secure_storage, not SharedPreferences — SharedPreferences on
/// Android is an unencrypted XML file and on iOS an unencrypted plist, both
/// readable on a rooted/jailbroken device or from an unencrypted backup. The
/// refresh token in particular has a long effective lifetime, so it's worth
/// the stronger storage.
class TokenStorage {
  static const _tokenKey = 'customer_token';
  static const _refreshKey = 'customer_refresh_token';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  String? _cached;
  String? _refreshCached;

  Future<String?> read() async {
    if (_cached != null) return _cached;
    _cached = await _storage.read(key: _tokenKey);
    return _cached;
  }

  Future<String?> readRefresh() async {
    if (_refreshCached != null) return _refreshCached;
    _refreshCached = await _storage.read(key: _refreshKey);
    return _refreshCached;
  }

  Future<void> write(String token, {String? refresh}) async {
    _cached = token;
    await _storage.write(key: _tokenKey, value: token);
    if (refresh != null && refresh.isNotEmpty) {
      _refreshCached = refresh;
      await _storage.write(key: _refreshKey, value: refresh);
    }
  }

  Future<void> clear() async {
    _cached = null;
    _refreshCached = null;
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshKey);
  }
}
