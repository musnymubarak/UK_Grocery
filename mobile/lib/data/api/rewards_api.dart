import '../../core/network/api_client.dart';

/// Backend serializes Decimal fields (total_spend, reward_value) as JSON
/// strings, not numbers — parse either shape defensively.
double _parseDecimal(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}

class RewardsTier {
  const RewardsTier({
    required this.name,
    required this.rewardType,
    required this.rewardValue,
  });

  final String name;
  final String rewardType;
  final double rewardValue;

  factory RewardsTier.fromJson(Map<String, dynamic> json) {
    return RewardsTier(
      name: json['name'] as String? ?? 'Reward',
      rewardType: json['reward_type'] as String? ?? '',
      rewardValue: _parseDecimal(json['reward_value']),
    );
  }
}

class RewardEvent {
  const RewardEvent({
    required this.id,
    required this.createdAt,
    this.tier,
  });

  final String id;
  final DateTime createdAt;
  final RewardsTier? tier;

  factory RewardEvent.fromJson(Map<String, dynamic> json) {
    return RewardEvent(
      id: (json['id'] ?? '').toString(),
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '')?.toLocal() ??
          DateTime.now(),
      tier: json['tier'] is Map<String, dynamic>
          ? RewardsTier.fromJson(json['tier'] as Map<String, dynamic>)
          : null,
    );
  }
}

class RewardsProgress {
  const RewardsProgress({
    required this.currentMonth,
    required this.totalSpend,
    required this.events,
  });

  final String currentMonth;
  final double totalSpend;
  final List<RewardEvent> events;

  factory RewardsProgress.fromJson(Map<String, dynamic> json) {
    final rawEvents = json['events'];
    return RewardsProgress(
      currentMonth: json['current_month'] as String? ?? '',
      totalSpend: _parseDecimal(json['total_spend']),
      events: rawEvents is List<dynamic>
          ? rawEvents.whereType<Map<String, dynamic>>().map(RewardEvent.fromJson).toList()
          : const [],
    );
  }
}

/// Customer rewards/loyalty progress. Mirrors backend `/rewards/me/progress`
/// (depends on `get_current_customer`), the same endpoint the storefront's
/// Profile rewards tab consumes.
class RewardsApi {
  RewardsApi(this._client);
  final ApiClient _client;

  Future<RewardsProgress> myProgress() async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get('/rewards/me/progress'),
    );
    return RewardsProgress.fromJson(data);
  }
}
