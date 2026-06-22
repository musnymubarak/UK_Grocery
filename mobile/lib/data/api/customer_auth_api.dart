import '../../core/network/api_client.dart';
import '../models/customer.dart';

/// Mirrors storefront `customerAuthApi`. The access + refresh tokens are
/// persisted via the client's `TokenStorage`; the request interceptor attaches
/// the access token and transparently refreshes it on 401.
///
/// The customer `Token` response carries no profile, so callers load the
/// customer via [me] after authenticating.
class CustomerAuthApi {
  CustomerAuthApi(this._client);
  final ApiClient _client;

  Future<void> login({required String email, required String password}) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/customers/login',
        data: {'email': email, 'password': password},
      ),
    );
    await _persistTokens(data);
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/customers/register',
        data: {
          'full_name': fullName,
          'email': email,
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        },
      ),
    );
    await _persistTokens(data);
  }

  Future<void> googleLogin(String idToken) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/customers/google',
        data: {'id_token': idToken},
      ),
    );
    await _persistTokens(data);
  }

  Future<void> appleLogin(String identityToken, String? email, String? fullName) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/customers/apple',
        data: {
          'identity_token': identityToken,
          if (email != null && email.isNotEmpty) 'email': email,
          if (fullName != null && fullName.isNotEmpty) 'full_name': fullName,
        },
      ),
    );
    await _persistTokens(data);
  }

  Future<Customer> me() async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get('/customers/me'),
    );
    return Customer.fromJson(data);
  }

  Future<void> logout() async {
    try {
      final refresh = await _client.tokens.readRefresh();
      await _client.raw.post(
        '/customers/logout',
        data: {if (refresh != null && refresh.isNotEmpty) 'refresh_token': refresh},
      );
    } catch (_) {
      // Best effort — local clear runs unconditionally below.
    }
    await _client.tokens.clear();
  }

  Future<void> deleteAccount() async {
    await _client.request<void>(
      () => _client.raw.delete('/customers/me'),
    );
    await _client.tokens.clear();
  }

  Future<void> _persistTokens(Map<String, dynamic> data) async {
    final token = (data['access_token'] ?? data['token']) as String?;
    if (token == null || token.isEmpty) {
      throw StateError('Auth response missing access token');
    }
    await _client.tokens.write(token, refresh: data['refresh_token'] as String?);
  }
}
