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

### Pagination — audit + backend flag (no app change)
Reviewed all list screens against backend capability:
- **Search** and **Aisle** (the real product lists) already paginate via `/storefront/products`
  `skip`/`limit` — no change needed.
- **Home** is a curated landing (24 featured products + categories); infinite-scrolling the whole
  catalog there would duplicate Aisle/Search, so it stays curated by design.
- **Offers** is a server-capped deals page (`/storefront/offers` hard-limits to ≤20–50, no `skip`) —
  not paginatable by design.
- **Order history** (`/orders/me`) and **Refunds** (`/refunds/me`) return the *entire* list with no
  `skip`/`limit` params. **FLAG:** true pagination here needs a backend change (add `skip`/`limit`
  + a paged response) — not done here per the "don't silently edit backend" rule.

### Order tracking — pull-to-refresh + refresh on resume
- Added a `RefreshIndicator` and a `WidgetsBindingObserver` that quietly reloads the order when the
  app returns to the foreground (status is time-sensitive). The silent reload keeps the last good
  data on screen instead of flashing the skeleton, and a transient failure no longer wipes an
  already-loaded order.

### Auth — refresh token, transparent 401 refresh, profile-after-login, resume destination
- `TokenStorage` now persists the refresh token (`customer_refresh_token`) next to the access token.
- `ApiClient` refreshes transparently on 401: a single-flight call (via an interceptor-free Dio to
  `POST /customers/refresh`) then retries the original request once; on failure it clears tokens and
  fires `onAuthExpired` (the prior behaviour). Only the 401 path is affected — normal traffic is
  untouched, and a per-request `__retried` flag plus a bare client prevent refresh loops.
- The customer `Token` response carries no profile, so `login`/`register`/`googleLogin` now persist
  tokens and `AuthProvider` loads the customer via `/customers/me`. Previously it parsed an empty
  customer from the token payload, so the profile showed "Guest" until the next launch. `logout` now
  sends the refresh token for server-side revoke.
- `LoginScreen` accepts a `redirect` route and lands there after sign-in; checkout passes
  `redirect=/checkout`, so users resume checkout after authenticating.
- **Needs device verification:** the 401 → refresh → retry path only runs on token expiry.

### Auth — inline real-time form validation
- `PremiumTextField` gained an `errorText` (error-coloured border + message below the field).
- Login/register validate as you type: email format and, on sign-up, an 8-char minimum password.
  The submit button stays disabled until the form is valid (and the terms box is ticked on sign-up),
  replacing the previous submit-time-only snackbar checks.

### Google sign-in — flagged, blocked on OAuth config (not implemented)
The mobile plumbing already exists: `CustomerAuthApi.googleLogin(idToken)` →
`POST /customers/google`, surfaced via `AuthProvider.googleSignIn(idToken)`. The login button
still shows "coming soon" because acquiring the Google `idToken` needs config that only the project
owner can supply:
1. Add the `google_sign_in` package.
2. A **Web** OAuth client ID (`serverClientId`) that matches the backend's `GOOGLE_CLIENT_ID`
   (the backend validates the idToken against it).
3. Android: register the app's SHA-1 and add `google-services.json` (or pass the serverClientId);
   iOS: add the reversed-client-ID URL scheme to `Info.plist`.
4. Replace `_showSoon('Google')` in `login_screen.dart` with the real flow calling
   `context.read<AuthProvider>().googleSignIn(idToken)`.
"Sign in with Apple" is in the same state (needs an Apple Developer Services ID + capability).

### Backend connection — release builds point at production
- `ApiConfig` now returns `https://api.dailygrocer.co.uk` for **release** builds (App Store / Play
  Store), while debug/profile keep the local backend (`10.0.2.2` on Android emulator, else
  `localhost:8000`) and `--dart-define=API_BASE_URL` still overrides everything. This preserves the
  brief's dev base-URL resolution and only adds a production default for release.
- Verified live: `GET https://api.dailygrocer.co.uk/api/v1/storefront/categories` → 200. The prod
  nginx `api.` server block proxies `/` to the backend with the path preserved, so the API resolves
  at `/api/v1/...` and product images at `/uploads/...`.
- To test prod from a debug build: `flutter run --dart-define=API_BASE_URL=https://api.dailygrocer.co.uk`.

