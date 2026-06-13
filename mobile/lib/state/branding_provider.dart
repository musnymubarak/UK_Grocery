import 'package:flutter/foundation.dart';

import '../data/models/branding.dart';

/// Holds the admin-controlled branding (app name, logo, palette) fetched from
/// `GET /storefront/app-config` (the `branding` object). Populated once at
/// startup by the version gate; defaults until then so the brand is never blank.
class BrandingProvider extends ChangeNotifier {
  BrandingConfig _b = BrandingConfig.defaults();

  BrandingConfig get branding => _b;

  /// Replace the active branding and notify listeners.
  void setBranding(BrandingConfig b) {
    _b = b;
    notifyListeners();
  }
}
