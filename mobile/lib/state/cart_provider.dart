import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/telemetry.dart';
import '../data/models/product.dart';

class CartLine {
  CartLine({required this.product, this.qty = 1});
  final Product product;
  int qty;
  double get subtotal => product.effectivePrice * qty;

  Map<String, dynamic> toJson() => {
        'product': product.toCartJson(),
        'qty': qty,
      };

  factory CartLine.fromJson(Map<String, dynamic> json) => CartLine(
        product: Product.fromCartJson(json['product'] as Map<String, dynamic>),
        qty: (json['qty'] as num?)?.toInt() ?? 1,
      );
}

/// In-memory cart, mirrored to SharedPreferences on every change so the
/// basket survives cold restarts. Stores a price snapshot per product —
/// final totals are revalidated against the backend at checkout.
class CartProvider extends ChangeNotifier {
  CartProvider() {
    _hydrate();
  }

  static const _storageKey = 'cart_v1';
  final Map<String, CartLine> _items = {};
  bool _hydrated = false;

  List<CartLine> get items => _items.values.toList(growable: false);
  int get itemCount => _items.values.fold(0, (s, l) => s + l.qty);
  double get subtotal => _items.values.fold(0, (s, l) => s + l.subtotal);
  double get savings => _items.values.fold(0, (s, l) {
        if (!l.product.hasPromo) return s;
        return s + (l.product.price - l.product.effectivePrice) * l.qty;
      });

  bool get hasAgeRestricted =>
      _items.values.any((l) => l.product.isAgeRestricted);

  int qtyOf(String productId) => _items[productId]?.qty ?? 0;

  Future<void> _hydrate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) {
        _hydrated = true;
        return;
      }
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        for (final entry in decoded) {
          if (entry is Map<String, dynamic>) {
            final line = CartLine.fromJson(entry);
            _items[line.product.id] = line;
          }
        }
      }
    } catch (e) {
      // Stored format mismatch / corrupt blob — start clean.
      debugPrint('cart hydrate failed: $e');
    } finally {
      _hydrated = true;
      notifyListeners();
    }
  }

  Future<void> _persist() async {
    if (!_hydrated) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final payload = jsonEncode(_items.values.map((l) => l.toJson()).toList());
      await prefs.setString(_storageKey, payload);
    } catch (e) {
      debugPrint('cart persist failed: $e');
    }
  }

  void add(Product product) {
    final existing = _items[product.id];
    if (existing == null) {
      _items[product.id] = CartLine(product: product);
    } else {
      existing.qty += 1;
    }
    Telemetry.event('cart_add', {
      'pid': product.id,
      'qty': _items[product.id]!.qty,
      'total_items': itemCount,
    });
    notifyListeners();
    _persist();
  }

  void remove(String productId) {
    final l = _items[productId];
    if (l == null) return;
    if (l.qty > 1) {
      l.qty -= 1;
    } else {
      _items.remove(productId);
    }
    notifyListeners();
    _persist();
  }

  void setQty(String productId, int qty) {
    if (qty <= 0) {
      _items.remove(productId);
    } else {
      final l = _items[productId];
      if (l != null) l.qty = qty;
    }
    notifyListeners();
    _persist();
  }

  void clear() {
    _items.clear();
    notifyListeners();
    _persist();
  }
}
