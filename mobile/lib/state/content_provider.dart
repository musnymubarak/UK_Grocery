import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/announcement.dart';

/// Holds admin-editable marketing copy fetched from `GET /storefront/app-config`
/// (the `content` map) plus the active announcement bar. Populated once at
/// startup by the version gate.
///
/// Screens read a string via [t], passing the current hardcoded text as a
/// fallback so the UI is never blank when a key is missing or the config is
/// unreachable.
class ContentProvider extends ChangeNotifier {
  ContentProvider() {
    _loadDismissed();
  }

  static const _dismissPrefKey = 'dismissed_announcement';

  Map<String, String> _content = {};
  Announcement? _announcement;
  String? _dismissedKey;

  /// Replace the whole content map and notify listeners.
  void setContent(Map<String, String> c) {
    _content = c;
    notifyListeners();
  }

  /// Set (or clear) the active announcement and notify listeners.
  void setAnnouncement(Announcement? a) {
    _announcement = a;
    notifyListeners();
  }

  /// The announcement to actually render — null when there is none, or when the
  /// current one was already dismissed by this user.
  Announcement? get announcement {
    final a = _announcement;
    if (a == null) return null;
    if (a.dismissible && _dismissedKey == a.key) return null;
    return a;
  }

  /// Hide the current announcement and remember it (per-content key) so it stays
  /// dismissed across app restarts until the admin changes the message.
  Future<void> dismissAnnouncement() async {
    final a = _announcement;
    if (a == null) return;
    _dismissedKey = a.key;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_dismissPrefKey, a.key);
    } catch (_) {/* non-fatal */}
  }

  Future<void> _loadDismissed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _dismissedKey = prefs.getString(_dismissPrefKey);
      notifyListeners();
    } catch (_) {/* non-fatal */}
  }

  /// Return the admin-provided value for [key], or [fallback] when the key is
  /// missing or maps to an empty string.
  String t(String key, String fallback) =>
      _content[key]?.isNotEmpty == true ? _content[key]! : fallback;
}
