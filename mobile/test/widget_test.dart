import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dailygrocer_mobile/core/theme/app_theme.dart';
import 'package:dailygrocer_mobile/screens/splash/splash_screen.dart';
import 'package:dailygrocer_mobile/state/auth_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Splash renders the brand', (WidgetTester tester) async {
    await tester.runAsync(() async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const SplashScreen(),
          ),
        ),
      );
      // First frame is enough — we only verify the static brand text.
      expect(find.text('Daily Grocer'), findsOneWidget);
      expect(find.text('Premium groceries · delivered'), findsOneWidget);
    });
  });
}
