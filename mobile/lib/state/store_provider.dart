import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../core/network/api_exception.dart';
import '../data/api/api_registry.dart';
import '../data/models/store.dart';

/// Loads stores from `/storefront/stores` and exposes the user's choice.
///
/// Supports re-sorting by distance once the user grants location permission
/// (see [sortByDistance]).
class StoreProvider extends ChangeNotifier {
  StoreProvider() {
    refresh();
  }

  StoreLocation? _selected;
  List<StoreLocation> _all = const [];
  bool _loading = false;
  String? _error;
  bool _nearbyMode = false;

  StoreLocation? get selected => _selected;
  bool get hasStore => _selected != null;
  List<StoreLocation> get all => _all;
  bool get isLoading => _loading;
  String? get error => _error;

  /// `true` after [sortByDistance] has run with a real position. The UI uses
  /// this to switch labels from "X stores by name" to "X stores nearby".
  bool get nearbyMode => _nearbyMode;

  Future<void> refresh() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _all = await Api.instance.catalog.getStores();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (_) {
      _error = 'Could not load stores';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Re-rank the in-memory store list by Haversine distance to (lat, lng).
  /// Stores with null coordinates fall to the end.
  void sortByDistance(double lat, double lng) {
    if (_all.isEmpty) return;
    const metersPerMile = 1609.344;
    final ranked = _all.map((s) {
      if (s.lat == null || s.lng == null) {
        return s.copyWith(distanceMiles: double.infinity);
      }
      final meters = Geolocator.distanceBetween(lat, lng, s.lat!, s.lng!);
      return s.copyWith(distanceMiles: meters / metersPerMile);
    }).toList()
      ..sort((a, b) => a.distanceMiles.compareTo(b.distanceMiles));
    _all = ranked;
    _nearbyMode = true;
    notifyListeners();
  }

  void clearNearbyMode() {
    if (!_nearbyMode) return;
    _nearbyMode = false;
    notifyListeners();
  }

  void select(StoreLocation store) {
    _selected = store;
    notifyListeners();
  }

  void clearSelection() {
    _selected = null;
    notifyListeners();
  }
}
