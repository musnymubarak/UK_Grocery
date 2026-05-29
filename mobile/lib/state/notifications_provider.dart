import 'package:flutter/foundation.dart';

import '../core/network/api_exception.dart';
import '../data/api/api_registry.dart';
import '../data/models/notification.dart';

/// Holds the customer notification inbox + unread count. The unread count
/// drives the bottom-nav badge, so it is kept in sync on read/refresh.
class NotificationsProvider extends ChangeNotifier {
  List<AppNotification>? _items;
  int _unreadCount = 0;
  bool _loading = false;
  String? _error;

  List<AppNotification>? get items => _items;
  int get unreadCount => _unreadCount;
  bool get loading => _loading;
  String? get error => _error;

  /// Lightweight badge refresh — safe to call on launch / tab focus.
  Future<void> loadCount() async {
    try {
      _unreadCount = await Api.instance.notifications.unreadCount();
      notifyListeners();
    } catch (_) {
      // Badge is best-effort; ignore failures.
    }
  }

  Future<void> refresh() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final list = await Api.instance.notifications.list();
      _items = list;
      _unreadCount = list.where((n) => !n.isRead).length;
      _loading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      _loading = false;
      notifyListeners();
    } catch (_) {
      _error = "Couldn't load notifications";
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    final list = _items;
    if (list != null) {
      final idx = list.indexWhere((n) => n.id == id);
      if (idx != -1 && !list[idx].isRead) {
        list[idx] = list[idx].copyWith(isRead: true);
        if (_unreadCount > 0) _unreadCount--;
        notifyListeners();
      }
    }
    try {
      await Api.instance.notifications.markRead(id);
    } catch (_) {
      // Optimistic — server will reconcile on next refresh.
    }
  }

  Future<void> markAllRead() async {
    final list = _items;
    if (list != null) {
      _items = [for (final n in list) n.isRead ? n : n.copyWith(isRead: true)];
    }
    _unreadCount = 0;
    notifyListeners();
    try {
      await Api.instance.notifications.markAllRead();
    } catch (_) {
      // Optimistic.
    }
  }

  /// Clear local state on sign-out so a new account doesn't see stale data.
  void reset() {
    _items = null;
    _unreadCount = 0;
    _error = null;
    notifyListeners();
  }
}
