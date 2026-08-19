import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../core/network/api_client.dart';
import '../core/services/push_notification_service.dart';
import '../data/api/api_registry.dart';
import '../data/models/customer.dart';

class AuthProvider extends ChangeNotifier {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: Platform.isIOS ? '721475838135-a5s2f1abkej3b10e98dr8hq0tphncpsi.apps.googleusercontent.com' : null,
    serverClientId: '721475838135-vuc68jpvf4b32qjfh19cv1hhsb22etbb.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

  AuthProvider() {
    ApiClient.instance.onAuthExpired.listen((_) {
      _customer = null;
      _safePush(() => PushNotificationService.instance.unregisterOnLogout());
      notifyListeners();
    });
    _bootstrap();
  }

  /// Push notifications are a best-effort side effect of auth — never let a
  /// failure there (e.g. Firebase not initialised) fail a sign-in or sign-out.
  void _safePush(Future<void> Function() action) {
    try {
      action().catchError((_) {});
    } catch (_) {}
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
      // Outside the try: a push failure must not clear a valid session.
      if (_customer != null) {
        _safePush(() => PushNotificationService.instance.syncTokenWithBackend());
      }
    }
    _bootstrapping = false;
    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    await Api.instance.auth.login(email: email, password: password);
    _customer = await Api.instance.auth.me();
    _safePush(() => PushNotificationService.instance.syncTokenWithBackend());
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
  }

  Future<void> googleSignIn(String idToken) async {
    await Api.instance.auth.googleLogin(idToken);
    _customer = await Api.instance.auth.me();
    _safePush(() => PushNotificationService.instance.syncTokenWithBackend());
    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    if (!kIsWeb && !(Platform.isAndroid || Platform.isIOS || Platform.isMacOS)) {
      throw Exception('Google Sign-In is only supported on Android and iOS devices/emulators.');
    }
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw Exception('Google Sign-In was cancelled by the user.');
    }
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final String? idToken = googleAuth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw Exception('Failed to obtain Google ID Token.');
    }
    await googleSignIn(idToken);
  }

  Future<void> appleSignIn(String identityToken, {String? email, String? fullName}) async {
    await Api.instance.auth.appleLogin(identityToken, email, fullName);
    _customer = await Api.instance.auth.me();
    _safePush(() => PushNotificationService.instance.syncTokenWithBackend());
    notifyListeners();
  }

  Future<void> signOut() async {
    _customer = null;
    notifyListeners();
    try {
      await PushNotificationService.instance.unregisterOnLogout();
    } catch (_) {}
    try {
      await Api.instance.auth.logout();
    } catch (_) {}
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    try {
      await ApiClient.instance.tokens.clear();
    } catch (_) {}
    notifyListeners();
  }

  Future<void> deleteAccount() async {
    try {
      await PushNotificationService.instance.unregisterOnLogout();
    } catch (_) {}
    try {
      await Api.instance.auth.deleteAccount();
    } catch (_) {}
    _customer = null;
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    try {
      await ApiClient.instance.tokens.clear();
    } catch (_) {}
    notifyListeners();
  }
}
