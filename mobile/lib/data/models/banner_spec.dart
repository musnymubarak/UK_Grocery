class BannerSpec {
  const BannerSpec({
    required this.id,
    required this.eyebrow,
    required this.title,
    required this.caption,
    this.imageUrl,
    this.linkUrl,
  });

  final String id;
  final String eyebrow;
  final String title;
  final String caption;
  final String? imageUrl;
  final String? linkUrl;

  factory BannerSpec.fromJson(Map<String, dynamic> json) {
    return BannerSpec(
      id: (json['id'] ?? '').toString(),
      eyebrow: (json['type'] as String? ?? 'featured').toUpperCase(),
      title: json['title'] as String? ?? '',
      caption: json['subtitle'] as String? ?? json['description'] as String? ?? '',
      imageUrl: json['image_url'] as String?,
      linkUrl: json['link_url'] as String?,
    );
  }
}
