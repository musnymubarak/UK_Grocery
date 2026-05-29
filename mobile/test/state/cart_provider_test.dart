import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dailygrocer_mobile/data/models/product.dart';
import 'package:dailygrocer_mobile/state/cart_provider.dart';

Product _p(String id, {double price = 1.0, double? promo, bool ageRestricted = false}) {
  return Product(
    id: id,
    name: 'Product $id',
    description: '',
    price: price,
    promoPrice: promo,
    unit: 'each',
    categoryId: 'c1',
    tag: 'tag',
    colorA: Colors.blue,
    colorB: Colors.blue,
    icon: Icons.shopping_basket_rounded,
    isAgeRestricted: ageRestricted,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('CartProvider', () {
    test('starts empty', () async {
      final cart = CartProvider();
      // Allow constructor's _hydrate() future to settle.
      await Future<void>.delayed(Duration.zero);
      expect(cart.items, isEmpty);
      expect(cart.itemCount, 0);
      expect(cart.subtotal, 0.0);
    });

    test('add increments quantity for the same product', () async {
      final cart = CartProvider();
      await Future<void>.delayed(Duration.zero);
      final p = _p('a', price: 2.5);
      cart.add(p);
      cart.add(p);
      cart.add(p);
      expect(cart.qtyOf('a'), 3);
      expect(cart.itemCount, 3);
      expect(cart.subtotal, closeTo(7.5, 0.001));
    });

    test('remove decrements then deletes line at zero', () async {
      final cart = CartProvider();
      await Future<void>.delayed(Duration.zero);
      final p = _p('a');
      cart.add(p);
      cart.add(p);
      cart.remove('a');
      expect(cart.qtyOf('a'), 1);
      cart.remove('a');
      expect(cart.qtyOf('a'), 0);
      expect(cart.items, isEmpty);
    });

    test('setQty replaces the line, 0 removes', () async {
      final cart = CartProvider();
      await Future<void>.delayed(Duration.zero);
      cart.add(_p('a'));
      cart.setQty('a', 5);
      expect(cart.qtyOf('a'), 5);
      cart.setQty('a', 0);
      expect(cart.qtyOf('a'), 0);
    });

    test('clear empties the cart', () async {
      final cart = CartProvider();
      await Future<void>.delayed(Duration.zero);
      cart.add(_p('a'));
      cart.add(_p('b'));
      cart.clear();
      expect(cart.items, isEmpty);
      expect(cart.subtotal, 0.0);
    });

    test('savings reflects promo difference times qty', () async {
      final cart = CartProvider();
      await Future<void>.delayed(Duration.zero);
      cart.add(_p('a', price: 3.0, promo: 2.0));
      cart.add(_p('a', price: 3.0, promo: 2.0));
      expect(cart.savings, closeTo(2.0, 0.001)); // £1 saved × 2 qty
    });

    test('hasAgeRestricted flips when an age-restricted line is added', () async {
      final cart = CartProvider();
      await Future<void>.delayed(Duration.zero);
      expect(cart.hasAgeRestricted, isFalse);
      cart.add(_p('beer', ageRestricted: true));
      expect(cart.hasAgeRestricted, isTrue);
      cart.remove('beer');
      expect(cart.hasAgeRestricted, isFalse);
    });

    test('persists across instances', () async {
      final first = CartProvider();
      await Future<void>.delayed(Duration.zero);
      first.add(_p('persist-me', price: 4.5));
      first.add(_p('persist-me', price: 4.5));
      // Wait for the async _persist() to flush to mock SharedPreferences.
      await Future<void>.delayed(Duration.zero);

      final second = CartProvider();
      await Future<void>.delayed(Duration.zero);
      expect(second.qtyOf('persist-me'), 2);
      expect(second.subtotal, closeTo(9.0, 0.001));
    });
  });
}
