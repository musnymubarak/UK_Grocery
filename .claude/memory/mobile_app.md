---
name: Mobile app in monorepo
description: UK_Grocery now contains a Flutter mobile app in mobile/ alongside backend/storefront/admin
type: project
---

A Flutter mobile app was added to the monorepo at [mobile/](../../mobile/) as a premium UI rebuild of the React storefront. It mirrors storefront flows (browse → cart → checkout → tracking) but uses a redesigned design system with deep royal blue + rich red identity, Plus Jakarta Sans, glass surfaces, and layered shadows.

**Why:** Client wanted a high-end premium mobile experience for App Store / Play Store launch, comparable to apps from elite product companies (Stripe / Airbnb / Revolut tier). Storefront UI was judged "flat and below modern standards."

**How to apply:** When the user asks about mobile, default to the Flutter codebase at `mobile/lib/` — not React Native or a webview wrapper. The app runs on the **live API** (mock data was removed; there is no `lib/data/mock/`). The whole `mobile/` tree is now tracked in the monorepo (root `.gitignore` no longer ignores it) and `android/`/`ios/` are committed, so a clean checkout builds.

A phased production-readiness upgrade is underway — see [daily-grocer-mobile-brief.md](daily-grocer-mobile-brief.md) and `mobile/CHANGES.md`. Phase 0 audit + Phase 1 (flow parity) are done. Still **flagged / not done**: orders & refunds pagination needs a backend `skip`/`limit` change (`/orders/me`, `/refunds/me` return full lists); Google/Apple sign-in need the project owner's OAuth config; real Stripe payment is Phase 4 greenfield (the storefront's card form + tip are also cosmetic — neither app charges yet); JWT is still in `SharedPreferences` (secure storage is Phase 5). Toolchain: Flutter 3.41 / Dart 3.11; no emulator in the dev env, so changes are gated on `flutter analyze` + `flutter test`, not runtime.
