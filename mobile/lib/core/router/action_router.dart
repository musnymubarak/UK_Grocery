import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/models/section_action.dart';
import 'app_router.dart';

/// Translates a server-authored [SectionAction] into a navigation intent.
///
/// Mapping (matches the backend contract):
///   - `category` → aisle page for `id = value`
///   - `product`  → product page for `id = value`
///   - `search`   → search page seeded with `query = value`
///   - `offers`   → offers page
///   - `url`      → open `value` externally via url_launcher
///   - `none` / unknown → no-op
class ActionRouter {
  ActionRouter._();

  static Future<void> navigate(BuildContext context, SectionAction? action) async {
    if (action == null) return;
    final navigator = Navigator.of(context);
    switch (action.type) {
      case 'category':
        if (_isEmpty(action.value)) return;
        navigator.pushNamed(
          AppRouter.aisle,
          arguments: {'id': action.value, 'title': action.label},
        );
        return;
      case 'product':
        if (_isEmpty(action.value)) return;
        navigator.pushNamed(
          AppRouter.product,
          arguments: {'id': action.value},
        );
        return;
      case 'search':
        navigator.pushNamed(
          AppRouter.search,
          arguments: {'query': action.value},
        );
        return;
      case 'offers':
        navigator.pushNamed(AppRouter.offers);
        return;
      case 'url':
        final raw = action.value;
        if (_isEmpty(raw)) return;
        final uri = Uri.tryParse(raw!);
        if (uri == null) return;
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      case 'none':
      default:
        return;
    }
  }

  static bool _isEmpty(String? v) => v == null || v.trim().isEmpty;
}
