import '../../core/network/api_client.dart';
import '../models/customer.dart';

/// Mirrors storefront `customerAuthApi`. JWT is persisted via the client's
/// `TokenStorage`; the request interceptor attaches it automatically.
class CustomerAuthApi {
  CustomerAuthApi(this._client);
  final ApiClient _client;

  Future<({String token, Customer customer})> login({
    required String email,
    required String password,
  }) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/customers/login',
        data: {'email': email, 'password': password},
      ),
    );
    return _unpackTokenResponse(data);
  }

  Future<({String token, Customer customer})> register({
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
    return _unpackTokenResponse(data);
  }

  Future<({String token, Customer customer})> googleLogin(String idToken) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/customers/google',
        data: {'id_token': idToken},
      ),
    );
    return _unpackTokenResponse(data);
  }

  Future<Customer> me() async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get('/customers/me'),
    );
    return Customer.fromJson(data);
  }

  Future<void> logout() async {
    try {
      await _client.raw.post('/customers/logout');
    } catch (_) {
      // Best effort — local clear runs unconditionally upstream.
    }
    await _client.tokens.clear();
  }

  Future<({String token, Customer customer})> _unpackTokenResponse(
    Map<String, dynamic> data,
  ) async {
    final token = (data['access_token'] ?? data['token']) as String?;
    if (token == null || token.isEmpty) {
      throw StateError('Auth response missing access token');
    }
    await _client.tokens.write(token);
    final raw = (data['customer'] ?? data['user'] ?? data) as Map<String, dynamic>;
    return (token: token, customer: Customer.fromJson(raw));
  }
}
