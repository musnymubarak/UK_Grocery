import '../../core/network/api_client.dart';

class PaymentApi {
  PaymentApi(this._client);
  final ApiClient _client;

  Future<String> createPaymentIntent({required double amount}) async {
    final data = await _client.request<Map<String, dynamic>>(() => _client.raw.post(
      '/payments/create-payment-intent',
      data: {'amount': amount, 'currency': 'gbp'},
    ));
    return data['client_secret'] as String;
  }
}
