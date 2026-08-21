import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dailygrocer_mobile/core/theme/app_theme.dart';
import 'package:dailygrocer_mobile/screens/splash/splash_screen.dart';
import 'package:dailygrocer_mobile/state/auth_provider.dart';
import 'package:dailygrocer_mobile/state/store_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('Splash renders the brand logo', (WidgetTester tester) async {
    await tester.runAsync(() async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => StoreProvider()),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const SplashScreen(),
          ),
        ),
      );

      // First frame renders the logo image
      expect(find.byType(Image), findsWidgets);
    });
  });
}


