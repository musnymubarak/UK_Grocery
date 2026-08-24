import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:firebase_core/firebase_core.dart';

import 'package:flutter/foundation.dart';
import 'dart:io';

import 'app.dart';
import 'core/router/app_router.dart';
import 'core/services/push_notification_service.dart';
import 'firebase_options.dart';
import 'state/auth_provider.dart';
import 'state/branding_provider.dart';
import 'state/cart_provider.dart';
import 'state/content_provider.dart';
import 'state/home_layout_provider.dart';
import 'state/notifications_provider.dart';
import 'state/store_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
    Stripe.publishableKey = 'pk_test_51Tn08LRt4m9309WQYxo8Ztt4txTwYIVnZIHQyZQd3cRcEnh4ivxh2meSqlnA2wVU6XuK8ohndznZwcVDNHXM2oF500hSDuhqHj';
    Stripe.merchantIdentifier = 'merchant.uk.co.dailygrocer';
    Stripe.urlScheme = 'dailygrocer';
    await Stripe.instance.applySettings();

    // Firebase must be initialized before ANY firebase_* plugin is touched.
    // PushNotificationService reads FirebaseMessaging, so it must come first.
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      }
    } catch (e) {
      if (kDebugMode) {
        print('Firebase initialization error: $e');
      }
    }

    // Initialize Firebase Push Notifications
    try {
      await PushNotificationService.instance.initialize(
        navigatorKey: AppRouter.navigatorKey,
      );
    } catch (e) {
      if (kDebugMode) {
        print('PushNotificationService initialization error: $e');
      }
    }
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => StoreProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => HomeLayoutProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
        ChangeNotifierProvider(create: (_) => ContentProvider()),
        ChangeNotifierProvider(create: (_) => BrandingProvider()),
      ],
      child: const DailyGrocerApp(),
    ),
  );
}
