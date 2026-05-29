import '../../core/network/api_client.dart';
import '../models/order.dart';

class CheckoutLine {
  const CheckoutLine({required this.productId, required this.quantity});
  final String productId;
  final int quantity;

  Map<String, dynamic> toJson() => {
        'product_id': productId,
        'quantity': quantity,
      };
}

/// Mirrors storefront `orderApi` + `orderActionsApi`.
class OrderApi {
  OrderApi(this._client);
  final ApiClient _client;

  Future<OrderSummary> checkout({
    required String storeId,
    required List<CheckoutLine> lines,
    String? deliveryAddressId,
    String? deliveryAddress,
    String? deliveryPostcode,
    String paymentMethod = 'cod',
    String? couponCode,
    String? notes,
    bool ageConfirmed = false,
  }) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/orders/checkout',
        queryParameters: {'store_id': storeId},
        data: {
          'items': lines.map((l) => l.toJson()).toList(),
          if (deliveryAddressId != null) 'delivery_address_id': deliveryAddressId,
          if (deliveryAddress != null) 'delivery_address': deliveryAddress,
          if (deliveryPostcode != null) 'delivery_postcode': deliveryPostcode,
          'payment_method': paymentMethod,
          if (couponCode != null && couponCode.isNotEmpty) 'coupon_code': couponCode,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
          'age_confirmed': ageConfirmed,
        },
      ),
    );
    return OrderSummary.fromJson(data);
  }

  Future<List<OrderSummary>> myOrders() async {
    final data = await _client.request<dynamic>(
      () => _client.raw.get('/orders/me'),
    );
    final List<dynamic> list = switch (data) {
      List<dynamic> l => l,
      Map<String, dynamic> m when m['items'] is List<dynamic> => m['items'] as List<dynamic>,
      _ => const [],
    };
    return list
        .whereType<Map<String, dynamic>>()
        .map(OrderSummary.fromJson)
        .toList();
  }

  Future<OrderSummary> getOrder(String id) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get('/orders/me/$id'),
    );
    return OrderSummary.fromJson(data);
  }

  Future<void> cancel(String id) async {
    await _client.request<dynamic>(
      () => _client.raw.post('/orders/me/$id/cancel'),
    );
  }
}
