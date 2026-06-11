import 'category.dart';
import 'product.dart';
import 'section_action.dart';

/// The server-driven home layout. Built from the backend
/// `GET /storefront/home-layout` payload: `{ "sections": [ ResolvedSection ] }`.
///
/// Sections are already resolved server-side — product/category sections ship
/// their items inline, so the client only renders.
class HomeLayout {
  const HomeLayout({required this.sections});

  final List<HomeSection> sections;

  bool get isEmpty => sections.isEmpty;

  factory HomeLayout.fromJson(Map<String, dynamic> json) {
    final raw = json['sections'] as List<dynamic>? ?? const [];
    return HomeLayout(
      sections: raw
          .whereType<Map<String, dynamic>>()
          .map(HomeSection.fromJson)
          .toList(),
    );
  }
}

/// One resolved section in the home layout.
///
/// `type` is one of `hero_slider`, `banner_strip`, `promo_grid`,
/// `product_carousel`, `category_grid`. The shape of [config] depends on
/// [type]; the typed accessors below pull the relevant pieces out safely.
class HomeSection {
  const HomeSection({
    required this.id,
    required this.type,
    this.title,
    this.subtitle,
    this.config = const {},
  });

  final String id;
  final String type;
  final String? title;
  final String? subtitle;
  final Map<String, dynamic> config;

  factory HomeSection.fromJson(Map<String, dynamic> json) {
    return HomeSection(
      id: (json['id'] ?? '').toString(),
      type: (json['type'] as String? ?? '').trim(),
      title: json['title'] as String?,
      subtitle: json['subtitle'] as String?,
      config: (json['config'] as Map<String, dynamic>?) ?? const {},
    );
  }

  // --- Typed accessors over [config] ---------------------------------------

  /// Banner/promo/hero auto-advance toggle.
  bool get autoplay => config['autoplay'] as bool? ?? false;

  /// Auto-advance interval in milliseconds (defaults to 5s).
  int get intervalMs => (config['interval_ms'] as num?)?.toInt() ?? 5000;

  /// Grid column count (category_grid / promo_grid). Defaults to 2.
  int get columns => (config['columns'] as num?)?.toInt() ?? 2;

  /// Raw section items for hero/banner/promo sections.
  List<SectionItem> get items {
    final raw = config['items'] as List<dynamic>? ?? const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map(SectionItem.fromJson)
        .toList();
  }

  /// Resolved products for `product_carousel`.
  List<Product> get products {
    final raw = config['items'] as List<dynamic>? ?? const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map(Product.fromJson)
        .toList();
  }

  /// Resolved categories for `category_grid`.
  List<Category> get categories {
    final raw = config['items'] as List<dynamic>? ?? const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map(Category.fromJson)
        .toList();
  }

  /// "See all" action for a `product_carousel`, if any.
  SectionAction? get seeAll {
    final raw = config['see_all'];
    if (raw is Map<String, dynamic>) return SectionAction.fromJson(raw);
    return null;
  }
}

/// A single banner/promo/hero item inside a section's `items` list.
class SectionItem {
  const SectionItem({
    this.imageUrl,
    this.title,
    this.subtitle,
    this.badge,
    this.action,
  });

  final String? imageUrl;
  final String? title;
  final String? subtitle;
  final String? badge;
  final SectionAction? action;

  factory SectionItem.fromJson(Map<String, dynamic> json) {
    final actionRaw = json['action'];
    return SectionItem(
      imageUrl: json['image_url'] as String?,
      title: json['title'] as String?,
      subtitle: json['subtitle'] as String?,
      badge: json['badge'] as String?,
      action: actionRaw is Map<String, dynamic>
          ? SectionAction.fromJson(actionRaw)
          : null,
    );
  }
}
