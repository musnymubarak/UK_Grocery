class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.referenceId,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String body;

  /// One of: order_update | promo | reward | refund | system.
  final String type;
  final String? referenceId;
  final bool isRead;
  final DateTime createdAt;

  AppNotification copyWith({bool? isRead}) => AppNotification(
        id: id,
        title: title,
        body: body,
        type: type,
        referenceId: referenceId,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
      );

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: (json['id'] ?? '').toString(),
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        type: json['notification_type'] as String? ?? 'system',
        referenceId: json['reference_id']?.toString(),
        isRead: json['is_read'] as bool? ?? false,
        createdAt: DateTime.tryParse(json['created_at'] as String? ?? '')?.toLocal() ??
            DateTime.now(),
      );
}
