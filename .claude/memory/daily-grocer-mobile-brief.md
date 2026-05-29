# Daily Grocer — Mobile App Upgrade Brief (for Claude Code)

> **How to use this file.** Save it as `mobile/AGENT_BRIEF.md` (or paste it whole into a Claude Code session inside the repo). It defines what to build, **how a real production app behaves**, and how to verify "done." Work the phases in order. **Do not skip Phase 0**, and do not start changing code until the Phase 0 report is approved.

---

## Context (load this first)

You are working in **UK_Grocery / "Daily Grocer"**, a multi-store UK online-grocery monorepo:

- `backend/` — FastAPI + Postgres 15 + Redis + Celery. API under `/api/v1`. Stripe, Google OAuth, dual JWT auth.
- `storefront/` — React 19 customer web app (the reference for flows/content).
- `admin/` — React 18 staff dashboard (not your concern here).
- `mobile/` — **Flutter** app. This is what you're upgrading.

Key facts about `mobile/` from the project docs (treat as *possibly stale* — verify in code):

- **Architecture target:** premium Flutter rebuild of the storefront. Royal-blue (`#1A2F9E`) + rich-red (`#FF1F36`) identity, Plus Jakarta Sans, glass surfaces, layered shadows. Design system lives in `lib/core/theme/` and `lib/widgets/` (primitives: `PremiumButton`, `PremiumTextField`, `GlassCard`, `ProductCard`, `CategoryTile`, `PremiumBottomNav`, `PremiumAppBar`, `Skeleton`, `EmptyState`, `StatusBadge`, `SectionHeader`, `AnimatedPress`, `ProductThumb`).
- **State:** `provider` — `CartProvider`, `AuthProvider`, `StoreProvider`, `ThemeProvider`.
- **Networking:** `dio` via a singleton client in `lib/core/network/api_client.dart`; base-URL resolution in `lib/core/network/api_config.dart`; service classes in `lib/data/api/` that mirror `storefront/src/services/api.ts`.
- **Routing:** named-route table in `lib/core/router/` with custom page transitions.

**⚠️ Two documented contradictions you must resolve in Phase 0:**
1. Some docs say the mobile app is still on **mock data** (`lib/data/mock/mock_data.dart`); another says mock data was **removed** and every screen loads from the API. Determine the actual state.
2. The brief says "match the storefront screens" — this means **the same flows and content**, NOT the storefront's visual design. The storefront look was explicitly rejected as flat. Keep the existing premium design system; do not reintroduce the web UI.

---

## Mission

Bring `mobile/` to **production standard for an App Store / Play Store launch**. Two goals, equal weight:

1. **Parity** — every customer-facing flow that exists in `storefront/` exists in the mobile app, with the same data and content.
2. **Premium + real** — it must *look* like a top-tier product-company app (Stripe / Revolut / Airbnb tier) **and** *behave* like a real app: no blank screens, no infinite spinners, no unhandled errors, no clicky-prototype dead ends.

---

## Ground rules (apply to every change)

- **Investigate before you change.** Read the real code. The docs may be out of date — trust the code.
- **Follow existing patterns.** One Dio client, one state library (`provider`), one design language, one route table. Do **not** add a second HTTP client, a different state-management lib, or off-system Material widgets.
- **Never regress backend wiring.** Customer token key stays `customer_token`. Keep the `onAuthExpired` broadcast and typed `ApiException` flow. Base-URL resolution stays: `--dart-define=API_BASE_URL` wins; Android emulator → `http://10.0.2.2:8000`; else `http://localhost:8000`.
- **Every data-loading screen has three states:** loading (`Skeleton`), loaded, error (`EmptyState` + retry). No exceptions.
- **Currency is GBP (£). Dates are UK format.**
- **Small, single-concern commits.** Run `flutter analyze` clean before each. Keep a running `mobile/CHANGES.md` of what changed and why.
- If a parity fix genuinely needs a new backend endpoint, **stop and flag it separately** — do not silently edit `backend/`.

---

## Phase 0 — Audit (report only; do NOT fix yet)

Produce a written gap report and wait for approval. Cover:

1. **Wiring status.** Is the app on mock data or live API? Which screens still import `mock_data.dart`? Resolve documented contradiction #1.
2. **Screen inventory.** List every folder under `lib/screens/` and map each to a `storefront/src/App.tsx` route. Mark `MATCH` / `MISSING` / `EXTRA`. Use the target table in Phase 1.
3. **Behavior audit (per screen).** Does it have loading/error/empty states? Pull-to-refresh? Pagination? Optimistic updates where relevant? Offline handling? Tick each.
4. **Design audit.** Where are hardcoded colors / paddings / radii instead of theme tokens? Where did default Material widgets leak in instead of design-system primitives? Where are cards flat / motion missing / haptics absent? List specific files.
5. **Wiring/payment audit.** Which API calls are missing? **Is payment integrated at all?** (Backend has Stripe — check if mobile uses it.)
6. **Release/security audit.** Where is the JWT stored (`SharedPreferences` vs secure storage)? Are `android/` & `ios/` committed? Is there a privacy/terms screen? Are there *any* tests?

Output as an approvable checklist. Then continue.

---

## Phase 1 — Screen & flow parity

**Target set** (storefront route → mobile screen). Fill the real gaps the audit found.

| Storefront route | Mobile screen | Notes |
|---|---|---|
| `/browse` (Home) | Home | category grid + banners |
| `/search` | Search | debounced; results + empty state |
| `/aisle/:id` | Aisle | category listing, paginated |
| `/product/:id` | Product details (PDP) | |
| `/cart` | Cart | |
| `/checkout` | Checkout | address, fees, **payment** |
| `/success` | Order success | |
| `/tracking/:id` | Order tracking | live status |
| `/orders`, `/history` | Order history | paginated |
| `/refunds` | Refund status | |
| `/profile` | Profile + addresses | |
| `/offers` | Offers | |
| `/stores` | Store selection | |
| `/login` | Login (email + Google) | |
| — | Register | mobile-native |
| — | Splash / Onboarding | mobile-native |
| — | Notifications | mobile-native; reads notifications API |
| — | Settings | mobile-native |
| `/privacy`, `/terms`, `/cookies` | **Legal pages** | **MISSING — required for store review** |

For each screen you add or complete: design-system widgets only, real API data, all three states, correct entry in the route table with the standard page transition.

---

## Phase 2 — Make it behave like a real app

This is the **"how real applications behave"** core. Implement systematically.

### Data & network
- **Loading:** skeleton placeholders, never a bare spinner, never a blank screen.
- **Error:** typed `ApiException` → human-readable message + **retry** button. Detect offline (e.g. `connectivity_plus`) and show a banner; auto-retry when connectivity returns.
- **Empty:** `EmptyState` with an icon + message + CTA, never a raw "no results".
- **Caching / stale-while-revalidate:** cache catalog, category, and store responses; show cached data instantly on revisit, then refresh in the background. Don't refetch everything on every navigation.
- **Pagination / infinite scroll** for product lists and order history (`ListView.builder` + fetch next page near the end). Never load an entire collection at once.
- **Pull-to-refresh** on every list (`RefreshIndicator`).
- **Search:** debounce ~300ms; cancel the in-flight request when a new keystroke arrives.
- **Resilience:** request timeouts; retry transient failures with backoff; idempotency on writes.

### Cart & checkout (the money path — must be bulletproof)
- **Optimistic** add/remove/quantity (instant UI, reconcile with server; roll back on failure).
- **Persistence:** cart + selected store survive a cold start (mirror storefront's `dg_cart` / `dg_store`; make sure the providers rehydrate on launch).
- **Edge cases:** out-of-stock item, price changed since added, switching store (validate/clear cart), minimum order value, delivery-fee calculation, coupon apply + validation errors.
- Wire real payment in Phase 4.

### Auth
- **Session persistence:** auto-login on launch when the token is valid.
- **Token refresh:** use the backend `refresh_tokens` flow; on refresh failure → `onAuthExpired` → route to login while **preserving the intended destination** (resume after sign-in).
- **Google sign-in** at parity with storefront.
- **Forms:** inline, real-time validation (email format, password rules); disable submit while pending; surface server-side errors clearly.

### Navigation & lifecycle
- Correct back stack; **Android hardware-back** handled on every screen.
- Modal vs push used appropriately; **confirm-on-exit** for checkout/forms with unsaved input.
- Restore state after backgrounding; on resume, refresh time-sensitive screens (order tracking).
- **Deep links:** open product / order / tracking from a URL or a notification tap.

### Notifications
- **Push** (FCM / APNs) for order-status changes; tapping opens the tracking screen via deep link.
- In-app **Notifications** screen reads the notifications API, supports mark-as-read, shows an **unread badge** on the bottom nav.

### Media
- **Cached network images** with placeholder → fade-in (e.g. `cached_network_image`); no layout shift.
- Prefer the backend's WebP assets; lazy-load below the fold; precache hero/PDP images.

### Feel / performance
- **Haptics** on add-to-cart, checkout success, and errors (wire real `HapticFeedback` into `AnimatedPress`).
- **60fps:** `const` constructors, list builders, `RepaintBoundary` on heavy widgets, avoid rebuilding whole trees on small state changes.
- Respect **safe areas / notches / gesture insets**; support **text scaling** and large fonts without overflow.
- **Light + dark mode** verified on every screen.

### Accessibility
- `Semantics` labels on interactive widgets and meaningful images; min **48dp** tap targets; sufficient contrast; a screen-reader pass on the core funnel.

---

## Phase 3 — De-flatten the design

If the app currently reads as flat, fix it *systematically*, not screen-by-screen ad hoc:

- **Enforce tokens:** no hardcoded colors, radii, or spacing — everything from the theme.
- **Apply depth** as the design language intends: layered soft shadows on cards, selective blue/red glow on primary CTAs.
- **Consistent type scale** (Plus Jakarta Sans), consistent spacing rhythm, pill buttons + bottom nav.
- **Purposeful motion:** 220–380ms cubic curves on transitions and list-item entrance; press feedback everywhere — not gratuitous animation.
- **Replace leaked default Material components** with the design-system primitives (`PremiumButton`, `GlassCard`, etc.).
- The **loading / error / empty states must also be designed**, not bare.

---

## Phase 4 — Payments

- Integrate **Stripe** (`flutter_stripe`) against the backend's existing Stripe endpoints. Support **card + Apple Pay + Google Pay** via Stripe's `PaymentSheet`.
- Handle **3DS / SCA** (UK/PSD2 requires it), payment errors, retry, and idempotency.
- **PCI-safe:** never handle raw card numbers yourself, never log card data — let the Stripe SDK collect it.

---

## Phase 5 — Hardening & release readiness

- **Secure storage:** move the JWT from `SharedPreferences` to `flutter_secure_storage` (Keychain / Keystore). Migrate any existing token on upgrade.
- **Crash + error reporting** (Sentry or Firebase Crashlytics).
- **Analytics** on the funnel: browse → product → add-to-cart → checkout → success.
- **Reproducible build:** commit `android/` & `ios/`, or document a reliable `flutter create .` + config step so a clean checkout builds in CI.
- **Tests:** widget tests for core screens, unit tests for providers/services, one integration test for the checkout happy path. Wire into CI.
- **Store assets:** app icon, splash, versioning, store metadata, and a **linked privacy policy** (required by both stores).

---

## Definition of done (per screen)

A screen is done when it: uses design-system widgets + theme tokens (no hardcoded styles); loads real API data; has loading / error / empty states with retry; handles offline; supports pull-to-refresh + pagination where it's a list; works in light **and** dark; respects safe areas + text scaling; has `Semantics` for a11y; animates in/out per the motion spec; and has at least one widget test.

---

## Constraints & gotchas (from the codebase)

- **Token key:** customer = `customer_token`. Never reuse the admin `pos_token`.
- **Base URL:** `--dart-define=API_BASE_URL` wins; Android emulator → `10.0.2.2:8000`; else `localhost:8000`.
- **HTTP:** one Dio singleton; call through `_client.request<T>(...)` for typed `ApiException`s — don't bypass it.
- **New endpoint** → add a method to the matching service in `lib/data/api/` (or a new service registered in `api_registry.dart`).
- **API shapes:** backend `/docs` & `/openapi.json` are only served when `DEBUG=true` — run the backend and confirm payloads there before guessing.
- **Don't touch** `backend/`, `admin/`, or `storefront/` unless a parity fix truly needs a backend endpoint — and if so, flag it.

---

## Working order

1. Run **Phase 0**, output the gap report, **wait for go-ahead**.
2. Then take phases in order; within a phase, one screen/concern per commit.
3. After each screen: `flutter analyze` clean → run it → verify the definition-of-done checklist → show before/after.
4. Keep `mobile/CHANGES.md` current.
