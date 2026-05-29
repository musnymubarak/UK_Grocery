import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_spacing.dart';
import '../data/models/order.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final OrderStatus status;

  Color _bg() {
    switch (status) {
      case OrderStatus.delivered:
        return AppColors.success.withValues(alpha: 0.12);
      case OrderStatus.dispatched:
        return AppColors.blue500.withValues(alpha: 0.14);
      case OrderStatus.cancelled:
        return AppColors.red500.withValues(alpha: 0.14);
      case OrderStatus.picking:
      case OrderStatus.confirmed:
        return AppColors.warning.withValues(alpha: 0.14);
      case OrderStatus.placed:
        return AppColors.neutral200.withValues(alpha: 0.6);
    }
  }

  Color _fg() {
    switch (status) {
      case OrderStatus.delivered:
        return AppColors.success;
      case OrderStatus.dispatched:
        return AppColors.blue600;
      case OrderStatus.cancelled:
        return AppColors.red600;
      case OrderStatus.picking:
      case OrderStatus.confirmed:
        return AppColors.warning;
      case OrderStatus.placed:
        return AppColors.neutral700;
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: _bg(),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 6,
            width: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: _fg()),
          ),
          const SizedBox(width: 6),
          Text(
            status.label,
            style: t.textTheme.labelSmall?.copyWith(color: _fg(), fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
