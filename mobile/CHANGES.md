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

### Backend connection — production by default
- `ApiConfig` defaults to `https://api.dailygrocer.co.uk` for **all** builds (debug + release), so
  `flutter run` connects to prod with no flag. Pass `--dart-define=API_BASE_URL=http://10.0.2.2:8000`
  (Android emulator) or `http://localhost:8000` (desktop / iOS sim) for a local backend.
  (Deviates from the brief's local-first default per the owner's instruction to connect mobile to prod.)
- Verified live: `GET https://api.dailygrocer.co.uk/api/v1/storefront/categories` → 200. The prod
  nginx `api.` server block proxies `/` to the backend with the path preserved, so the API resolves
  at `/api/v1/...` and product images at `/uploads/...`.
- Re-added Windows desktop support (`windows/`) so the app can be run/verified on Windows
  (`flutter run -d windows`). Regenerate any time via `flutter create . --platforms=windows`.

## Reskin — adopt the storefront's flat/light design system

> Reverses the brief's "premium gradients/glows" direction, per the owner's request that the app
> match the storefront's cleaner, flatter look. Done centrally (tokens → theme → primitives →
> screen sweep) so it propagates everywhere.

### Core tokens + theme
- **Palette** retuned to the storefront: navy `#001d3d` / action-blue `#0056b3` / action-red
  `#e6203a` with crisp light neutrals. AppColors symbol names kept stable so every screen re-skins
  automatically; brand gradients recoloured (flattened in the screen sweep).
- **Typography** switched to Hanken Grotesk (headings) + Inter (body), matching the storefront.
- **Radii** shrunk to the storefront scale (cards ~8–12px, was 16–28px). **Shadows** flattened:
  `soft()` returns none (cards now rely on hairline borders), `glowBlue/glowRed` disabled,
  `elevated()` kept as a single subtle lift for floating surfaces.
- **ThemeData**: page background → `#f8f9fa` with white bordered cards; colorScheme roles mapped to
  storefront (primary=action-blue, secondary=action-red, outline `#74777f`, hairline `#c4c6cf`).

### Shared primitives flattened
- **PremiumButton**: solid fills (primary=action-blue, accent=action-red, ghost/surface bordered),
  gradients and glows removed.
- **GlassCard**: now a flat white hairline-bordered card (no blur/glass).
- **PremiumBottomNav**: the selected tab is a solid action-blue pill (was a gradient + glow).
- **ProductCard**: ADD pill + qty stepper solid green, savings pill solid red, member pill solid
  gold — glows removed. **SectionHeader** stripe, **EmptyState** icon disc, and **CategoryTile**
  chevron flattened to solid fills. (`Skeleton` shimmer and the `ProductThumb` image fallback kept.)

### Screen sweep — inline gradients/glows flattened
- Removed ~40 inline gradient fills + coloured glow shadows across all 13 screens (checkout
  sign-in/slot/payment cards, profile & tracking & order-success heroes, login/splash/landing
  background blobs + logos, home location/member/banner strips, store/category/coupon swatches),
  replacing them with solid navy / red / green brand fills. Net −326 lines.
- Kept: the `Skeleton` shimmer, the `ProductThumb` image fallback, and the `ShaderMask`-recoloured
  logo wordmarks (those tint text, not surfaces). All 17 tests pass; `flutter analyze` clean.

### Exact-copy rebuild — Home (reference screen)
- Reworked `home_screen.dart` into a layout-for-layout port of the storefront `/browse`: centred
  store-name strip, an auto-advancing hero banner carousel with dot indicators (and the blue
  "Free Delivery Today!" promo fallback when there are no banners), the three promo cards
  (pricing-info chip → delivery-pricing sheet, blue rewards card, red free-delivery card), then the
  "Categories" 2-column circle-image tile grid linking into aisles.
- Dropped the old product grid + reorder strip — the storefront Home shows categories, not products.
  Loading skeletons / error+retry / empty states retained.
- This is the agreed **reference screen**; the remaining screens get the same 1:1 treatment next.

### Exact-copy rebuild — Landing
- Reworked `landing_screen.dart` into a layout-for-layout port of the storefront `/`: logo header
  bar, the royal-blue (`#005EB8`) hero with "Local store to door" / "From as little as 30 minutes",
  the white postcode search card + red "Search Local Stores" button (→ store selection), and the
  black image collage (produce / delivery-person / dairy circles with accent dots). Added the
  feature trio (Fast Delivery, Support Local, In-Store Prices) and the "Shop Everyday Essentials"
  heading, mirroring the storefront.
- Added a storefront-style bottom nav (Stores · Menu · Orders · Account · Cart, blue active state,
  cart badge). Bundled the storefront hero assets (`produce/dairy/delivery/logo_playful.png`) into
  `mobile/assets/`.

### Fix — back navigation
- `store_selection` no longer **traps** the user: back was hard-disabled (`PopScope(canPop:false)`)
  with no back affordance during first selection, so reaching it from Landing's "Search Local
  Stores"/"Stores" left no way back. Back is now enabled whenever there's a screen to return to, and
  a back chip is shown. Picking a store makes the **shell the navigation root** (clears Landing/
  stores from the stack) so in-app back behaves correctly afterwards.
- `shell` now handles **hardware back**: back on a sub-tab returns to the Home tab; back on Home
  exits the app (instead of doing nothing / dropping to the marketing Landing).

### Fix — splash showed the logo twice, small then large
- The app was rendering **two** splash screens back to back. The native launch screen drew the mark
  at ~150pt (iOS) / the launcher icon (Android 12+ shows it automatically, and `launch_background.xml`
  had no image at all), then `splash_screen.dart` replaced it with a hardcoded `width: 250` logo that
  faded in from opacity 0 and scaled 0.82 → 1.0 with `easeOutBack`. Net effect: small logo, blank
  beat, then a larger logo growing in — read by users as "two different logos".
- Adopted **`flutter_native_splash`** (dev dependency + `flutter_native_splash.yaml`) as the single
  source of truth for the native side, replacing the hand-edited storyboard/`launch_background.xml`.
  It now generates the iOS `LaunchImage`, the pre-12 Android drawables, **and** the previously
  unconfigured Android 12+ `windowSplashScreenAnimatedIcon` / `windowSplashScreenBackground`.
- **Matched the geometry across all four surfaces to 150dp.** The package treats every source image
  as 4x (`image.width * pixelDensity ~/ 4`), and the Android 12 API fixes the icon canvas at 288dp
  while masking one-third of the foreground (artwork must fit a 768px/192dp circle). Generated
  `assets/splash_logo.png` (800px canvas, 600px mark) and `splash/android12_icon.png` (1152px canvas,
  600px mark, 746px diagonal — inside the circle), and re-centred the mark, which was off-centre by
  13px/23px in `logo_playful.png`. `splash_screen.dart` draws the same asset at `width: 200`.
- **Seamless handoff**: removed the entrance fade and scale entirely. The logo is now held still and
  un-composited (no `Transform`, no `ShaderMask`, so no `saveLayer` on the startup frames) for 350ms,
  after which the existing shimmer + breathing pulse start. Also dropped the inert
  `Padding(horizontal: 44)` and the dead `errorBuilder` fallback that used a third size (`width: 140`).
- **Dark mode**: the launch screen no longer flashes black → white. The app is locked to
  `ThemeMode.light`, so the `-night` resource variants are deleted after generation and Android falls
  back to the light ones. Setting `color_dark` alone would not have fixed this — the package always
  writes `values-night/styles.xml` with a `Theme.Black` parent, leaving `NormalTheme` painting a black
  window behind the Flutter UI. This also drops the duplicate `drawable-night-*` splash PNGs.
- `flutter analyze` clean. Regeneration is two steps, documented at the top of `flutter_native_splash.yaml`.

### Splash — animated "Daily Grocer" wordmark
- The logo now **lifts** as a two-tone wordmark rises in beneath it: navy leading word,
  action-red remainder, echoing the logo's own colour split. Name comes from
  `BrandingProvider` (split on the first space; a single-word tenant name stays all navy),
  captured **once** in `initState` — `VersionGate` populates branding from the backend while
  the splash is still up, so watching it would swap the text out mid-animation.
- **The lift is derived, not a magic number.** The wordmark sits in a fixed-height slot, and
  the whole column is translated down by `(gap + slot) / 2` at rest. That offset is exactly
  what puts the *logo alone* at screen centre on frame one — preserving the seamless native
  handoff from the previous change — and animating it to 0 lets the finished logo+wordmark
  pair settle optically centred. Reserving the slot also means the text appearing never
  triggers a relayout.
- Timeline: 0–350ms hold (pixel match for the native splash, no `Transform`/`ShaderMask`),
  then one controller drives lift (0–450ms) and a staggered wordmark fade+rise (100–600ms)
  via `Interval`s. Shimmer and pulse stay on the **logo only** so the wordmark reads crisp.
  `_kMinDisplay` 1700 → 2200ms so the finished mark holds for ~1s.
- **Bundled Hanken Grotesk** (`assets/fonts/`, Bold + ExtraBold only — the two weights
  `AppTypography` actually uses for headings). `google_fonts` resolves bundled assets before
  the network and matches on filename prefix, so `app_typography.dart` is untouched and
  `GoogleFonts.hankenGrotesk()` keeps working. Without this the wordmark rendered in a
  fallback font on a cold first launch and then swapped. Files verified against the sha256 +
  length in the `google_fonts` manifest; +112KB.
- Wordmark style derives from `displayMedium` (already w800) rather than `copyWith`-ing a
  weight onto a lighter style — `GoogleFonts` styles are bound to a variant-specific family,
  so changing `fontWeight` alone would synthesise rather than load ExtraBold.
- `textScaler: TextScaler.noScaling` on the wordmark, since the reserved slot assumes an
  unscaled line box.
- `widget_test.dart` gains `BrandingProvider` (the splash now reads it) and asserts the
  wordmark renders. 17/17 tests pass; `flutter analyze` clean.

