import '../../core/network/api_client.dart';

class RefundRecord {
  const RefundRecord({
    required this.id,
    required this.orderNumber,
    required this.amount,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String orderNumber;
  final double amount;
  final String reason;
  final String status;
  final DateTime createdAt;

  factory RefundRecord.fromJson(Map<String, dynamic> json) {
    return RefundRecord(
      id: (json['id'] ?? '').toString(),
      orderNumber: json['order_number'] as String? ?? json['order_id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      reason: json['reason'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
    );
  }
}

class RefundApi {
  RefundApi(this._client);
  final ApiClient _client;

  Future<List<RefundRecord>> listMine() async {
    final data = await _client.request<dynamic>(
      () => _client.raw.get('/refunds/me'),
    );
    final List<dynamic> list = switch (data) {
      List<dynamic> l => l,
      Map<String, dynamic> m when m['items'] is List<dynamic> => m['items'] as List<dynamic>,
      _ => const [],
    };
    return list
        .whereType<Map<String, dynamic>>()
        .map(RefundRecord.fromJson)
        .toList();
  }
}
