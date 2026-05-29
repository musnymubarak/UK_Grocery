import 'package:flutter/material.dart';

import '../core/theme/app_spacing.dart';

class PremiumTextField extends StatefulWidget {
  const PremiumTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.icon,
    this.suffix,
    this.obscure = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
    this.autofocus = false,
    this.onChanged,
  });

  final String label;
  final String? hint;
  final TextEditingController? controller;
  final IconData? icon;
  final Widget? suffix;
  final bool obscure;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final bool autofocus;

  @override
  State<PremiumTextField> createState() => _PremiumTextFieldState();
}

class _PremiumTextFieldState extends State<PremiumTextField> {
  late final FocusNode _focus = FocusNode()..addListener(() => setState(() {}));
  bool _obscure = true;

  @override
  void initState() {
    super.initState();
    _obscure = widget.obscure;
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final focused = _focus.hasFocus;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            widget.label,
            style: theme.textTheme.labelMedium,
          ),
        ),
        AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(
              color: focused ? scheme.primary : scheme.outline,
              width: focused ? 1.5 : 1,
            ),
            boxShadow: focused
                ? [
                    BoxShadow(
                      color: scheme.primary.withValues(alpha: 0.15),
                      blurRadius: 16,
                      spreadRadius: 0,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: TextField(
            focusNode: _focus,
            controller: widget.controller,
            keyboardType: widget.keyboardType,
            textInputAction: widget.textInputAction,
            autofocus: widget.autofocus,
            obscureText: widget.obscure ? _obscure : false,
            onSubmitted: widget.onSubmitted,
            onChanged: widget.onChanged,
            style: theme.textTheme.bodyLarge,
            decoration: InputDecoration(
              hintText: widget.hint,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              prefixIcon: widget.icon == null
                  ? null
                  : Icon(widget.icon, size: 20, color: scheme.onSurfaceVariant),
              suffixIcon: widget.obscure
                  ? IconButton(
                      icon: Icon(
                        _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        size: 20,
                        color: scheme.onSurfaceVariant,
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    )
                  : widget.suffix,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
