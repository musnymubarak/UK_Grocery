import '../../core/network/api_client.dart';
import '../models/notification.dart';

/// Customer notification inbox. Mirrors backend `/notifications/me*`
/// (all routes depend on `get_current_customer`).
class NotificationApi {
  NotificationApi(this._client);
  final ApiClient _client;

  Future<List<AppNotification>> list({
    bool unreadOnly = false,
    int skip = 0,
    int limit = 30,
  }) async {
    final data = await _client.request<List<dynamic>>(
      () => _client.raw.get(
        '/notifications/me',
        queryParameters: {
          'unread_only': unreadOnly,
          'skip': skip,
          'limit': limit,
        },
      ),
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList();
  }

  Future<int> unreadCount() async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get('/notifications/me/count'),
    );
    return (data['unread_count'] as num?)?.toInt() ?? 0;
  }

  Future<void> markRead(String id) async {
    await _client.request<dynamic>(
      () => _client.raw.post('/notifications/me/$id/read'),
    );
  }

  Future<void> markAllRead() async {
    await _client.request<dynamic>(
      () => _client.raw.post('/notifications/me/read-all'),
    );
  }
}
