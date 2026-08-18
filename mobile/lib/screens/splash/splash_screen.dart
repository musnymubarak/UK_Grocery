import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../state/auth_provider.dart';
import '../../state/store_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  // Main smooth entrance controller
  late final AnimationController _entranceC = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..forward();

  // Subtle breathing pulse controller
  late final AnimationController _pulseC = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  // Shimmer light sheen controller
  late final AnimationController _shimmerC = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  // Smooth entrance fade
  late final Animation<double> _fade = CurvedAnimation(
    parent: _entranceC,
    curve: const Interval(0.0, 0.65, curve: Curves.easeOutCubic),
  );

  // Smooth entrance scale
  late final Animation<double> _scale = Tween<double>(begin: 0.82, end: 1.0).animate(
    CurvedAnimation(parent: _entranceC, curve: const Interval(0.0, 0.85, curve: Curves.easeOutBack)),
  );

  // Subtle breathing pulse
  late final Animation<double> _pulse = Tween<double>(begin: 1.0, end: 1.045).animate(
    CurvedAnimation(parent: _pulseC, curve: Curves.easeInOutSine),
  );

  bool _minTimePassed = false;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _entranceC.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _pulseC.repeat(reverse: true);
        _shimmerC.forward();
      }
    });

    Future.delayed(const Duration(milliseconds: 1700), () {
      if (!mounted) return;
      setState(() => _minTimePassed = true);
      _maybeAdvance();
    });
  }

  /// Navigate to Stores/Shell only when the animation has displayed for at least
  /// 1.7s and AuthProvider has finished bootstrapping.
  void _maybeAdvance() {
    if (_navigated || !mounted) return;
    if (!_minTimePassed) return;
    if (context.read<AuthProvider>().isBootstrapping) return;
    _navigated = true;
    final hasStore = context.read<StoreProvider>().hasStore;
    final isAuth = context.read<AuthProvider>().isAuthenticated;
    if (isAuth && hasStore) {
      Navigator.of(context).pushReplacementNamed(AppRouter.shell);
    } else {
      Navigator.of(context).pushReplacementNamed(AppRouter.stores);
    }
  }

  @override
  void dispose() {
    _entranceC.dispose();
    _pulseC.dispose();
    _shimmerC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Re-listen to AuthProvider and StoreProvider
    context.watch<AuthProvider>();
    context.watch<StoreProvider>();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeAdvance());

    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: FadeTransition(
          opacity: _fade,
          child: ScaleTransition(
            scale: _scale,
            child: AnimatedBuilder(
              animation: Listenable.merge([_pulseC, _shimmerC]),
              builder: (context, child) {
                final pulseScale = _entranceC.isCompleted ? _pulse.value : 1.0;
                final shimmerVal = _shimmerC.value;

                return Transform.scale(
                  scale: pulseScale,
                  child: ShaderMask(
                    blendMode: BlendMode.srcATop,
                    shaderCallback: (bounds) {
                      if (!_entranceC.isCompleted) {
                        return const LinearGradient(
                          colors: [Colors.transparent, Colors.transparent],
                        ).createShader(bounds);
                      }
                      final sweep = (shimmerVal * 2.6) - 0.8;
                      return LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        stops: [
                          (sweep - 0.25).clamp(0.0, 1.0),
                          sweep.clamp(0.0, 1.0),
                          (sweep + 0.25).clamp(0.0, 1.0),
                        ],
                        colors: [
                          Colors.white.withValues(alpha: 0.0),
                          Colors.white.withValues(alpha: 0.45),
                          Colors.white.withValues(alpha: 0.0),
                        ],
                      ).createShader(bounds);
                    },
                    child: child,
                  ),
                );
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 44),
                child: Image.asset(
                  'assets/logo_playful.png',
                  width: 250,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Image.asset(
                    'assets/app_logo.png',
                    width: 140,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
