import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Most-recent-N (default 8) search terms, deduped, MRU-first.
/// Stored as a single comma-separated string under `recent_searches_v1`.
/// Comma is safe — search terms are user-typed and don't contain commas in
/// practice; entries with commas are sanitised on the way in.
class RecentSearches {
  RecentSearches._();
  static final RecentSearches instance = RecentSearches._();

  static const _storageKey = 'recent_searches_v1';
  static const _maxEntries = 8;

  List<String> _items = const [];
  bool _hydrated = false;

  List<String> get items => List.unmodifiable(_items);

  Future<void> hydrate() async {
    if (_hydrated) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey) ?? '';
      _items = raw
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList(growable: false);
    } catch (e) {
      debugPrint('recent searches hydrate failed: $e');
      _items = const [];
    } finally {
      _hydrated = true;
    }
  }

  Future<void> remember(String term) async {
    final clean = term.trim().replaceAll(',', '').toLowerCase();
    if (clean.isEmpty || clean.length < 2) return;
    await hydrate();
    final next = [clean, ..._items.where((s) => s != clean)].take(_maxEntries).toList();
    _items = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, next.join(','));
    } catch (e) {
      debugPrint('recent searches persist failed: $e');
    }
  }

  Future<void> clear() async {
    _items = const [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
}
