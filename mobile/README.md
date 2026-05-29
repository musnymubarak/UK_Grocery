# Daily Grocer — Mobile

A premium Flutter rebuild of the [storefront/](../storefront/) web app. Same flow and content structure; redesigned end-to-end with a modern mobile-first design system.

## Running

First-time setup needs to generate native platform folders (we ship only `lib/` + `pubspec.yaml`):

```bash
cd mobile
flutter create .            # generates android/ ios/ web/ etc. — keeps lib/ intact
flutter pub get
flutter run
```

Subsequent runs only need `flutter pub get` + `flutter run`.

Target: Flutter 3.27+ (uses `Color.withValues` and Material 3 expressive surface tokens). Pure mock data — no backend wiring yet (see `lib/data/mock/`).

## Architecture

```
lib/
├── main.dart                 ← bootstrap (providers + theme)
├── app.dart                  ← MaterialApp + router
├── core/
│   ├── theme/                ← colors, typography, spacing, shadows, theme
│   ├── router/               ← named-route table
│   └── utils/                ← formatters, page transitions
├── data/
│   ├── models/               ← Product, Category, Order, Address, ...
│   └── mock/                 ← seeded sample data mirroring the web app
├── state/                    ← Provider-based: Cart, Auth, Store
├── widgets/                  ← design-system primitives
└── screens/                  ← one folder per top-level flow
```

## Design language

- Deep royal blue (#1A2F9E) primary; rich vibrant red (#FF1F36) accent.
- Plus Jakarta Sans typography (Google Fonts).
- Glass surfaces, soft layered shadows, 16–24 px corner radius, generous spacing.
- Light + dark themes with a single source of truth in `core/theme/`.

## Screen map → storefront routes

| Mobile route | Storefront equivalent |
|---|---|
| `/splash` → `/onboarding` → `/login` | `/login` |
| `/shell` (bottom nav host) | `/browse` |
| `/aisle/:id` | `/aisle/:id` |
| `/product/:id` | `/product/:id` |
| `/search` | `/search` |
| `/cart` | `/cart` |
| `/checkout` | `/checkout` |
| `/order/success` | `/success` |
| `/order/tracking/:id` | `/tracking/:id` |
| `/orders` | `/history` |
| `/offers` | `/offers` |
| `/stores` | `/stores` |
| `/profile` | `/profile` |
| `/refunds` | `/refunds` |
| `/notifications` | (new) |
| `/settings` | (new) |
