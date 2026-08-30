import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/api/api_registry.dart';
import '../../data/api/rewards_api.dart';
import '../../state/auth_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key, this.highlightId});

  /// A reward event id to scroll to and briefly highlight, e.g. when opened
  /// from a "reward" notification.
  final String? highlightId;

  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  RewardsProgress? _progress;
  bool _loading = true;
  String? _error;
  String? _highlightedId;
  final Map<String, GlobalKey> _itemKeys = {};

  @override
  void initState() {
    super.initState();
    _highlightedId = widget.highlightId;
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!context.read<AuthProvider>().isAuthenticated) {
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final progress = await Api.instance.rewards.myProgress();
      if (!mounted) return;
      setState(() {
        _progress = progress;
        _itemKeys.clear();
        for (final e in progress.events) {
          _itemKeys[e.id] = GlobalKey();
        }
        _loading = false;
      });
      _scrollToHighlighted();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "Couldn't load rewards";
        _loading = false;
      });
    }
  }

  void _scrollToHighlighted() {
    final id = _highlightedId;
    if (id == null) return;
    final key = _itemKeys[id];
    if (key == null) {
      _highlightedId = null;
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = key.currentContext;
      if (ctx != null) {
        Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 400), alignment: 0.2);
      }
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _highlightedId = null);
      });
    });
  }

  String _formatDate(DateTime t) {
    final d = DateTime.now().difference(t);
    if (d.inMinutes < 60) return '${d.inMinutes} min ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    if (d.inDays < 7) return '${d.inDays}d ago';
    return '${t.day}/${t.month}/${t.year}';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const PremiumAppBar(title: 'Rewards'),
            Expanded(child: _body(auth)),
          ],
        ),
      ),
    );
  }

  Widget _body(AuthProvider auth) {
    if (!auth.isAuthenticated) {
      return EmptyState(
        icon: Icons.login_rounded,
        title: 'Sign in to view rewards',
        message: 'Rewards are tied to your account.',
        action: PremiumButton(
          label: 'Sign in',
          icon: Icons.login_rounded,
          onPressed: () => Navigator.of(context).pushNamed(AppRouter.login),
        ),
      );
    }
    if (_loading) {
      return ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Skeleton(
          height: 90,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      );
    }
    if (_error != null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load rewards",
        message: _error!,
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }
    final progress = _progress;
    final events = progress?.events ?? const <RewardEvent>[];
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.blue600,
              borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'This month\'s spend',
                  style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.85)),
                ),
                const SizedBox(height: 4),
                Text(
                  '£${(progress?.totalSpend ?? 0).toStringAsFixed(2)}',
                  style: theme.textTheme.displaySmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Your rewards', style: theme.textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          if (events.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
              child: EmptyState(
                icon: Icons.card_giftcard_rounded,
                title: 'No rewards earned yet this month',
                message: 'Keep shopping to unlock your next reward.',
              ),
            )
          else
            ...events.map((e) {
              final isHighlighted = e.id == _highlightedId;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AnimatedContainer(
                  key: _itemKeys[e.id],
                  duration: const Duration(milliseconds: 400),
                  padding: const EdgeInsets.all(AppSpacing.base),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    border: Border.all(
                      color: isHighlighted ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                      width: isHighlighted ? 2 : 1,
                    ),
                    boxShadow: AppShadows.soft(context),
                  ),
                  child: Row(
                    children: [
                      Container(
                        height: 44,
                        width: 44,
                        decoration: BoxDecoration(
                          color: AppColors.blue600.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.workspace_premium_rounded, color: AppColors.blue600),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.tier?.name ?? 'Reward unlocked', style: theme.textTheme.titleMedium),
                            const SizedBox(height: 2),
                            Text(
                              'Redeemable at checkout · ${_formatDate(e.createdAt)}',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
