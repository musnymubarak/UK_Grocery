import 'package:flutter_test/flutter_test.dart';

import 'package:dailygrocer_mobile/data/models/store.dart';

void main() {
  group('StoreLocation.fromJson', () {
    test('parses full backend payload', () {
      final s = StoreLocation.fromJson({
        'id': '7c4',
        'name': 'Daily Grocer · Mayfair',
        'address': '12 Berkeley Square',
        'city': 'London',
        'postcode': 'W1J 6BR',
        'is_open': true,
        'min_order_value': 15.0,
        'free_delivery_threshold': 40.0,
        'delivery_fee': 2.99,
        'lat': 51.5074,
        'lng': -0.1278,
        'logo_url': '/uploads/stores/mayfair.png',
        'banner_url': null,
      });
      expect(s.id, '7c4');
      expect(s.name, 'Daily Grocer · Mayfair');
      expect(s.address, '12 Berkeley Square');
      expect(s.city, 'London');
      expect(s.postcode, 'W1J 6BR');
      expect(s.isOpen, isTrue);
      expect(s.minOrderValue, 15.0);
      expect(s.freeDeliveryThreshold, 40.0);
      expect(s.defaultDeliveryFee, 2.99);
      expect(s.lat, 51.5074);
      expect(s.lng, -0.1278);
      expect(s.logoUrl, '/uploads/stores/mayfair.png');
      expect(s.bannerUrl, isNull);
      expect(s.distanceMiles, 0.0);
    });

    test('fills sensible defaults when fields are missing', () {
      final s = StoreLocation.fromJson({'id': '1', 'name': 'Bare Store'});
      expect(s.address, '');
      expect(s.city, '');
      expect(s.postcode, '');
      expect(s.isOpen, isTrue);
      expect(s.minOrderValue, 0.0);
      expect(s.freeDeliveryThreshold, 30.0);
      expect(s.defaultDeliveryFee, 0.0);
      expect(s.lat, isNull);
      expect(s.lng, isNull);
      expect(s.openUntil, '22:00');
    });

    test('copyWith only overrides supplied fields', () {
      final original = StoreLocation.fromJson({
        'id': 'x',
        'name': 'X',
        'is_open': true,
        'free_delivery_threshold': 30.0,
      });
      final ranked = original.copyWith(distanceMiles: 2.5);
      expect(ranked.id, original.id);
      expect(ranked.name, original.name);
      expect(ranked.isOpen, original.isOpen);
      expect(ranked.distanceMiles, 2.5);

      final closed = original.copyWith(isOpen: false);
      expect(closed.isOpen, isFalse);
      expect(closed.distanceMiles, original.distanceMiles);
    });
  });
}
