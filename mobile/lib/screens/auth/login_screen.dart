import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../state/auth_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/premium_text_field.dart';

/// Matches storefront `/login` behavior: a single screen with a sign-in /
/// sign-up toggle (storefront uses `?mode=signup`).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.initialMode, this.redirect});
  final String? initialMode;

  /// Optional route to land on after a successful sign-in (resume the
  /// destination the user was headed to, e.g. checkout).
  final String? redirect;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late bool _signup = widget.initialMode == 'signup';

  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _agree = false;
  bool _loading = false;

  Future<void> _submit() async {
    if (_signup && !_agree) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please agree to our terms and conditions')),
      );
      return;
    }
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email and password are required')),
      );
      return;
    }
    setState(() => _loading = true);
    final auth = context.read<AuthProvider>();
    try {
      if (_signup) {
        final fullName = '${_firstName.text.trim()} ${_lastName.text.trim()}'.trim();
        await auth.register(
          fullName: fullName,
          email: _email.text.trim(),
          password: _password.text,
          phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        );
      } else {
        await auth.signIn(email: _email.text.trim(), password: _password.text);
      }
      if (!mounted) return;
      final redirect = widget.redirect;
      if (redirect != null && redirect.isNotEmpty) {
        Navigator.of(context).pushReplacementNamed(redirect);
      } else {
        Navigator.of(context).pushNamedAndRemoveUntil(AppRouter.shell, (_) => false);
      }
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

  void _showSoon(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider sign-in is coming soon. Use email for now.')),
    );
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -80,
            left: -80,
            child: Container(
              height: 280,
              width: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.blue500.withValues(alpha: 0.35), Colors.transparent],
                ),
              ),
            ),
          ),
          Positioned(
            top: 100,
            right: -120,
            child: Container(
              height: 260,
              width: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppColors.red500.withValues(alpha: 0.25), Colors.transparent],
                ),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.md),
                  AnimatedPress(
                    onTap: () => Navigator.of(context).maybePop(),
                    child: Container(
                      height: 40,
                      width: 40,
                      decoration: BoxDecoration(
                        color: scheme.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: scheme.outlineVariant),
                      ),
                      child: Icon(Icons.arrow_back_rounded, size: 20, color: scheme.onSurface),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Container(
                    height: 64,
                    width: 64,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.blue500, AppColors.blue800],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.blue600.withValues(alpha: 0.35),
                          blurRadius: 30,
                          spreadRadius: -4,
                          offset: const Offset(0, 16),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.shopping_basket_rounded, color: Colors.white, size: 30),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    _signup ? 'Create your account' : 'Welcome back',
                    style: theme.textTheme.displaySmall,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _signup
                        ? 'Join Daily Grocer to unlock member prices and save your addresses.'
                        : 'Sign in to pick up where you left off.',
                    style: theme.textTheme.bodyLarge?.copyWith(color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  // Mode toggle
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                    ),
                    child: Row(
                      children: [
                        Expanded(child: _ModeTab(label: 'Sign in', selected: !_signup, onTap: () => setState(() => _signup = false))),
                        Expanded(child: _ModeTab(label: 'Sign up', selected: _signup, onTap: () => setState(() => _signup = true))),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  if (_signup) ...[
                    Row(
                      children: [
                        Expanded(
                          child: PremiumTextField(
                            label: 'First name',
                            hint: 'Aria',
                            controller: _firstName,
                            icon: Icons.person_outline_rounded,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: PremiumTextField(
                            label: 'Last name',
                            hint: 'Patel',
                            controller: _lastName,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.base),
                    PremiumTextField(
                      label: 'Mobile',
                      hint: '+44 7700 900000',
                      icon: Icons.phone_outlined,
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: AppSpacing.base),
                  ],
                  PremiumTextField(
                    label: 'Email',
                    hint: 'you@example.com',
                    icon: Icons.mail_outline_rounded,
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: AppSpacing.base),
                  PremiumTextField(
                    label: 'Password',
                    hint: _signup ? 'At least 8 characters' : 'Your password',
                    icon: Icons.lock_outline_rounded,
                    controller: _password,
                    obscure: true,
                    textInputAction: TextInputAction.done,
                  ),
                  if (_signup) ...[
                    const SizedBox(height: AppSpacing.md),
                    AnimatedPress(
                      onTap: () => setState(() => _agree = !_agree),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            height: 22,
                            width: 22,
                            margin: const EdgeInsets.only(top: 2),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: _agree ? scheme.primary : Colors.transparent,
                              border: Border.all(
                                color: _agree ? scheme.primary : scheme.outline,
                                width: 1.5,
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: _agree
                                ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                                : null,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'I agree to the Terms of Service and Privacy Policy.',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: AppSpacing.sm),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {},
                        child: const Text('Forgot password?'),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  PremiumButton(
                    label: _signup ? 'Create account' : 'Sign in',
                    expand: true,
                    loading: _loading,
                    onPressed: _loading ? null : _submit,
                    trailingIcon: Icons.arrow_forward_rounded,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      Expanded(child: Divider(color: scheme.outlineVariant)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text('or continue with', style: theme.textTheme.labelMedium),
                      ),
                      Expanded(child: Divider(color: scheme.outlineVariant)),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      Expanded(
                        child: PremiumButton(
                          variant: PremiumButtonVariant.surface,
                          label: 'Google',
                          icon: Icons.g_mobiledata_rounded,
                          expand: true,
                          onPressed: () => _showSoon('Google'),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: PremiumButton(
                          variant: PremiumButtonVariant.surface,
                          label: 'Apple',
                          icon: Icons.apple_rounded,
                          expand: true,
                          onPressed: () => _showSoon('Apple'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  const _ModeTab({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? t.colorScheme.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: t.colorScheme.primary.withValues(alpha: 0.10),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: t.textTheme.labelLarge?.copyWith(
            color: selected ? t.colorScheme.primary : t.colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
