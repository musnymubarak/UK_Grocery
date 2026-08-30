import '../../core/network/api_client.dart';

/// Backend serializes Decimal fields (amount, total_amount) as JSON strings,
/// not numbers — parse either shape defensively.
double _parseDecimal(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}

DateTime _parseDate(dynamic v) =>
    DateTime.tryParse(v as String? ?? '')?.toLocal() ?? DateTime.now();

class RefundRecord {
  const RefundRecord({
    required this.id,
    required this.orderId,
    required this.amount,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  /// RefundItem id — matches the `reference_id` a "refund" notification
  /// carries, so this is what highlight-by-id keys off of.
  final String id;
  final String orderId;
  final double amount;
  final String reason;
  final String status;
  final DateTime createdAt;
}

/// Customer's refund history. Mirrors backend `GET /refunds/me`, which
/// returns `RefundResponse[]` — a parent Refund per order with a nested
/// `items[]` of `RefundItemResponse`. This flattens to one card per item
/// (each item has its own amount/reason/status), falling back to the parent
/// refund when it has no items yet.
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

    final records = <RefundRecord>[];
    for (final refund in list.whereType<Map<String, dynamic>>()) {
      final orderId = (refund['order_id'] ?? '').toString();
      final parentStatus = refund['status'] as String? ?? 'pending';
      final items = refund['items'];

      if (items is List && items.isNotEmpty) {
        for (final item in items.whereType<Map<String, dynamic>>()) {
          records.add(RefundRecord(
            id: (item['id'] ?? '').toString(),
            orderId: orderId,
            amount: _parseDecimal(item['amount']),
            reason: item['reason'] as String? ?? '',
            status: item['status'] as String? ?? parentStatus,
            createdAt: _parseDate(item['created_at']),
          ));
        }
      } else {
        records.add(RefundRecord(
          id: (refund['id'] ?? '').toString(),
          orderId: orderId,
          amount: _parseDecimal(refund['total_amount']),
          reason: '',
          status: parentStatus,
          createdAt: _parseDate(refund['created_at']),
        ));
      }
    }
    return records;
  }
}
