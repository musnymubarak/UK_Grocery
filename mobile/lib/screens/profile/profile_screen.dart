import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../state/auth_provider.dart';
import '../../widgets/animated_press.dart';

/// Mirrors storefront `/profile`. For unauthenticated visitors it shows a
/// sign-in CTA; signed-in users get account links that map to the storefront
/// destinations (orders, refunds, stores, legal pages).
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return const _UnauthenticatedLoginView();
    }

    return Scaffold(
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, AppSpacing.xxxl),
          children: [
            Text('Profile', style: theme.textTheme.displaySmall),
            const SizedBox(height: AppSpacing.xl),
            _SignedInHero(name: auth.displayName, email: auth.email, initials: auth.initials),
            const SizedBox(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(child: _Stat(label: 'Orders', value: '${auth.customer?.ordersCount ?? 0}')),
                const SizedBox(width: 10),
                Expanded(child: _Stat(label: 'Saved', value: '£${(auth.customer?.totalSaved ?? 0.0).toStringAsFixed(0)}')),
                const SizedBox(width: 10),
                Expanded(child: _Stat(label: 'Points', value: '${auth.customer?.points ?? 0}')),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Shop', style: theme.textTheme.titleLarge),
            const SizedBox(height: 10),
            _Tile(
              icon: Icons.receipt_long_rounded,
              title: 'Your orders',
              caption: 'Track, reorder, request a refund',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.orders),
            ),
            _Tile(
              icon: Icons.replay_rounded,
              title: 'Refunds & returns',
              caption: 'See the status of any refund',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.refunds),
            ),
            _Tile(
              icon: Icons.storefront_rounded,
              title: 'Your store',
              caption: 'Switch delivery location',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.stores),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Account', style: theme.textTheme.titleLarge),
            const SizedBox(height: 10),
            _Tile(
              icon: Icons.settings_outlined,
              title: 'Settings',
              caption: 'Legal, app info & preferences',
              onTap: () => Navigator.of(context).pushNamed(AppRouter.settings),
            ),
            const SizedBox(height: AppSpacing.xl),
            AnimatedPress(
              onTap: () {
                context.read<AuthProvider>().signOut();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.red500.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Text(
                  'Sign out',
                  style: theme.textTheme.labelLarge?.copyWith(color: AppColors.red600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnauthenticatedLoginView extends StatefulWidget {
  const _UnauthenticatedLoginView();

  @override
  State<_UnauthenticatedLoginView> createState() => _UnauthenticatedLoginViewState();
}

class _UnauthenticatedLoginViewState extends State<_UnauthenticatedLoginView> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty || _password.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().signIn(
            email: _email.text.trim(),
            password: _password.text,
          );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Something went wrong. Please try again.")),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().signInWithGoogle();
    } catch (e) {
      if (!mounted) return;
      final errorMsg = e.toString();
      if (!errorMsg.contains('cancelled') && !errorMsg.contains('sign_in_canceled')) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google Login failed: ${errorMsg.replaceAll('Exception: ', '')}')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleAppleLogin() async {
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      if (credential.identityToken != null && mounted) {
        setState(() => _loading = true);
        final email = credential.email;
        final fullName = [credential.givenName, credential.familyName]
            .where((n) => n != null && n.isNotEmpty)
            .join(' ');
            
        await context.read<AuthProvider>().appleSignIn(
          credential.identityToken!,
          email: email,
          fullName: fullName.isEmpty ? null : fullName,
        );
      }
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code != AuthorizationErrorCode.canceled && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Apple Login failed: ${e.message}')));
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Apple Login failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            // Can go back to menu since it's an account tab. 
            // The shell has logic to pop back to index 1 (menu).
            Navigator.of(context).maybePop();
          },
        ),
        titleSpacing: 0,
        title: Image.asset('assets/logo_playful.png', height: 28, errorBuilder: (_,__,___) => const Text('Daily Grocer', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold))),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: theme.colorScheme.outlineVariant, height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Login to your account',
              textAlign: TextAlign.center,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: const Color(0xFF0F172A), // Very dark navy
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Checkout quickly and earn member rewards',
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                color: const Color(0xFF64748B), // Slate/blue-grey
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              style: theme.textTheme.bodyLarge?.copyWith(color: const Color(0xFF334155)),
              decoration: InputDecoration(
                labelText: 'Email',
                hintText: 'you@example.com',
                labelStyle: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                floatingLabelBehavior: FloatingLabelBehavior.always,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF005EB8), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _password,
              obscureText: _obscure,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
              style: theme.textTheme.bodyLarge?.copyWith(color: const Color(0xFF334155)),
              decoration: InputDecoration(
                labelText: 'Password',
                hintText: 'Enter your password',
                labelStyle: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                floatingLabelBehavior: FloatingLabelBehavior.always,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF005EB8), width: 1.5),
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: const Color(0xFF94A3B8),
                  ),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF005EB8),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ),
              child: _loading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Login', style: theme.textTheme.labelLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _loading ? null : _handleAppleLogin,
              icon: const Icon(Icons.apple, color: Colors.black, size: 24),
              label: Text('Login with Apple', style: theme.textTheme.labelLarge?.copyWith(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _loading ? null : _handleGoogleLogin,
              icon: Image.asset('assets/google_g.png', height: 22, errorBuilder: (_,__,___) => const Icon(Icons.g_mobiledata_rounded, color: Colors.red)),
              label: Text('Login with Google', style: theme.textTheme.labelLarge?.copyWith(color: const Color(0xFF0F172A), fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: InkWell(
                onTap: () {},
                child: Text(
                  'Forgotten your password?',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF64748B),
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            const Divider(color: Color(0xFFF1F5F9)),
            const SizedBox(height: 24),
            Center(
              child: Text(
                "Don't have an account?",
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF94A3B8),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: InkWell(
                onTap: () => Navigator.of(context).pushNamed(AppRouter.login, arguments: {'mode': 'signup'}),
                child: Text(
                  'Create Account',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: const Color(0xFF005EB8),
                    fontWeight: FontWeight.bold,
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

class _SignedInHero extends StatelessWidget {
  const _SignedInHero({required this.name, required this.email, required this.initials});
  final String name;
  final String? email;
  final String initials;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.blue900,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
      ),
      child: Row(
        children: [
          Container(
            height: 64,
            width: 64,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
            ),
            child: ShaderMask(
              shaderCallback: (rect) => const LinearGradient(
                colors: [AppColors.blue700, AppColors.red500],
              ).createShader(rect),
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: theme.textTheme.headlineSmall?.copyWith(color: Colors.white),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  email ?? '',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.7)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  ),
                  child: const Text(
                    'MEMBER',
                    style: TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: t.colorScheme.outlineVariant),
        boxShadow: AppShadows.soft(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: t.textTheme.headlineSmall),
          const SizedBox(height: 2),
          Text(label, style: t.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.icon,
    required this.title,
    required this.caption,
    this.onTap,
  });
  final IconData icon;
  final String title;
  final String caption;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return AnimatedPress(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: t.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: t.colorScheme.outlineVariant),
        ),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: t.colorScheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: t.colorScheme.primary, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: t.textTheme.titleMedium),
                  Text(caption, style: t.textTheme.bodySmall),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: t.colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
