import 'package:flutter/foundation.dart';

import '../core/network/api_exception.dart';
import '../data/api/api_registry.dart';
import '../data/models/home_layout.dart';

/// Loads the server-driven home layout and exposes it to [HomeScreen].
///
/// On any failure — network error, or an empty/section-less response — it
/// resolves to an empty layout. [HomeScreen] treats an empty layout as the
/// signal to paint its built-in hardcoded sections (hero banner + promo cards +
/// category grid), so Home always renders something useful even offline.
class HomeLayoutProvider extends ChangeNotifier {
  HomeLayout? _layout;
  bool _loading = false;
  String? _error;
  String? _lastStoreId;

  HomeLayout? get layout => _layout;
  bool get loading => _loading;
  String? get error => _error;
  bool get hasLoaded => _layout != null;

  /// Fetch the layout for [storeId]. If a layout is already present for this store
  /// and [force] is false, it returns immediately without refetching.
  Future<void> refresh(String? storeId, {bool force = false}) async {
    if (!force && _lastStoreId == storeId && _layout != null) {
      return;
    }
    _loading = true;
    _error = null;
    if (_lastStoreId != storeId) {
      _layout = null; // Clear previous store layout to prevent cross-store layout flash
    }
    _lastStoreId = storeId;
    notifyListeners();

    try {
      final layout = await Api.instance.catalog.getHomeLayout(storeId: storeId);
      // Ignore a stale response if the store changed mid-flight.
      if (_lastStoreId != storeId) return;
      _layout = layout;
    } on ApiException catch (e) {
      if (_lastStoreId != storeId) return;
      _error = e.message;
      _layout = const HomeLayout(sections: []);
    } catch (_) {
      if (_lastStoreId != storeId) return;
      _layout = const HomeLayout(sections: []);
    } finally {
      if (_lastStoreId == storeId) {
        _loading = false;
        notifyListeners();
      }
    }
  }
}
