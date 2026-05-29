import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:dailygrocer_mobile/core/network/api_exception.dart';

DioException _dioWith({
  int? status,
  Object? body,
  DioExceptionType type = DioExceptionType.badResponse,
}) {
  final req = RequestOptions(path: '/test');
  return DioException(
    requestOptions: req,
    type: type,
    response: status == null
        ? null
        : Response(
            requestOptions: req,
            statusCode: status,
            data: body,
          ),
  );
}

void main() {
  group('ApiException.fromDio', () {
    test('extracts string detail from FastAPI 400 body', () {
      final ex = ApiException.fromDio(_dioWith(
        status: 400,
        body: {'detail': 'Email already registered'},
      ));
      expect(ex.statusCode, 400);
      expect(ex.message, 'Email already registered');
      expect(ex.fieldErrors, isNull);
      expect(ex.isUnauthorized, isFalse);
    });

    test('joins multi-error 422 validation list and exposes fieldErrors', () {
      final ex = ApiException.fromDio(_dioWith(
        status: 422,
        body: {
          'detail': [
            {'loc': ['body', 'email'], 'msg': 'value is not a valid email', 'type': 'value_error'},
            {'loc': ['body', 'password'], 'msg': 'ensure this value has at least 6 characters', 'type': 'value_error'},
          ],
        },
      ));
      expect(ex.statusCode, 422);
      expect(ex.message, contains('value is not a valid email'));
      expect(ex.message, contains('ensure this value has at least 6 characters'));
      expect(ex.fieldErrors, isNotNull);
      expect(ex.fieldErrors!['body.email'], 'value is not a valid email');
      expect(ex.fieldErrors!['body.password'], contains('at least 6 characters'));
    });

    test('flags 401 as unauthorized', () {
      final ex = ApiException.fromDio(_dioWith(
        status: 401,
        body: {'detail': 'Invalid token'},
      ));
      expect(ex.isUnauthorized, isTrue);
      expect(ex.isNetwork, isFalse);
    });

    test('flags 404 as notFound', () {
      final ex = ApiException.fromDio(_dioWith(status: 404, body: {'detail': 'No such product'}));
      expect(ex.isNotFound, isTrue);
    });

    test('classifies timeout as network error with friendly copy', () {
      final ex = ApiException.fromDio(_dioWith(type: DioExceptionType.connectionTimeout));
      expect(ex.isNetwork, isTrue);
      expect(ex.message.toLowerCase(), contains("can't reach"));
    });
  });
}
