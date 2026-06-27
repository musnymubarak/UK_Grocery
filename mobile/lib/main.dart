import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'app.dart';
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
    ),
  );

  Stripe.publishableKey = 'pk_test_51Tn08LRt4m9309WQYxo8Ztt4txTwYIVnZIHQyZQd3cRcEnh4ivxh2meSqlnA2wVU6XuK8ohndznZwcVDNHXM2oF500hSDuhqHj';
  Stripe.merchantIdentifier = 'uk.co.dailygrocer';
  await Stripe.instance.applySettings();

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
