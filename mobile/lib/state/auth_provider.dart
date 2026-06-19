import 'package:flutter/material.dart';

import '../core/network/api_client.dart';
import '../data/api/api_registry.dart';
import '../data/models/customer.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    ApiClient.instance.onAuthExpired.listen((_) {
      _customer = null;
      notifyListeners();
    });
    _bootstrap();
  }

  Customer? _customer;
  bool _bootstrapping = true;

  bool get isAuthenticated => _customer != null;
  bool get isBootstrapping => _bootstrapping;
  Customer? get customer => _customer;
  String get displayName => _customer?.fullName.isNotEmpty == true ? _customer!.fullName : 'Guest';
  String? get email => _customer?.email;
  String get initials => _customer?.initials ?? 'DG';

  /// On boot, if we have a token in storage, hydrate the profile.
  Future<void> _bootstrap() async {
    final token = await ApiClient.instance.tokens.read();
    if (token != null && token.isNotEmpty) {
      try {
        _customer = await Api.instance.auth.me();
      } catch (_) {
        await ApiClient.instance.tokens.clear();
      }
    }
    _bootstrapping = false;
    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    await Api.instance.auth.login(email: email, password: password);
    _customer = await Api.instance.auth.me();
    notifyListeners();
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    await Api.instance.auth.register(
      fullName: fullName,
      email: email,
      password: password,
      phone: phone,
    );
    _customer = await Api.instance.auth.me();
    notifyListeners();
  }

  Future<void> googleSignIn(String idToken) async {
    await Api.instance.auth.googleLogin(idToken);
    _customer = await Api.instance.auth.me();
    notifyListeners();
  }

  Future<void> appleSignIn(String identityToken, {String? email, String? fullName}) async {
    await Api.instance.auth.appleLogin(identityToken, email, fullName);
    _customer = await Api.instance.auth.me();
    notifyListeners();
  }

  Future<void> signOut() async {
    await Api.instance.auth.logout();
    _customer = null;
    notifyListeners();
  }
}
