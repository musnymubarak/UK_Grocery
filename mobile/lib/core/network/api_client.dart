import 'dart:async';

import 'package:dio/dio.dart';

import 'api_config.dart';
import 'api_exception.dart';
import 'token_storage.dart';

/// Singleton networking client. Wraps Dio with auth + 401 + error handling
/// that mirrors the storefront's axios interceptors.
class ApiClient {
  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.apiBase,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
        // Don't auto-throw on 4xx — we'll convert to ApiException ourselves.
        validateStatus: (s) => s != null && s < 500,
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokens.read();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          // Treat 4xx as DioException so callers go through ApiException.fromDio.
          final s = response.statusCode ?? 0;
          if (s >= 400) {
            handler.reject(
              DioException(
                requestOptions: response.requestOptions,
                response: response,
                type: DioExceptionType.badResponse,
              ),
              true,
            );
            return;
          }
          handler.next(response);
        },
        onError: (e, handler) async {
          if (e.response?.statusCode == 401) {
            await _tokens.clear();
            _authExpiredController.add(null);
          }
          handler.next(e);
        },
      ),
    );

  }

  static final ApiClient instance = ApiClient._();

  late final Dio _dio;
  final TokenStorage _tokens = TokenStorage();
  final _authExpiredController = StreamController<void>.broadcast();

  /// Fires when the server returns 401 — listeners (AuthProvider) should
  /// clear in-memory state and route the user to /login.
  Stream<void> get onAuthExpired => _authExpiredController.stream;

  TokenStorage get tokens => _tokens;
  Dio get raw => _dio;

  Future<T> request<T>(Future<Response<dynamic>> Function() send) async {
    try {
      final res = await send();
      return res.data as T;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
