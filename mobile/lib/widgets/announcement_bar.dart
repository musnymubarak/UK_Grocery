import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/content_provider.dart';

/// Admin-controlled promo strip shown at the top of the home screen. Mirrors the
/// storefront `AnnouncementBar`: variant colours, optional CTA label, and a
/// dismiss button (dismissal persists per-content via [ContentProvider]).
class AnnouncementBar extends StatelessWidget {
  const AnnouncementBar({super.key});

  static const Map<String, Color> _bg = {
    'info': Color(0xFF0056B3),
    'success': Color(0xFF28A745),
    'warning': Color(0xFFF59E0B),
    'promo': Color(0xFFE6203A),
  };

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ContentProvider>();
    final a = provider.announcement;
    if (a == null) return const SizedBox.shrink();

    final bg = _bg[a.variant] ?? _bg['info']!;
    final fg = a.variant == 'warning' ? const Color(0xFF191C1D) : Colors.white;
    final hasCta = a.linkUrl.isNotEmpty && a.linkLabel.isNotEmpty;
    final text = hasCta ? '${a.message}   ${a.linkLabel} →' : a.message;

    return Material(
      color: bg,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            Expanded(
              child: Text(
                text,
                textAlign: TextAlign.center,
                style: TextStyle(color: fg, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
            if (a.dismissible)
              GestureDetector(
                onTap: () => context.read<ContentProvider>().dismissAnnouncement(),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Icon(Icons.close, size: 16, color: fg),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
