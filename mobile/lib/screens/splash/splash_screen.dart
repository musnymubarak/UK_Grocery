import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../state/auth_provider.dart';
import '../../state/content_provider.dart';
import '../../state/store_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _logoC = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..forward();

  late final Animation<double> _fade =
      CurvedAnimation(parent: _logoC, curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic));

  late final Animation<double> _scale = Tween(begin: 0.85, end: 1.0).animate(
    CurvedAnimation(parent: _logoC, curve: const Interval(0.0, 0.7, curve: Curves.easeOutBack)),
  );

  bool _minTimePassed = false;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (!mounted) return;
      setState(() => _minTimePassed = true);
      _maybeAdvance();
    });
  }

  /// Navigate to Landing/Shell only when (a) the brand animation has shown for at
  /// least 1.4 s and (b) AuthProvider has finished hydrating the customer
  /// from stored token. Whichever finishes last triggers it.
  void _maybeAdvance() {
    if (_navigated || !mounted) return;
    if (!_minTimePassed) return;
    if (context.read<AuthProvider>().isBootstrapping) return;
    _navigated = true;
    final hasStore = context.read<StoreProvider>().hasStore;
    if (hasStore) {
      Navigator.of(context).pushReplacementNamed(AppRouter.shell);
    } else {
      Navigator.of(context).pushReplacementNamed(AppRouter.landing);
    }
  }

  @override
  void dispose() {
    _logoC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Re-listen to AuthProvider and StoreProvider so we retry _maybeAdvance once bootstrap flips.
    context.watch<AuthProvider>();
    context.watch<StoreProvider>();
    final t = context.watch<ContentProvider>().t;
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeAdvance());
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(color: AppColors.blue900),
        child: Stack(
          children: [
            const SizedBox.shrink(),
            const SizedBox.shrink(),
            Center(
              child: FadeTransition(
                opacity: _fade,
                child: ScaleTransition(
                  scale: _scale,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        height: 96,
                        width: 96,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                        ),
                        child: ShaderMask(
                          shaderCallback: (rect) => const LinearGradient(
                            colors: [AppColors.blue700, AppColors.red500],
                          ).createShader(rect),
                          child: const Icon(
                            Icons.shopping_basket_rounded,
                            size: 48,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        t('app.name', 'Daily Grocer'),
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        t('app.tagline', 'Premium groceries · delivered'),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.75),
                              letterSpacing: 0.5,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
