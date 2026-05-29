import '../../core/network/api_client.dart';

class CouponValidation {
  const CouponValidation({
    required this.valid,
    required this.discountAmount,
    this.message,
  });

  final bool valid;
  final double discountAmount;
  final String? message;

  factory CouponValidation.fromJson(Map<String, dynamic> json) {
    return CouponValidation(
      valid: json['valid'] as bool? ?? false,
      discountAmount: (json['discount_amount'] as num?)?.toDouble() ?? 0,
      message: json['message'] as String?,
    );
  }
}

/// Mirrors storefront `couponApi.validate`. Requires a customer token
/// (the backend route depends on `get_current_customer`).
class CouponApi {
  CouponApi(this._client);
  final ApiClient _client;

  Future<CouponValidation> validate({
    required String code,
    required String storeId,
    required double subtotal,
    required double deliveryFee,
  }) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/coupons/validate',
        data: {
          'code': code,
          'store_id': storeId,
          'subtotal': subtotal,
          'delivery_fee': deliveryFee,
        },
      ),
    );
    return CouponValidation.fromJson(data);
  }
}
