/// Admin-controlled promo strip from `GET /storefront/app-config` →
/// `announcement` (null when there is no active bar). Schedule-gating happens
/// server-side, so a non-null value here is always meant to be shown.
class Announcement {
  const Announcement({
    required this.key,
    required this.message,
    this.linkUrl = '',
    this.linkLabel = '',
    this.variant = 'info',
    this.dismissible = true,
  });

  final String key;
  final String message;
  final String linkUrl;
  final String linkLabel;
  final String variant; // info | success | warning | promo
  final bool dismissible;

  /// Returns null when [json] is not a usable announcement (absent or empty
  /// message), so callers can treat null as "nothing to show".
  static Announcement? fromJson(dynamic json) {
    if (json is! Map) return null;
    final message = (json['message'] ?? '').toString();
    if (message.trim().isEmpty) return null;
    return Announcement(
      key: (json['key'] ?? '').toString(),
      message: message,
      linkUrl: (json['link_url'] ?? '').toString(),
      linkLabel: (json['link_label'] ?? '').toString(),
      variant: (json['variant'] ?? 'info').toString(),
      dismissible: json['dismissible'] is bool ? json['dismissible'] as bool : true,
    );
  }
}
