import 'package:flutter/material.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/version_gate.dart';
import 'widgets/error_boundary.dart';

class DailyGrocerApp extends StatelessWidget {
  const DailyGrocerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Daily Grocer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      themeMode: ThemeMode.light,
      initialRoute: AppRouter.splash,
      onGenerateRoute: AppRouter.onGenerateRoute,
      builder: (context, child) => ErrorBoundary(
        child: VersionGate(child: child ?? const SizedBox.shrink()),
      ),
    );
  }
}
