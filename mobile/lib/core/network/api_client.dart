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

    // Interceptor-free client used only for the token-refresh call, so a 401
    // on refresh can't recurse back into the refresh logic.
    _bare = Dio(
      BaseOptions(
        baseUrl: ApiConfig.apiBase,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
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
          if (e.response?.statusCode == 401 &&
              e.requestOptions.extra['__retried'] != true) {
            final refreshed = await _ensureRefreshed();
            if (refreshed) {
              try {
                final opts = e.requestOptions;
                opts.extra['__retried'] = true;
                final token = await _tokens.read();
                if (token != null && token.isNotEmpty) {
                  opts.headers['Authorization'] = 'Bearer $token';
                }
                final res = await _dio.fetch<dynamic>(opts);
                return handler.resolve(res);
              } catch (_) {
                // Retry failed — fall through to sign-out.
              }
            }
            await _tokens.clear();
            _authExpiredController.add(null);
          } else if (e.response?.statusCode == 401) {
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
  late final Dio _bare;
  final TokenStorage _tokens = TokenStorage();
  final _authExpiredController = StreamController<void>.broadcast();
  Future<bool>? _refreshing;

  /// Fires when the server returns 401 — listeners (AuthProvider) should
  /// clear in-memory state and route the user to /login.
  Stream<void> get onAuthExpired => _authExpiredController.stream;

  TokenStorage get tokens => _tokens;
  Dio get raw => _dio;

  /// Single-flight token refresh: concurrent 401s await one attempt.
  Future<bool> _ensureRefreshed() {
    return _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
  }

  Future<bool> _doRefresh() async {
    final refreshToken = await _tokens.readRefresh();
    if (refreshToken == null || refreshToken.isEmpty) return false;
    try {
      final res = await _bare.post<dynamic>(
        '/customers/refresh',
        data: {'refresh_token': refreshToken},
      );
      if ((res.statusCode ?? 0) >= 400) return false;
      final data = res.data as Map<String, dynamic>?;
      final token = data?['access_token'] as String?;
      if (token == null || token.isEmpty) return false;
      await _tokens.write(token, refresh: data?['refresh_token'] as String?);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<T> request<T>(Future<Response<dynamic>> Function() send) async {
    try {
      final res = await send();
      return res.data as T;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
