import 'package:flutter/widgets.dart';

import '../router/app_router.dart';

/// A concrete navigation target for a notification, or null when the type
/// has no specific destination (caller decides the fallback).
class NotificationRoute {
  const NotificationRoute(this.name, this.arguments);
  final String name;
  final Object? arguments;
}

/// Single source of truth for where each notification type deep-links to —
/// used by both the in-app notifications list and the push-notification tap
/// handler, so the two stay consistent instead of duplicating per-type logic.
NotificationRoute? notificationRouteFor({required String? type, required String? referenceId}) {
  switch (type) {
    case 'order_update':
    case 'order_assigned':
      if (referenceId != null && referenceId.isNotEmpty) {
        return NotificationRoute(AppRouter.orderTracking, {'id': referenceId});
      }
      return null;
    case 'refund':
      return NotificationRoute(AppRouter.refunds, {'highlightId': referenceId});
    case 'promo':
      return NotificationRoute(AppRouter.offers, {'highlightId': referenceId});
    case 'reward':
      return NotificationRoute(AppRouter.rewards, {'highlightId': referenceId});
  }
  return null;
}

/// Navigates to the notification's target, falling back to the notifications
/// list itself when there is no specific destination (e.g. from a push tap,
/// where the app isn't already showing any particular screen).
void routeForNotification(
  NavigatorState navigator, {
  required String? type,
  required String? referenceId,
}) {
  final target = notificationRouteFor(type: type, referenceId: referenceId);
  if (target != null) {
    navigator.pushNamed(target.name, arguments: target.arguments);
  } else {
    navigator.pushNamed(AppRouter.notifications);
  }
}
