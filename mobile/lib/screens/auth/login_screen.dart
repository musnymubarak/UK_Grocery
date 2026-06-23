import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../state/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.initialMode, this.redirect});
  final String? initialMode;
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
  final _confirmPassword = TextEditingController();
  
  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _agree = false;
  bool _marketingEmail = false;
  bool _marketingSms = false;
  bool _loading = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_signup && !_agree) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please agree to our terms and conditions')),
      );
      return;
    }
    if (_signup && _password.text != _confirmPassword.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match')),
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
          fullName: fullName.isEmpty ? 'User' : fullName,
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

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    String? hintText,
    bool obscureText = false,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    Widget? suffixIcon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        style: const TextStyle(color: Color(0xFF334155), fontSize: 16),
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
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
          suffixIcon: suffixIcon,
        ),
      ),
    );
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().signInWithGoogle();
      if (!mounted) return;
      final redirect = widget.redirect;
      if (redirect != null && redirect.isNotEmpty) {
        Navigator.of(context).pushReplacementNamed(redirect);
      } else {
        Navigator.of(context).pushNamedAndRemoveUntil(AppRouter.shell, (_) => false);
      }
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

        if (!mounted) return;
        final redirect = widget.redirect;
        if (redirect != null && redirect.isNotEmpty) {
          Navigator.of(context).pushReplacementNamed(redirect);
        } else {
          Navigator.of(context).pushNamedAndRemoveUntil(AppRouter.shell, (_) => false);
        }
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

  Widget _buildSocialButtons() {
    return Column(
      children: [
        OutlinedButton.icon(
          onPressed: _loading ? null : _handleAppleLogin,
          icon: const Icon(Icons.apple, color: Colors.black, size: 24),
          label: const Text('Login with Apple', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 14)),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            minimumSize: const Size(double.infinity, 50),
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _loading ? null : _handleGoogleLogin,
          icon: Image.asset('assets/google_g.png', height: 22, errorBuilder: (_,__,___) => const Icon(Icons.g_mobiledata_rounded, color: Colors.red)),
          label: const Text('Login with Google', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700, fontSize: 14)),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            minimumSize: const Size(double.infinity, 50),
          ),
        ),
      ],
    );
  }


  Widget _buildLoginForm(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Login to your account',
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineSmall?.copyWith(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Checkout quickly and earn member rewards',
          textAlign: TextAlign.center,
          style: theme.textTheme.titleMedium?.copyWith(
            color: const Color(0xFF64748B),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 32),
        _buildField(
          label: 'Email',
          hintText: 'you@example.com',
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
        ),
        _buildField(
          label: 'Password',
          hintText: 'Enter your password',
          controller: _password,
          obscureText: _obscure,
          textInputAction: TextInputAction.done,
          suffixIcon: IconButton(
            icon: Icon(
              _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              color: const Color(0xFF94A3B8),
            ),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        ),
        const SizedBox(height: 8),
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
            : const Text('Login', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ),
        const SizedBox(height: 16),
        _buildSocialButtons(),
        const SizedBox(height: 24),
        Center(
          child: InkWell(
            onTap: () {},
            child: const Text(
              'Forgotten your password?',
              style: TextStyle(
                color: Color(0xFF64748B),
                decoration: TextDecoration.underline,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),
        const Divider(color: Color(0xFFF1F5F9)),
        const SizedBox(height: 24),
        const Center(
          child: Text(
            "Don't have an account?",
            style: TextStyle(color: Color(0xFF94A3B8)),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: InkWell(
            onTap: () => setState(() => _signup = true),
            child: const Text(
              'Create Account',
              style: TextStyle(
                color: Color(0xFF005EB8),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCheckbox(bool value, Widget label, ValueChanged<bool?> onChanged) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            height: 48,
            width: 24,
            child: Checkbox(
              value: value,
              onChanged: onChanged,
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              activeColor: const Color(0xFF005EB8),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: label),
        ],
      ),
    );
  }

  Widget _buildSignupForm(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Create Account',
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineSmall?.copyWith(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Checkout quickly and use your loyalty points',
          textAlign: TextAlign.center,
          style: theme.textTheme.titleMedium?.copyWith(
            color: const Color(0xFF64748B),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 32),
        _buildField(
          label: 'First Name',
          hintText: 'e.g. Aria',
          controller: _firstName,
          textInputAction: TextInputAction.next,
        ),
        _buildField(
          label: 'Last Name',
          hintText: 'e.g. Patel',
          controller: _lastName,
          textInputAction: TextInputAction.next,
        ),
        _buildField(
          label: 'Email',
          hintText: 'you@example.com',
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
        ),
        _buildField(
          label: 'Phone Number',
          hintText: '+44 7700 900000',
          controller: _phone,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        Text(
          'Create Secure Password',
          textAlign: TextAlign.center,
          style: theme.textTheme.titleMedium?.copyWith(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 16),
        _buildField(
          label: 'Password',
          hintText: 'At least 8 characters',
          controller: _password,
          obscureText: _obscure,
          textInputAction: TextInputAction.next,
          suffixIcon: IconButton(
            icon: Icon(
              _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              color: const Color(0xFF94A3B8),
            ),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        ),
        _buildField(
          label: 'Confirm Password',
          hintText: 'Retype your password',
          controller: _confirmPassword,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              color: const Color(0xFF94A3B8),
            ),
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Marketing Preferences',
          style: theme.textTheme.titleSmall?.copyWith(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'How would you like us to keep in touch with you?',
          style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 12),
        _buildCheckbox(
          _marketingEmail,
          const Text('Email', style: TextStyle(color: Color(0xFF334155), fontWeight: FontWeight.w500)),
          (v) => setState(() => _marketingEmail = v ?? false),
        ),
        _buildCheckbox(
          _marketingSms,
          const Text('SMS', style: TextStyle(color: Color(0xFF334155), fontWeight: FontWeight.w500)),
          (v) => setState(() => _marketingSms = v ?? false),
        ),
        const SizedBox(height: 8),
        const Divider(color: Color(0xFFF1F5F9)),
        const SizedBox(height: 8),
        _buildCheckbox(
          _agree,
          RichText(
            text: TextSpan(
              style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B)),
              children: const [
                TextSpan(text: 'Agree to our '),
                TextSpan(text: 'terms and conditions', style: TextStyle(color: Color(0xFF005EB8), fontWeight: FontWeight.bold)),
                TextSpan(text: ' and '),
                TextSpan(text: 'privacy policy', style: TextStyle(color: Color(0xFF005EB8), fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          (v) => setState(() => _agree = v ?? false),
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
            : const Text('Create Account', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ),
        const SizedBox(height: 16),
        _buildSocialButtons(),
        const SizedBox(height: 32),
        Center(
          child: InkWell(
            onTap: () => setState(() => _signup = false),
            child: const Text.rich(
              TextSpan(
                style: TextStyle(color: Color(0xFF005EB8), fontWeight: FontWeight.bold, fontSize: 16),
                children: [
                  TextSpan(text: 'Already have an account? Login '),
                  WidgetSpan(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: 2),
                      child: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF005EB8)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
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
          onPressed: () => Navigator.of(context).maybePop(),
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
        child: _signup ? _buildSignupForm(theme) : _buildLoginForm(theme),
      ),
    );
  }
}
