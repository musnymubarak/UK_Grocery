import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../state/auth_provider.dart';
import '../../state/branding_provider.dart';
import '../../state/store_provider.dart';

/// Width the logo is drawn at, in logical pixels.
///
/// This must equal the size the native launch screen draws it at, otherwise
/// the handoff from the native splash to this screen shows the mark jumping
/// size. `assets/splash_logo.png` is an 800px canvas holding a 600px mark, so
/// 200 here puts the mark at 150dp — the same 150dp the native launch screens
/// use on iOS, Android and the Android 12+ SplashScreen API. The geometry is
/// derived in flutter_native_splash.yaml; change one, change all of them.
const double _kLogoWidth = 200;

/// Gap between the logo and the wordmark.
const double _kWordmarkGap = 2;

/// Fixed height reserved for the wordmark. Reserving it means the column is
/// the same height on every frame, so the wordmark appearing never triggers a
/// relayout — and it makes the lift distance below a derived value.
const double _kWordmarkSlot = 32;

const double _kWordmarkSize = 26;

/// How far the wordmark slides up as it fades in.
const double _kWordmarkRise = 10;

/// How far the logo rises once the wordmark is revealed.
///
/// Half the space the wordmark occupies, which is exactly the offset that
/// makes a centred logo+wordmark column put the *logo alone* at screen centre
/// when the lift is at 0. That is what keeps the native handoff seamless: the
/// group starts pushed down by this much (logo dead centre, matching the
/// native splash) and settles to its natural centred position.
const double _kGroupLift = (_kWordmarkGap + _kWordmarkSlot) / 2;

/// How long the logo is held perfectly still before anything moves.
const Duration _kSettleDelay = Duration(milliseconds: 350);

/// Lift + wordmark reveal. Intervals below carve this up:
/// lift 0–450ms, wordmark 100–600ms.
const Duration _kRevealDuration = Duration(milliseconds: 600);

/// Minimum time this screen stays up before routing onwards. The reveal
/// finishes at 350 + 600 = 950ms, leaving the finished mark on screen for
/// roughly a second.
const Duration _kMinDisplay = Duration(milliseconds: 2200);

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  // Logo lift + staggered wordmark reveal
  late final AnimationController _revealC = AnimationController(
    vsync: this,
    duration: _kRevealDuration,
  );

  // Subtle breathing pulse
  late final AnimationController _pulseC = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  // Shimmer light sheen
  late final AnimationController _shimmerC = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  // 0.0 → 0.75 of 600ms = 0–450ms
  late final Animation<double> _lift = CurvedAnimation(
    parent: _revealC,
    curve: const Interval(0.0, 0.75, curve: Curves.easeOutCubic),
  );

  // 0.167 → 1.0 of 600ms = 100–600ms (staggered behind the lift)
  late final Animation<double> _wordmark = CurvedAnimation(
    parent: _revealC,
    curve: const Interval(0.167, 1.0, curve: Curves.easeOutCubic),
  );

  late final Animation<double> _pulse = Tween<double>(begin: 1.0, end: 1.045).animate(
    CurvedAnimation(parent: _pulseC, curve: Curves.easeInOutSine),
  );

  /// Captured once so a mid-splash branding fetch cannot swap the text out
  /// from under the animation — `VersionGate` populates `BrandingProvider`
  /// from the backend while this screen is still on screen.
  late final String _appName;

  bool _ambientStarted = false;
  bool _minTimePassed = false;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _appName = context.read<BrandingProvider>().branding.appName;

    // Nothing moves until the settle delay elapses: the first frames this
    // screen paints are a pixel match for the native splash it replaced.
    Future.delayed(_kSettleDelay, () {
      if (!mounted) return;
      setState(() => _ambientStarted = true);
      _revealC.forward();
      _pulseC.repeat(reverse: true);
      _shimmerC.forward();
    });

    Future.delayed(_kMinDisplay, () {
      if (!mounted) return;
      _minTimePassed = true;
      _maybeAdvance();
    });
  }

  /// Navigate to Stores/Shell only when the logo has been displayed for at
  /// least [_kMinDisplay] and AuthProvider has finished bootstrapping.
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

  Shader _shimmerShader(Rect bounds) {
    final sweep = (_shimmerC.value * 2.6) - 0.8;
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
  }

  /// The brand name, split on the first space so it reads two-tone matching the
  /// logo's palette: Navy (#001D3D) leading word, Vibrant Red (#E6203A) remainder.
  Widget _buildWordmark(ThemeData theme) {
    // displayMedium is already Hanken Grotesk w800. Deriving from it keeps the
    // ExtraBold font file — copyWith(fontWeight:) on a lighter GoogleFonts
    // style would not switch families, it would only synthesise weight.
    final base = theme.textTheme.displayMedium?.copyWith(
      fontSize: _kWordmarkSize,
      letterSpacing: -0.4,
      fontWeight: FontWeight.w800,
      height: 1.1,
    );

    final split = _appName.indexOf(' ');
    // Logo Brand Palette: Navy (#001D3D) and Vibrant Red (#E6203A)
    const logoNavy = Color(0xFF001D3D);
    const logoRed = Color(0xFFE6203A);

    return Text.rich(
      TextSpan(
        style: base,
        children: split == -1
            ? [TextSpan(text: _appName, style: const TextStyle(color: logoNavy))]
            : [
                TextSpan(
                  text: _appName.substring(0, split),
                  style: const TextStyle(color: logoNavy),
                ),
                TextSpan(
                  text: _appName.substring(split),
                  style: const TextStyle(color: logoRed),
                ),
              ],
      ),
      textAlign: TextAlign.center,
      // The reserved slot height assumes an unscaled line box.
      textScaler: TextScaler.noScaling,
    );
  }

  @override
  void dispose() {
    _revealC.dispose();
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

    final theme = Theme.of(context);

    final logo = Image.asset(
      'assets/splash_logo.png',
      width: _kLogoWidth,
      fit: BoxFit.contain,
    );
    final wordmark = _buildWordmark(theme);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: AnimatedBuilder(
          animation: Listenable.merge([_revealC, _pulseC, _shimmerC]),
          builder: (context, _) => Transform.translate(
            offset: Offset(0, _kGroupLift * (1 - _lift.value)),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Before the settle delay the logo is drawn plainly — no
                // scale and no ShaderMask, so there is no saveLayer on the
                // frames that matter most for startup.
                if (!_ambientStarted)
                  logo
                else
                  Transform.scale(
                    scale: _pulse.value,
                    child: ShaderMask(
                      blendMode: BlendMode.srcATop,
                      shaderCallback: _shimmerShader,
                      child: logo,
                    ),
                  ),
                const SizedBox(height: _kWordmarkGap),
                SizedBox(
                  height: _kWordmarkSlot,
                  // Centred in the slot so the slack between the reserved
                  // height and the actual line box sits evenly above and below.
                  child: Center(
                    child: Opacity(
                      opacity: _wordmark.value,
                      child: Transform.translate(
                        offset: Offset(0, _kWordmarkRise * (1 - _wordmark.value)),
                        child: wordmark,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
