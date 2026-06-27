import '../../core/network/api_client.dart';

class PaymentApi {
  PaymentApi(this._client);
  final ApiClient _client;

  Future<String> createPaymentIntent({required double amount}) async {
    final res = await _client.post(
      '/payments/create-payment-intent',
      data: {'amount': amount, 'currency': 'gbp'},
    );
    return res.data['client_secret'] as String;
  }
}
