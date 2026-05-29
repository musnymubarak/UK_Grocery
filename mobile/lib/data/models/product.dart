import 'package:flutter/material.dart';

/// Domain product. Built from the backend `/storefront/products` payload via
/// [Product.fromJson]. Visual properties (colorA/colorB/icon) are derived from
/// the product or its category, so the UI keeps its premium look even when the
/// API doesn't return imagery.
class Product {
  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.unit,
    required this.categoryId,
    required this.tag,
    required this.colorA,
    required this.colorB,
    required this.icon,
    this.promoPrice,
    this.memberPrice,
    this.rating = 4.6,
    this.reviewCount = 124,
    this.allergens = const [],
    this.isAgeRestricted = false,
    this.imageUrl,
    this.stock = 0,
    this.sku = '',
    this.categoryName,
  });

  final String id;
  final String name;
  final String description;
  final double price;
  final double? promoPrice;
  final double? memberPrice;
  final String unit;
  final String categoryId;
  final String tag;
  final Color colorA;
  final Color colorB;
  final IconData icon;
  final double rating;
  final int reviewCount;
  final List<String> allergens;
  final bool isAgeRestricted;
  final String? imageUrl;
  final int stock;
  final String sku;
  final String? categoryName;

  double get effectivePrice => promoPrice ?? price;
  bool get hasPromo => promoPrice != null && promoPrice! < price;

  /// Compact snapshot used to persist cart lines. We store the price
  /// at the time of add so totals don't shift between sessions; on next
  /// checkout the backend validates the actual price.
  Map<String, dynamic> toCartJson() => {
        'id': id,
        'name': name,
        'description': description,
        'price': price,
        if (promoPrice != null) 'promo_price': promoPrice,
        if (memberPrice != null) 'member_price': memberPrice,
        'unit': unit,
        'category_id': categoryId,
        'tag': tag,
        'is_age_restricted': isAgeRestricted,
        'allergens': allergens,
        if (imageUrl != null) 'image_url': imageUrl,
        'sku': sku,
        if (categoryName != null) 'category_name': categoryName,
      };

  factory Product.fromCartJson(Map<String, dynamic> json) {
    final palette = _paletteFor(json['category_name'] as String? ?? json['name'] as String? ?? '');
    final allergensRaw = json['allergens'];
    final List<String> allergens = switch (allergensRaw) {
      List<dynamic> list => list.map((e) => e.toString()).toList(),
      String s when s.isNotEmpty => [s],
      _ => const <String>[],
    };
    return Product(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Product',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      promoPrice: (json['promo_price'] as num?)?.toDouble(),
      memberPrice: (json['member_price'] as num?)?.toDouble(),
      unit: json['unit'] as String? ?? 'each',
      categoryId: json['category_id'] as String? ?? '',
      categoryName: json['category_name'] as String?,
      tag: json['tag'] as String? ?? 'Featured',
      colorA: palette.$1,
      colorB: palette.$2,
      icon: palette.$3,
      isAgeRestricted: json['is_age_restricted'] as bool? ?? false,
      allergens: allergens,
      imageUrl: json['image_url'] as String?,
      sku: json['sku'] as String? ?? '',
    );
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    final palette = _paletteFor(json['category_name'] as String? ?? json['name'] as String? ?? '');
    final allergensRaw = json['allergens'];
    final List<String> allergens = switch (allergensRaw) {
      List<dynamic> list => list.map((e) => e.toString()).toList(),
      String s when s.isNotEmpty => [s],
      _ => const <String>[],
    };
    final price = (json['price'] as num?)?.toDouble() ?? 0.0;
    final promo = (json['promo_price'] as num?)?.toDouble();
    return Product(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Product',
      description: json['description'] as String? ?? '',
      price: price,
      promoPrice: promo,
      memberPrice: (json['member_price'] as num?)?.toDouble(),
      unit: json['unit'] as String? ?? 'each',
      categoryId: json['category_id'] as String? ?? '',
      categoryName: json['category_name'] as String?,
      tag: promo != null && promo < price
          ? 'Save £${(price - promo).toStringAsFixed(2)}'
          : (json['country_of_origin'] as String? ?? 'Featured'),
      colorA: palette.$1,
      colorB: palette.$2,
      icon: palette.$3,
      isAgeRestricted: json['is_age_restricted'] as bool? ?? false,
      allergens: allergens,
      imageUrl: json['image_url'] as String?,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      sku: json['sku'] as String? ?? '',
    );
  }
}

/// Map a category/product name to (gradient-A, gradient-B, icon). Keeps the
/// premium tile aesthetic intact regardless of whether the backend ships
/// imagery.
(Color, Color, IconData) _paletteFor(String hint) {
  final h = hint.toLowerCase();
  if (h.contains('bakery') || h.contains('bread') || h.contains('cake')) {
    return (const Color(0xFFE4A148), const Color(0xFFA86519), Icons.bakery_dining_rounded);
  }
  if (h.contains('dairy') || h.contains('egg') || h.contains('milk')) {
    return (const Color(0xFF5970F5), const Color(0xFF1A2F9E), Icons.egg_alt_rounded);
  }
  if (h.contains('meat') || h.contains('poultry') || h.contains('beef') || h.contains('chicken')) {
    return (const Color(0xFFFF5A6A), const Color(0xFFA60A1F), Icons.set_meal_rounded);
  }
  if (h.contains('produce') || h.contains('fruit') || h.contains('veg')) {
    return (const Color(0xFF1ABF7B), const Color(0xFF067A4D), Icons.eco_rounded);
  }
  if (h.contains('frozen')) {
    return (const Color(0xFF42C5E0), const Color(0xFF1A6C84), Icons.ac_unit_rounded);
  }
  if (h.contains('beverage') || h.contains('drink') || h.contains('coffee') || h.contains('tea')) {
    return (const Color(0xFFE26B43), const Color(0xFF913317), Icons.local_cafe_rounded);
  }
  if (h.contains('household') || h.contains('clean')) {
    return (const Color(0xFF7C849D), const Color(0xFF3A4365), Icons.home_rounded);
  }
  if (h.contains('chocolate') || h.contains('sweet') || h.contains('snack')) {
    return (const Color(0xFFB17AE7), const Color(0xFF6532A6), Icons.cake_rounded);
  }
  return (const Color(0xFF2747D8), const Color(0xFF0F1E6E), Icons.shopping_basket_rounded);
}
