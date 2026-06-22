import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/api/api_registry.dart';
import '../../data/models/product.dart';
import '../../state/auth_provider.dart';
import '../../state/content_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  List<Product>? _promos;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final storeId = context.read<StoreProvider>().selected?.id;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await Api.instance.catalog.getOffers(storeId: storeId);
      if (!mounted) return;
      setState(() {
        _promos = list;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "Couldn't load offers";
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final t = context.watch<ContentProvider>().t;
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_rounded, color: theme.colorScheme.onSurface),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        body: SafeArea(
          child: EmptyState(
            icon: Icons.local_offer_outlined,
            title: 'Sign in to view offers',
            message: 'Members get access to exclusive discounts, coupons, and rewards.',
            action: PremiumButton(
              label: 'Sign In',
              icon: Icons.login_rounded,
              onPressed: () => Navigator.of(context).pushNamed('/login'),
            ),
          ),
        ),
      );
    }

    const coupons = [
      _Coupon(
        code: 'WELCOME10',
        title: '10% off your first order',
        caption: 'Min spend £15 · Ends Sunday',
        fill: AppColors.blue600,
      ),
      _Coupon(
        code: 'BLOOM10',
        title: '£10 off — members only',
        caption: 'On orders over £40',
        fill: AppColors.red500,
      ),
      _Coupon(
        code: 'FREEDEL',
        title: 'Free delivery week',
        caption: 'Auto-applied at checkout',
        fill: AppColors.success,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          onRefresh: _load,
          color: theme.colorScheme.primary,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, AppSpacing.xxxl),
            children: [
              Text(t('offers.header_title', 'Offers & rewards'), style: theme.textTheme.displaySmall),
              const SizedBox(height: 4),
              Text(
                t('offers.header_subtitle', 'Hand-picked savings for our members.'),
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.xl),
              const _RewardsHero(),
              const SizedBox(height: AppSpacing.xl),
              Text(t('offers.coupons_title', 'Active coupons'), style: theme.textTheme.titleLarge),
              const SizedBox(height: AppSpacing.md),
              ...coupons.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _CouponCard(coupon: c),
                  )),
              const SizedBox(height: AppSpacing.xl),
              Text('On offer', style: theme.textTheme.titleLarge),
              const SizedBox(height: AppSpacing.md),
              _offersBody(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _offersBody() {
    if (_loading) {
      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.66,
        ),
        itemCount: 4,
        itemBuilder: (_, __) => Skeleton(
          height: 240,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      );
    }
    if (_error != null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load offers",
        message: _error!,
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }
    final promos = _promos ?? const <Product>[];
    if (promos.isEmpty) {
      return const EmptyState(
        icon: Icons.local_offer_outlined,
        title: 'No active offers',
        message: 'Member offers refresh every Monday morning.',
      );
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.66,
      ),
      itemCount: promos.length,
      itemBuilder: (_, i) => ProductCard(product: promos[i]),
    );
  }
}

class _RewardsHero extends StatelessWidget {
  const _RewardsHero();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const progress = 0.72;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.blue600,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                ),
                child: const Text(
                  'GOLD MEMBER',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1.0),
                ),
              ),
              const Spacer(),
              const Icon(Icons.workspace_premium_rounded, color: Colors.white),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            '£72 of £100',
            style: theme.textTheme.displaySmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
          ),
          Text(
            'Spend £28 more this month to unlock Platinum.',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.85)),
          ),
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white.withValues(alpha: 0.18),
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class _Coupon {
  const _Coupon({
    required this.code,
    required this.title,
    required this.caption,
    required this.fill,
  });
  final String code;
  final String title;
  final String caption;
  final Color fill;
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({required this.coupon});
  final _Coupon coupon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedPress(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${coupon.code} copied to clipboard')),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(color: theme.colorScheme.outlineVariant),
          boxShadow: AppShadows.soft(context),
        ),
        child: Row(
          children: [
            Container(
              height: 96,
              width: 96,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(AppSpacing.radiusLg),
                  bottomLeft: Radius.circular(AppSpacing.radiusLg),
                ),
                color: coupon.fill,
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 30),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(coupon.title, style: theme.textTheme.titleMedium),
                    Text(coupon.caption, style: theme.textTheme.bodySmall),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        coupon.code,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Icon(Icons.arrow_forward_rounded, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
