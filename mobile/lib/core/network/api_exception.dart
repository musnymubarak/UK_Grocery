import 'package:dio/dio.dart';

/// Typed error surface for UI layers — never expose `DioException` directly.
class ApiException implements Exception {
  ApiException({
    required this.message,
    this.statusCode,
    this.fieldErrors,
  });

  final String message;
  final int? statusCode;
  final Map<String, String>? fieldErrors;

  bool get isUnauthorized => statusCode == 401;
  bool get isNotFound => statusCode == 404;
  bool get isNetwork => statusCode == null;

  factory ApiException.fromDio(DioException e) {
    final response = e.response;
    final status = response?.statusCode;
    final data = response?.data;

    // FastAPI returns either {"detail": "..."} or {"detail": [{...}, ...]}.
    String msg = e.message ?? 'Network error';
    final Map<String, String> fields = {};

    if (data is Map<String, dynamic>) {
      final detail = data['detail'];
      if (detail is String) {
        msg = detail;
      } else if (detail is List) {
        final parts = <String>[];
        for (final entry in detail) {
          if (entry is Map<String, dynamic>) {
            final fieldPath = entry['loc'] is List
                ? (entry['loc'] as List).join('.')
                : null;
            final fieldMessage = (entry['msg'] ?? entry['type'] ?? 'Invalid').toString();
            if (fieldPath != null) fields[fieldPath] = fieldMessage;
            parts.add(fieldMessage);
          }
        }
        if (parts.isNotEmpty) msg = parts.join('; ');
      }
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      msg = 'Can\'t reach the server. Check your connection.';
    }

    return ApiException(
      message: msg,
      statusCode: status,
      fieldErrors: fields.isEmpty ? null : fields,
    );
  }

  @override
  String toString() => 'ApiException(${statusCode ?? '-'}): $message';
}
