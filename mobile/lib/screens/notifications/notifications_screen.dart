import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../data/models/notification.dart';
import '../../state/auth_provider.dart';
import '../../state/notifications_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_app_bar.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.embedded = false});

  /// When hosted as a bottom-nav tab there is no back button.
  final bool embedded;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.read<AuthProvider>().isAuthenticated) {
        context.read<NotificationsProvider>().refresh();
      }
    });
  }

  Future<void> _refresh() => context.read<NotificationsProvider>().refresh();

  void _onTap(AppNotification n) {
    context.read<NotificationsProvider>().markRead(n.id);
    if (n.type == 'order_update' && (n.referenceId?.isNotEmpty ?? false)) {
      Navigator.of(context).pushNamed(
        AppRouter.orderTracking,
        arguments: {'id': n.referenceId},
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final notifs = context.watch<NotificationsProvider>();
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            PremiumAppBar(
              title: 'Notifications',
              showBack: !widget.embedded,
              actions: [
                if (auth.isAuthenticated && notifs.unreadCount > 0)
                  CircleIconButton(
                    icon: Icons.done_all_rounded,
                    semanticLabel: 'Mark all read',
                    onTap: notifs.markAllRead,
                  ),
              ],
            ),
            Expanded(child: _body(auth, notifs)),
          ],
        ),
      ),
    );
  }

  Widget _body(AuthProvider auth, NotificationsProvider notifs) {
    if (!auth.isAuthenticated) {
      return EmptyState(
        icon: Icons.notifications_off_rounded,
        title: 'Sign in for notifications',
        message: 'Order updates, offers and rewards appear here.',
        action: PremiumButton(
          label: 'Sign in',
          icon: Icons.login_rounded,
          onPressed: () => Navigator.of(context).pushNamed(AppRouter.login),
        ),
      );
    }
    final items = notifs.items;
    if (notifs.loading && items == null) {
      return ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Skeleton(
          height: 84,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      );
    }
    if (notifs.error != null && items == null) {
      return EmptyState(
        icon: Icons.cloud_off_rounded,
        title: "Couldn't load notifications",
        message: notifs.error!,
        action: PremiumButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _refresh),
      );
    }
    final list = items ?? const <AppNotification>[];
    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.notifications_none_rounded,
              title: "You're all caught up",
              message: 'New order updates and offers will show up here.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 8, AppSpacing.lg, AppSpacing.xxl),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _NotificationCard(notification: list[i], onTap: () => _onTap(list[i])),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});
  final AppNotification notification;
  final VoidCallback onTap;

  ({IconData icon, Color color}) get _visual {
    switch (notification.type) {
      case 'order_update':
        return (icon: Icons.local_shipping_rounded, color: AppColors.blue600);
      case 'promo':
        return (icon: Icons.local_offer_rounded, color: AppColors.red500);
      case 'reward':
        return (icon: Icons.card_giftcard_rounded, color: AppColors.success);
      case 'refund':
        return (icon: Icons.receipt_long_rounded, color: AppColors.warning);
      default:
        return (icon: Icons.notifications_rounded, color: AppColors.blue600);
    }
  }

  String _timeAgo(DateTime t) {
    final d = DateTime.now().difference(t);
    if (d.inMinutes < 1) return 'Just now';
    if (d.inMinutes < 60) return '${d.inMinutes} min ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    if (d.inDays < 7) return '${d.inDays}d ago';
    return '${t.day}/${t.month}/${t.year}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final v = _visual;
    final unread = !notification.isRead;
    return AnimatedPress(
      onTap: onTap,
      child: Semantics(
        button: true,
        label: '${notification.title}. ${unread ? 'Unread.' : ''} ${notification.body}',
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.base),
          decoration: BoxDecoration(
            color: unread
                ? v.color.withValues(alpha: 0.06)
                : theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(
              color: unread ? v.color.withValues(alpha: 0.35) : theme.colorScheme.outlineVariant,
            ),
            boxShadow: AppShadows.soft(context),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  color: v.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: Icon(v.icon, size: 20, color: v.color),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                            ),
                          ),
                        ),
                        if (unread) ...[
                          const SizedBox(width: 8),
                          Container(
                            height: 8,
                            width: 8,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: v.color),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.body,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(_timeAgo(notification.createdAt), style: theme.textTheme.labelSmall),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
