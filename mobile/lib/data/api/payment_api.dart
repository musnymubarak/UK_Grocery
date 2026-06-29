import '../../core/network/api_client.dart';

class PaymentApi {
  PaymentApi(this._client);
  final ApiClient _client;

  Future<Map<String, String>> createPaymentIntent({
    required double amount,
    bool saveCard = false,
    String? paymentMethodId,
  }) async {
    final body = <String, dynamic>{
      'amount': amount,
      'currency': 'gbp',
      'save_card': saveCard,
    };
    if (paymentMethodId != null) {
      body['payment_method_id'] = paymentMethodId;
    }

    final data = await _client.request<Map<String, dynamic>>(() => _client.raw.post(
      '/payments/create-payment-intent',
      data: body,
    ));
    return {
      'clientSecret': data['client_secret'] as String,
      'paymentIntentId': data['id'] as String,
      'status': data['status'] as String,
    };
  }

  Future<List<dynamic>> getPaymentMethods() async {
    final res = await _client.request<Map<String, dynamic>>(() => _client.raw.get('/payments/methods'));
    return res['data'] as List<dynamic>? ?? [];
  }
}
