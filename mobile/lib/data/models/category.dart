import 'package:flutter/material.dart';

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.icon,
    required this.colorA,
    required this.colorB,
    required this.subtitle,
    required this.assetImage,
    this.imageUrl,
    this.parentId,
  });

  final String id;
  final String name;
  final String subtitle;
  final IconData icon;
  final Color colorA;
  final Color colorB;
  final String assetImage;
  final String? imageUrl;
  final String? parentId;

  factory Category.fromJson(Map<String, dynamic> json) {
    final name = json['name'] as String? ?? 'Aisle';
    final palette = _paletteFor(name);
    return Category(
      id: json['id'] as String,
      name: name,
      subtitle: (json['description'] as String?)?.trim().isNotEmpty == true
          ? json['description'] as String
          : 'Browse the aisle',
      icon: palette.icon,
      colorA: palette.colorA,
      colorB: palette.colorB,
      assetImage: palette.asset,
      imageUrl: json['image_url'] as String?,
      parentId: json['parent_id'] as String?,
    );
  }
}

class _CatPalette {
  const _CatPalette(this.colorA, this.colorB, this.icon, this.asset);
  final Color colorA;
  final Color colorB;
  final IconData icon;
  final String asset;
}

/// Map a category name to a colour palette, fallback icon, and bundled image
/// asset. Falls through to a generic gradient + the `food.webp` image when no
/// keyword matches — mirrors the storefront's behaviour of showing a default
/// arrangement when a category has no dedicated artwork.
_CatPalette _paletteFor(String hint) {
  final h = hint.toLowerCase();
  String asset(String name) => 'assets/categories/$name.webp';

  if (h.contains('confection') || h.contains('sweet') || h.contains('chocolate')) {
    return _CatPalette(
      const Color(0xFFE3105D),
      const Color(0xFFA10742),
      Icons.cake_rounded,
      asset('food'),
    );
  }
  if (h.contains('crisp') || h.contains('snack') || h.contains('chip')) {
    return _CatPalette(
      const Color(0xFFE63F1A),
      const Color(0xFFA52310),
      Icons.fastfood_rounded,
      asset('food'),
    );
  }
  if (h.contains('produce') || h.contains('fresh') || h.contains('fruit') || h.contains('veg')) {
    return _CatPalette(
      const Color(0xFF1ABF7B),
      const Color(0xFF067A4D),
      Icons.eco_rounded,
      asset('produce'),
    );
  }
  if (h.contains('frozen')) {
    return _CatPalette(
      const Color(0xFF1B9AE8),
      const Color(0xFF1F4DD9),
      Icons.ac_unit_rounded,
      asset('frozen'),
    );
  }
  if (h.contains('grocery') || h.contains('pantry') || h.contains('food cupboard')) {
    return _CatPalette(
      const Color(0xFFD63A0F),
      const Color(0xFF82200A),
      Icons.kitchen_rounded,
      asset('pantry'),
    );
  }
  if (h.contains('health') || h.contains('beauty')) {
    return _CatPalette(
      const Color(0xFF0FBFA3),
      const Color(0xFF086B5B),
      Icons.spa_rounded,
      asset('food'),
    );
  }
  if (h.contains('household') || h.contains('clean')) {
    return _CatPalette(
      const Color(0xFF9333EA),
      const Color(0xFF5B179D),
      Icons.home_rounded,
      asset('household'),
    );
  }
  if (h.contains('meat') || h.contains('poultry') || h.contains('butcher')) {
    return _CatPalette(
      const Color(0xFFB91414),
      const Color(0xFF6B0B0B),
      Icons.set_meal_rounded,
      asset('meat'),
    );
  }
  if (h.contains('pet')) {
    return _CatPalette(
      const Color(0xFFE85316),
      const Color(0xFFA52310),
      Icons.pets_rounded,
      asset('food'),
    );
  }
  if (h.contains('seasonal') || h.contains('offer')) {
    return _CatPalette(
      const Color(0xFFE63F1A),
      const Color(0xFFA52310),
      Icons.celebration_rounded,
      asset('food'),
    );
  }
  if (h.contains('soft') || h.contains('drink') || h.contains('juice') || h.contains('beverage')) {
    return _CatPalette(
      const Color(0xFFE63F1A),
      const Color(0xFF991F0F),
      Icons.local_cafe_rounded,
      asset('beverages'),
    );
  }
  if (h.contains('tobacco') || h.contains('vape')) {
    return _CatPalette(
      const Color(0xFFE63F1A),
      const Color(0xFF991F0F),
      Icons.smoking_rooms_rounded,
      asset('food'),
    );
  }
  if (h.contains('world')) {
    return _CatPalette(
      const Color(0xFFE63F1A),
      const Color(0xFF991F0F),
      Icons.public_rounded,
      asset('food'),
    );
  }
  if (h.contains('alcohol') || h.contains('wine') || h.contains('beer') || h.contains('spirit')) {
    return _CatPalette(
      const Color(0xFFB91414),
      const Color(0xFF5C0808),
      Icons.local_bar_rounded,
      asset('food'),
    );
  }
  if (h.contains('baby') || h.contains('toddler')) {
    return _CatPalette(
      const Color(0xFF3B82F6),
      const Color(0xFF7C3AED),
      Icons.child_friendly_rounded,
      asset('food'),
    );
  }
  if (h.contains('bakery') || h.contains('bread')) {
    return _CatPalette(
      const Color(0xFFE07B1F),
      const Color(0xFF8A4106),
      Icons.bakery_dining_rounded,
      asset('bakery'),
    );
  }
  if (h.contains('dairy') || h.contains('egg') || h.contains('milk')) {
    return _CatPalette(
      const Color(0xFF5970F5),
      const Color(0xFF1A2F9E),
      Icons.egg_alt_rounded,
      asset('dairy'),
    );
  }
  return _CatPalette(
    const Color(0xFF2747D8),
    const Color(0xFF0F1E6E),
    Icons.local_grocery_store_rounded,
    asset('food'),
  );
}
