# Mobile (Flutter)

Located in [mobile/](../mobile/). A premium Flutter rebuild of the [storefront/](../storefront/) web app — same flow and content structure, but a completely new design system, not a port of the existing UI.

## What's there

- 17 screens covering the full customer journey: splash → onboarding → login/register → home → search → aisle → product → cart → checkout → order success → order tracking → order history → offers → store selection → profile → notifications → refunds → settings.
- A design-system layer (`lib/widgets/`) with reusable primitives: `PremiumButton`, `PremiumTextField`, `GlassCard`, `ProductCard`, `CategoryTile`, `PremiumBottomNav`, `PremiumAppBar`, `Skeleton`, `EmptyState`, `StatusBadge`, `SectionHeader`, `AnimatedPress`, `ProductThumb`.
- Theme system (`lib/core/theme/`): royal-blue/red palette, Plus Jakarta Sans typography, soft layered shadows, light + dark modes.
- Mock data (`lib/data/mock/mock_data.dart`) seeded with realistic UK-grocery content. No backend wiring yet.
- State via `provider`: `CartProvider`, `AuthProvider`, `StoreProvider`, `ThemeProvider`.

## Folder layout

```
mobile/lib/
├── main.dart, app.dart
├── core/
│   ├── theme/      (colors, typography, spacing, shadows, theme)
│   ├── router/     (named-route table + premium page transitions)
│   └── utils/      (page_transitions, formatters)
├── data/
│   ├── models/     (Product, Category, Store, Order, Address, NotificationItem)
│   └── mock/       (mock_data.dart)
├── state/          (provider-based)
├── widgets/        (design-system primitives)
└── screens/        (one folder per top-level flow)
```

## Design language

- Primary: deep royal blue (`#1A2F9E`). Accent: rich red (`#FF1F36`).
- Type: Plus Jakarta Sans (via `google_fonts`). Display 28–48pt, body 14–16pt.
- Shapes: 12/16/20/28/36 px radii. Pill buttons & bottom nav.
- Depth: layered soft shadows + selective blue/red glows on primary CTAs.
- Motion: 220–380ms cubic curves; `AnimatedPress` for tactile press feedback throughout.

## Running

Platform folders (`android/`, `ios/`) are not committed — run `flutter create .` inside `mobile/` once to scaffold them, then `flutter pub get && flutter run`. See [mobile/README.md](../mobile/README.md).

## Mapping to storefront routes

The mobile route table mirrors the storefront's `App.tsx` 1:1 plus a few mobile-native additions (onboarding, notifications, settings). See the table in [mobile/README.md](../mobile/README.md#screen-map--storefront-routes).
