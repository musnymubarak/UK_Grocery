import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_registry.dart';
import '../../data/api/refund_api.dart';
import '../../state/auth_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

class RefundStatusScreen extends StatefulWidget {
  const RefundStatusScreen({super.key});

  @override
  State<RefundStatusScreen> createState() => _RefundStatusScreenState();
}

class _RefundStatusScreenState extends State<RefundStatusScreen> {
  List<RefundRecord>? _items;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!context.read<AuthProvider>().isAuthenticated) {
      setState(() {
        _loading = false;
        _items = const [];
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await Api.instance.refunds.listMine();
      if (!mounted) return;
      setState(() {
        _items = list;
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
        _error = "Couldn't load refunds";
        _loading = false;
      });
    }
  }

  Color _accent(String status) {
    switch (status.toLowerCase()) {
      case 'refunded':
      case 'approved':
      case 'completed':
        return AppColors.success;
      case 'pending':
      case 'under_review':
      case 'reviewing':
        return AppColors.warning;
      case 'rejected':
      case 'denied':
        return AppColors.red500;
      default:
        return AppColors.warning;
    }
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'refunded':
        return 'Refunded';
      case 'approved':
        return 'Approved';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'under_review':
      case 'reviewing':
        return 'Under review';
      case 'rejected':
        return 'Rejected';
      case 'denied':
        return 'Denied';
      default:
        return status.isNotEmpty ? status[0].toUpperCase() + status.substring(1) : 'Pending';
    }
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
            const PremiumAppBar(title: 'Refunds & returns'),
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
        title: 'Sign in to view refunds',
        message: 'Refunds are tied to your account.',
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
          height: 150,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      );
    }
    if (_error != null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load refunds",
        message: _error!,
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
      );
    }
    final items = _items ?? const <RefundRecord>[];
    if (items.isEmpty) {
      return const EmptyState(
        icon: Icons.replay_rounded,
        title: 'No active refunds',
        message: 'Anything you request will appear here.',
      );
    }
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final r = items[i];
          final c = _accent(r.status);
          final label = _statusLabel(r.status);
          return Container(
            padding: const EdgeInsets.all(AppSpacing.base),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              border: Border.all(color: theme.colorScheme.outlineVariant),
              boxShadow: AppShadows.soft(context),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Refund ${r.id}', style: theme.textTheme.titleMedium),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: c.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            height: 6,
                            width: 6,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: c),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            label,
                            style: theme.textTheme.labelSmall?.copyWith(color: c, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${r.orderNumber.isEmpty ? 'Order' : 'Order ${r.orderNumber}'} · ${_formatDate(r.createdAt)}',
                  style: theme.textTheme.bodySmall,
                ),
                if (r.reason.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(r.reason, style: theme.textTheme.bodyMedium),
                ],
                const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider()),
                Row(
                  children: [
                    Text('Amount', style: theme.textTheme.bodyMedium),
                    const Spacer(),
                    Text(
                      formatGBP(r.amount),
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
