---
name: Mobile app in monorepo
description: UK_Grocery now contains a Flutter mobile app in mobile/ alongside backend/storefront/admin
type: project
---

A Flutter mobile app was added to the monorepo at [mobile/](../../mobile/) as a premium UI rebuild of the React storefront. It mirrors storefront flows (browse → cart → checkout → tracking) but uses a redesigned design system with deep royal blue + rich red identity, Plus Jakarta Sans, glass surfaces, and layered shadows.

**Why:** Client wanted a high-end premium mobile experience for App Store / Play Store launch, comparable to apps from elite product companies (Stripe / Airbnb / Revolut tier). Storefront UI was judged "flat and below modern standards."

**How to apply:** When the user asks about mobile, default to the Flutter codebase at `mobile/lib/` — not React Native or a webview wrapper. Backend wiring is not yet done (everything is mock data in `lib/data/mock/mock_data.dart`). Platform folders (`android/`, `ios/`) are intentionally not committed — must run `flutter create .` once before `flutter run`.
