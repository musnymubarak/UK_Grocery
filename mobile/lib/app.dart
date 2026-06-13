import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/version_gate.dart';
import 'state/branding_provider.dart';
import 'widgets/error_boundary.dart';

class DailyGrocerApp extends StatelessWidget {
  const DailyGrocerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<BrandingProvider>(
      builder: (context, brandingProvider, _) {
        final b = brandingProvider.branding;
        return MaterialApp(
          title: b.appName,
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(
            brandPrimary: b.primary,
            brandAction: b.action,
            brandAccent: b.accent,
          ),
          themeMode: ThemeMode.light,
          initialRoute: AppRouter.splash,
          onGenerateRoute: AppRouter.onGenerateRoute,
          builder: (context, child) => ErrorBoundary(
            child: VersionGate(child: child ?? const SizedBox.shrink()),
          ),
        );
      },
    );
  }
}
