# Daily Grocer Mobile — Change Log

Running log of production-readiness changes. Spec: `.claude/memory/daily-grocer-mobile-brief.md`.
Each entry maps to a single-concern commit; `flutter analyze` is clean before each.

## Phase 1 — Screen & flow parity

### Build infra — track mobile in monorepo + android/ios scaffold
- Removed `/mobile` from the repo root `.gitignore`. The entire Flutter app was previously
  untracked/ignored; it is now version-controlled in the monorepo so CI can build it.
- Generated `android/` and `ios/` via `flutter create . --platforms=android,ios --org uk.co.dailygrocer`
  so a clean checkout builds. Removed the out-of-scope `web/` and `windows/` scaffolds
  (target is App Store / Play Store only).
- Baseline `flutter analyze`: 0 errors / 0 warnings (9 pre-existing `info` lints in untouched files).

### Checkout — honest totals + delivery gating (parity with storefront money path)
- **Removed the tip selector.** The backend checkout schema (`OrderCreate`) has no tip field
  and the storefront sends none, so the mobile tip was shown in the total but never charged —
  a misleading total. Removed the UI, the `_tip` state, and the tip row in the summary.
- **Authoritative delivery fee.** `CatalogApi.calculateDeliveryFee` called `/delivery/calculate-fee`
  and parsed non-existent keys (`fee`/`free_delivery`) so it always returned 0. Replaced it with
  `calculateDistanceFee` → `POST /delivery/calculate-distance-fee?store_id=&postcode=` returning
  `{deliverable, delivery_fee, distance_miles, message}` (the same call the storefront checkout uses).
  Checkout now resolves the fee from the selected address's postcode (loading state in the summary;
  falls back to the store's default fee if no postcode / on failure).
- **Gating** mirroring the storefront: minimum-order-value, store-closed, and not-deliverable each
  disable the Place-order button and show an explanatory banner.
- Delivery-slot chips kept as a display-only choice (the storefront's delivery-time selector is also
  cosmetic). Not wired to `scheduled_delivery_start/end` yet — would need backend ASAP-vs-scheduled
  behavior confirmed first. A flat service/tax fee (storefront hardcodes £1.85) was intentionally not
  copied; the authoritative total comes back on the created order.

### Checkout — promo code
- New `CouponApi.validate` → `POST /coupons/validate` ({code, store_id, subtotal, delivery_fee} →
  {valid, discount_amount, message}), registered as `Api.instance.coupons`. Mirrors the storefront.
- Added a Promo-code section (design-system `PremiumTextField` + `PremiumButton`) with a loading
  state, inline success/error text, and an applied-discount row in the summary. The discount is
  subtracted from the displayed total and the validated `coupon_code` is sent on checkout.
- Validation requires a customer token, so Apply is guarded when signed out (prompts sign-in)
  to avoid a 401 → forced-logout.

### Checkout — delivery address entry + notes
- Replaced the unused `_adHocAddress`/`_adHocPostcode` placeholders with real inputs.
  Saved-address users get a "Use saved / Add new" toggle (storefront parity); users with no
  saved address now get postcode + street fields instead of a dead "we'll use your default
  address" panel.
- Postcode entry drives the live delivery-fee lookup (recalculates once ≥5 chars).
- Added a Delivery-notes field (sent as `notes`). On submit, new-address mode sends
  `delivery_address` + `delivery_postcode`; saved mode sends `delivery_address_id`.

### Store — persist selection across cold start
- `StoreProvider` hydrates the selected store from SharedPreferences (`dg_store`) on launch and
  persists on select/clear, so the chosen store survives a cold restart (mirrors the storefront's
  `dg_store`). Added `StoreLocation.toJson`. On refresh, the persisted selection is reconciled with
  the latest store data so hours/fees stay current.

### Store — clear cart on store switch
- Selecting a *different* store with a non-empty basket now shows a themed confirm dialog
  (design-system `Dialog` + `PremiumButton`s, not a bare `AlertDialog`); confirming clears the cart
  before switching. The storefront keeps the cart across stores, but cart items aren't guaranteed to
  exist or price the same at another store, so this implements the brief's "validate/clear on switch".

### Notifications — inbox screen, API service, unread badge
- New `AppNotification` model + `NotificationApi` (`/notifications/me`, `/me/count`, `/me/{id}/read`,
  `/me/read-all`), registered as `Api.instance.notifications`.
- `NotificationsProvider` holds the inbox + unread count with optimistic mark-read / mark-all-read.
  Registered globally; the shell loads the count on launch when authenticated.
- New Notifications screen — added as an "Alerts" bottom-nav tab and a `/notifications` route. Has
  loading skeletons, error + retry, an "all caught up" empty state, pull-to-refresh, tap-to-read and
  a mark-all-read action. `order_update` notifications with a `reference_id` deep-link to tracking.
- `PremiumBottomNav` renders the unread count as a badge on the Alerts tab (same mechanism as cart).

### Settings — dedicated screen
- New `/settings` screen with Legal links + an About/version card. The legal links moved off the
  profile screen into Settings (profile now has an Account → Settings entry), so they live in one
  place instead of being duplicated.

