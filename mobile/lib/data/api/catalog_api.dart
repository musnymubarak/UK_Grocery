import '../../core/network/api_client.dart';
import '../models/banner_spec.dart';
import '../models/category.dart';
import '../models/product.dart';
import '../models/store.dart';

/// Mirrors storefront `catalogApi` (public, no auth).
class CatalogApi {
  CatalogApi(this._client);
  final ApiClient _client;

  Future<List<Category>> getCategories() async {
    final data = await _client.request<List<dynamic>>(
      () => _client.raw.get('/storefront/categories'),
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(Category.fromJson)
        .toList();
  }

  Future<List<StoreLocation>> getStores() async {
    final data = await _client.request<List<dynamic>>(
      () => _client.raw.get('/storefront/stores'),
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(StoreLocation.fromJson)
        .toList();
  }

  Future<List<Product>> getProducts({
    String? categoryId,
    String? storeId,
    String? search,
    int skip = 0,
    int limit = 50,
  }) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get(
        '/storefront/products',
        queryParameters: {
          if (categoryId != null) 'category_id': categoryId,
          if (storeId != null) 'store_id': storeId,
          if (search != null && search.isNotEmpty) 'search': search,
          'skip': skip,
          'limit': limit,
        },
      ),
    );
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(Product.fromJson)
        .toList();
  }

  Future<Product> getProduct(String id) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.get('/storefront/products/$id'),
    );
    return Product.fromJson(data);
  }

  Future<List<BannerSpec>> getBanners({String? storeId}) async {
    final data = await _client.request<List<dynamic>>(
      () => _client.raw.get(
        '/storefront/banners',
        queryParameters: {if (storeId != null) 'store_id': storeId},
      ),
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(BannerSpec.fromJson)
        .toList();
  }

  Future<List<Product>> getOffers({String? storeId}) async {
    final data = await _client.request<dynamic>(
      () => _client.raw.get(
        '/storefront/offers',
        queryParameters: {if (storeId != null) 'store_id': storeId},
      ),
    );
    // Endpoint may return either a list or {items: [...]}.
    final List<dynamic> raw;
    if (data is List) {
      raw = data;
    } else if (data is Map<String, dynamic>) {
      raw = data['items'] as List<dynamic>? ?? const [];
    } else {
      raw = const [];
    }
    return raw
        .whereType<Map<String, dynamic>>()
        .map(Product.fromJson)
        .where((p) => p.hasPromo)
        .toList();
  }

  Future<({double fee, bool free})> calculateDeliveryFee({
    required String storeId,
    required String postcode,
  }) async {
    final data = await _client.request<Map<String, dynamic>>(
      () => _client.raw.post(
        '/delivery/calculate-fee',
        data: {'store_id': storeId, 'postcode': postcode},
      ),
    );
    return (
      fee: (data['fee'] as num?)?.toDouble() ?? 0,
      free: data['free_delivery'] as bool? ?? false,
    );
  }
}
