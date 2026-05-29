import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/api/order_api.dart';
import '../../data/models/address.dart';
import '../../state/auth_provider.dart';
import '../../state/cart_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/premium_text_field.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  DeliveryAddress? _address;
  String _slot = 'In 30 min · Express';
  String _payment = 'cod';
  bool _processing = false;
  bool _newAddress = false;

  final _addressCtrl = TextEditingController();
  final _postcodeCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  // Authoritative delivery fee, resolved from the backend per postcode.
  double? _serverFee;
  bool _feeLoading = false;
  bool _deliverable = true;
  String? _feeMessage;

  final _promoCtrl = TextEditingController();
  double _appliedDiscount = 0;
  String? _promoError;
  String? _promoSuccess;
  bool _validatingPromo = false;

  @override
  void initState() {
    super.initState();
    final addresses = context.read<AuthProvider>().customer?.addresses ?? const <DeliveryAddress>[];
    if (addresses.isNotEmpty) {
      _address = addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);
    } else {
      _newAddress = true;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _recalcFee());
  }

  /// Resolve the authoritative delivery fee for the chosen postcode (mirrors the
  /// storefront). Falls back to the store's default fee when no postcode is known
  /// yet or the lookup fails, so the screen never blocks on the network.
  Future<void> _recalcFee() async {
    final store = context.read<StoreProvider>().selected;
    final postcode = (_newAddress ? _postcodeCtrl.text.trim() : _address?.postcode) ?? '';
    if (store == null || postcode.trim().isEmpty) {
      if (!mounted) return;
      setState(() {
        _serverFee = null;
        _deliverable = true;
        _feeMessage = null;
      });
      return;
    }
    setState(() => _feeLoading = true);
    try {
      final res = await Api.instance.catalog.calculateDistanceFee(
        storeId: store.id,
        postcode: postcode.trim(),
      );
      if (!mounted) return;
      setState(() {
        _serverFee = res.deliverable ? res.fee : null;
        _deliverable = res.deliverable;
        _feeMessage = res.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _serverFee = null;
        _deliverable = true;
        _feeMessage = null;
      });
    } finally {
      if (mounted) setState(() => _feeLoading = false);
    }
  }

  @override
  void dispose() {
    _promoCtrl.dispose();
    _addressCtrl.dispose();
    _postcodeCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _applyPromo() async {
    final auth = context.read<AuthProvider>();
    final store = context.read<StoreProvider>().selected;
    final cart = context.read<CartProvider>();
    final code = _promoCtrl.text.trim();
    if (code.isEmpty) return;
    if (!auth.isAuthenticated) {
      setState(() {
        _promoError = 'Sign in to apply a promo code.';
        _promoSuccess = null;
      });
      return;
    }
    if (store == null) {
      setState(() {
        _promoError = 'Select a store first.';
        _promoSuccess = null;
      });
      return;
    }
    setState(() {
      _validatingPromo = true;
      _promoError = null;
      _promoSuccess = null;
    });
    try {
      final res = await Api.instance.coupons.validate(
        code: code,
        storeId: store.id,
        subtotal: cart.subtotal,
        deliveryFee: _serverFee ?? store.defaultDeliveryFee,
      );
      if (!mounted) return;
      setState(() {
        if (res.valid) {
          _appliedDiscount = res.discountAmount;
          _promoSuccess =
              res.message ?? 'Promo applied — you saved ${formatGBP(res.discountAmount)}.';
          _promoError = null;
        } else {
          _appliedDiscount = 0;
          _promoError = res.message ?? "That code isn't valid.";
          _promoSuccess = null;
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _appliedDiscount = 0;
        _promoError = e.message;
        _promoSuccess = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _appliedDiscount = 0;
        _promoError = 'Could not validate the code. Please try again.';
        _promoSuccess = null;
      });
    } finally {
      if (mounted) setState(() => _validatingPromo = false);
    }
  }

  Future<void> _placeOrder() async {
    final auth = context.read<AuthProvider>();
    final cart = context.read<CartProvider>();
    final store = context.read<StoreProvider>().selected;

    if (!auth.isAuthenticated) {
      Navigator.of(context).pushNamed(AppRouter.login);
      return;
    }
    if (store == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a store first')),
      );
      return;
    }
    if (_newAddress) {
      if (_addressCtrl.text.trim().isEmpty || _postcodeCtrl.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter your delivery address and postcode')),
        );
        return;
      }
    } else if (_address == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please choose a delivery address')),
      );
      return;
    }
    if (cart.items.isEmpty) return;

    setState(() => _processing = true);
    try {
      final order = await Api.instance.orders.checkout(
        storeId: store.id,
        lines: cart.items
            .map((l) => CheckoutLine(productId: l.product.id, quantity: l.qty))
            .toList(),
        deliveryAddressId: _newAddress ? null : _address?.id,
        deliveryAddress: _newAddress ? _addressCtrl.text.trim() : null,
        deliveryPostcode: _newAddress ? _postcodeCtrl.text.trim() : _address?.postcode,
        paymentMethod: _payment,
        couponCode: _appliedDiscount > 0 ? _promoCtrl.text.trim().toUpperCase() : null,
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        ageConfirmed: cart.hasAgeRestricted,
      );
      if (!mounted) return;
      cart.clear();
      Navigator.of(context).pushReplacementNamed(
        AppRouter.orderSuccess,
        arguments: {'id': order.id},
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Couldn't place your order. Please try again.")),
      );
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cart = context.watch<CartProvider>();
    final auth = context.watch<AuthProvider>();
    final store = context.watch<StoreProvider>().selected;
    final defaultFee = store?.defaultDeliveryFee ?? 2.99;
    final delivery = _serverFee ?? defaultFee;
    final rawTotal = cart.subtotal + delivery - _appliedDiscount;
    final total = rawTotal < 0 ? 0.0 : rawTotal;
    final addresses = auth.customer?.addresses ?? const <DeliveryAddress>[];
    final minOrder = store?.minOrderValue ?? 0;
    final belowMin = minOrder > 0 && cart.subtotal < minOrder;
    final storeClosed = store != null && !store.isOpen;
    final gated = belowMin || storeClosed || !_deliverable || cart.items.isEmpty;
    final blockOrder = _processing || (auth.isAuthenticated && gated);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const PremiumAppBar(title: 'Checkout'),
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, 220),
                children: [
                  if (!auth.isAuthenticated) ...[
                    _SignInBanner(),
                    const SizedBox(height: AppSpacing.lg),
                  ],
                  Row(
                    children: [
                      const Expanded(
                        child: _SectionTitle(label: 'Delivery to', icon: Icons.place_rounded),
                      ),
                      if (addresses.isNotEmpty)
                        AnimatedPress(
                          onTap: () {
                            setState(() => _newAddress = !_newAddress);
                            _recalcFee();
                          },
                          child: Text(
                            _newAddress ? 'Use saved' : 'Add new',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_newAddress) ...[
                    PremiumTextField(
                      label: 'Postcode',
                      hint: 'e.g. SW1A 1AA',
                      controller: _postcodeCtrl,
                      icon: Icons.markunread_mailbox_outlined,
                      textInputAction: TextInputAction.next,
                      onChanged: (v) {
                        if (v.trim().length >= 5) _recalcFee();
                      },
                    ),
                    const SizedBox(height: AppSpacing.base),
                    PremiumTextField(
                      label: 'Street address',
                      hint: '123 Conservatory Lane',
                      controller: _addressCtrl,
                      icon: Icons.home_outlined,
                      textInputAction: TextInputAction.next,
                    ),
                  ] else
                    ...addresses.map(
                      (a) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: AnimatedPress(
                          onTap: () {
                            setState(() => _address = a);
                            _recalcFee();
                          },
                          child: _SelectableCard(
                            selected: a.id == _address?.id,
                            leading: _SquareIcon(icon: a.label == 'Home' ? Icons.home_rounded : Icons.work_rounded),
                            title: '${a.label} · ${a.postcode}',
                            subtitle: '${a.line1}, ${a.line2}, ${a.city}',
                            trailing: a.isDefault ? const _MutedTag(label: 'Default') : null,
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: AppSpacing.base),
                  PremiumTextField(
                    label: 'Delivery notes (optional)',
                    hint: 'Gate code, leave by the porch…',
                    controller: _notesCtrl,
                    icon: Icons.sticky_note_2_outlined,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  const _SectionTitle(label: 'Delivery slot', icon: Icons.schedule_rounded),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _SlotChip(
                          label: 'Express',
                          caption: 'Arrives in ~30 min',
                          icon: Icons.bolt_rounded,
                          selected: _slot.startsWith('In 30'),
                          colorA: AppColors.red500,
                          colorB: AppColors.red700,
                          onTap: () => setState(() => _slot = 'In 30 min · Express'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _SlotChip(
                          label: 'Standard',
                          caption: 'Evening · 6–7 PM',
                          icon: Icons.event_available_rounded,
                          selected: _slot.startsWith('6–7'),
                          colorA: AppColors.blue500,
                          colorB: AppColors.blue800,
                          onTap: () => setState(() => _slot = '6–7 PM · Standard'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  const _SectionTitle(label: 'Payment', icon: Icons.credit_card_rounded),
                  const SizedBox(height: 10),
                  _SelectableCard(
                    selected: _payment == 'card',
                    leading: const _SquareIcon(icon: Icons.credit_card_rounded),
                    title: 'Card payment',
                    subtitle: 'Pay securely on confirmation',
                    onTap: () => setState(() => _payment = 'card'),
                  ),
                  const SizedBox(height: 10),
                  _SelectableCard(
                    selected: _payment == 'wallet',
                    leading: const _SquareIcon(icon: Icons.account_balance_wallet_rounded),
                    title: 'Daily Grocer Wallet',
                    subtitle: 'Use your wallet balance',
                    onTap: () => setState(() => _payment = 'wallet'),
                  ),
                  const SizedBox(height: 10),
                  _SelectableCard(
                    selected: _payment == 'cod',
                    leading: const _SquareIcon(icon: Icons.payments_rounded),
                    title: 'Cash on delivery',
                    subtitle: 'Pay your driver at the door',
                    onTap: () => setState(() => _payment = 'cod'),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  const _SectionTitle(label: 'Promo code', icon: Icons.local_offer_rounded),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: PremiumTextField(
                          label: 'Promo code',
                          hint: 'e.g. WELCOME10',
                          controller: _promoCtrl,
                          icon: Icons.local_offer_outlined,
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => _applyPromo(),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      PremiumButton(
                        label: 'Apply',
                        variant: PremiumButtonVariant.surface,
                        loading: _validatingPromo,
                        onPressed: _validatingPromo ? null : _applyPromo,
                      ),
                    ],
                  ),
                  if (_promoError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _promoError!,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
                    ),
                  ],
                  if (_promoSuccess != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _promoSuccess!,
                      style: theme.textTheme.bodySmall?.copyWith(color: AppColors.success),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  _Summary(
                    subtotal: cart.subtotal,
                    delivery: delivery,
                    discount: _appliedDiscount,
                    feeLoading: _feeLoading,
                    savings: cart.savings,
                    total: total,
                  ),
                  if (!_deliverable && (_feeMessage?.isNotEmpty ?? false)) ...[
                    const SizedBox(height: AppSpacing.md),
                    _NoticeBanner(message: _feeMessage!),
                  ],
                  if (belowMin) ...[
                    const SizedBox(height: AppSpacing.md),
                    _NoticeBanner(
                      message:
                          'Add ${formatGBP(minOrder - cart.subtotal)} more to reach the ${formatGBP(minOrder)} minimum order.',
                    ),
                  ],
                  if (storeClosed) ...[
                    const SizedBox(height: AppSpacing.md),
                    const _NoticeBanner(
                      message: 'This store is currently closed and not accepting orders.',
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXxl)),
          boxShadow: AppShadows.elevated(context),
        ),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xl),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Total', style: theme.textTheme.labelMedium),
                  Text(
                    formatGBP(total),
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              PremiumButton(
                label: _processing
                    ? 'Placing order…'
                    : !auth.isAuthenticated
                        ? 'Sign in to order'
                        : belowMin
                            ? 'Minimum not met'
                            : storeClosed
                                ? 'Store closed'
                                : !_deliverable
                                    ? 'Not deliverable'
                                    : 'Place order',
                variant: PremiumButtonVariant.accent,
                icon: auth.isAuthenticated ? Icons.lock_outline_rounded : Icons.login_rounded,
                loading: _processing,
                onPressed: blockOrder ? null : _placeOrder,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SignInBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.blue600, AppColors.blue900],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        boxShadow: AppShadows.glowBlue(),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_outline_rounded, color: Colors.white, size: 22),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              'Sign in to place your order — saved addresses & tracking included.',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white),
            ),
          ),
          const SizedBox(width: 8),
          AnimatedPress(
            onTap: () => Navigator.of(context).pushNamed(AppRouter.login),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
              ),
              child: Text(
                'Sign in',
                style: theme.textTheme.labelLarge?.copyWith(color: AppColors.blue700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.label, required this.icon});
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Text(label, style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}

class _SelectableCard extends StatelessWidget {
  const _SelectableCard({
    required this.selected,
    required this.leading,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });
  final bool selected;
  final Widget leading;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return AnimatedPress(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: t.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: selected ? t.colorScheme.primary : t.colorScheme.outlineVariant,
            width: selected ? 1.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: t.colorScheme.primary.withValues(alpha: 0.18),
                    blurRadius: 24,
                    spreadRadius: -6,
                    offset: const Offset(0, 12),
                  ),
                ]
              : AppShadows.soft(context),
        ),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: t.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(subtitle, style: t.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (trailing != null) trailing!,
            const SizedBox(width: 4),
            AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              height: 22,
              width: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? t.colorScheme.primary : Colors.transparent,
                border: Border.all(
                  color: selected ? t.colorScheme.primary : t.colorScheme.outline,
                  width: 1.5,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _SquareIcon extends StatelessWidget {
  const _SquareIcon({required this.icon});
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      width: 40,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.blue500, AppColors.blue800],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }
}

class _MutedTag extends StatelessWidget {
  const _MutedTag({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Text(label, style: t.textTheme.labelSmall),
    );
  }
}

class _SlotChip extends StatelessWidget {
  const _SlotChip({
    required this.label,
    required this.caption,
    required this.icon,
    required this.selected,
    required this.colorA,
    required this.colorB,
    required this.onTap,
  });
  final String label;
  final String caption;
  final IconData icon;
  final bool selected;
  final Color colorA;
  final Color colorB;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return AnimatedPress(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: selected
              ? LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [colorA, colorB])
              : null,
          color: selected ? null : t.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: selected ? Colors.transparent : t.colorScheme.outlineVariant,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: colorA.withValues(alpha: 0.35),
                    blurRadius: 28,
                    spreadRadius: -6,
                    offset: const Offset(0, 14),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: selected ? Colors.white : t.colorScheme.primary, size: 22),
            const SizedBox(height: 10),
            Text(
              label,
              style: t.textTheme.titleMedium?.copyWith(
                color: selected ? Colors.white : t.colorScheme.onSurface,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              caption,
              style: t.textTheme.bodySmall?.copyWith(
                color: selected ? Colors.white.withValues(alpha: 0.86) : t.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoticeBanner extends StatelessWidget {
  const _NoticeBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: t.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: t.colorScheme.error.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, size: 18, color: t.colorScheme.error),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: t.textTheme.bodySmall?.copyWith(color: t.colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({
    required this.subtotal,
    required this.delivery,
    required this.discount,
    required this.feeLoading,
    required this.savings,
    required this.total,
  });
  final double subtotal;
  final double delivery;
  final double discount;
  final bool feeLoading;
  final double savings;
  final double total;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: t.colorScheme.outlineVariant),
      ),
      child: Column(
        children: [
          _row('Subtotal', formatGBP(subtotal)),
          const SizedBox(height: 8),
          _row('Delivery', feeLoading ? 'Calculating…' : (delivery == 0 ? 'Free' : formatGBP(delivery))),
          if (discount > 0) ...[
            const SizedBox(height: 8),
            _row('Discount', '−${formatGBP(discount)}', color: AppColors.success),
          ],
          if (savings > 0) ...[
            const SizedBox(height: 8),
            _row('You save', '−${formatGBP(savings)}', color: AppColors.success),
          ],
          const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider()),
          _row('Total', formatGBP(total), big: true),
        ],
      ),
    );
  }

  Widget _row(String label, String value, {Color? color, bool big = false}) {
    return Builder(
      builder: (context) {
        final t = Theme.of(context).textTheme;
        return Row(
          children: [
            Text(label, style: big ? t.titleLarge : t.bodyMedium),
            const Spacer(),
            Text(
              value,
              style: (big ? t.titleLarge : t.titleMedium)?.copyWith(color: color),
            ),
          ],
        );
      },
    );
  }
}
