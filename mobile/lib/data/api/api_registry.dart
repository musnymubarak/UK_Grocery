import '../../core/network/api_client.dart';
import 'catalog_api.dart';
import 'coupon_api.dart';
import 'customer_auth_api.dart';
import 'order_api.dart';
import 'refund_api.dart';

/// One place to access every API service. Use `Api.instance.catalog.…`.
class Api {
  Api._(ApiClient client)
      : catalog = CatalogApi(client),
        coupons = CouponApi(client),
        auth = CustomerAuthApi(client),
        orders = OrderApi(client),
        refunds = RefundApi(client);

  static final Api instance = Api._(ApiClient.instance);

  final CatalogApi catalog;
  final CouponApi coupons;
  final CustomerAuthApi auth;
  final OrderApi orders;
  final RefundApi refunds;
}
