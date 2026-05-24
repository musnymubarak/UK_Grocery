# Storefront — Customer SPA

Location: [storefront/](../storefront/)
Production URL: `dailygrocer.co.uk`

## Stack

- **React** 19.0.0 + **TypeScript** 5.8.2
- **Vite** 6.2.0
- **React Router** 7.14
- **Axios** 1.15
- **Tailwind CSS** 4.1.14
- **Motion** 12.23 (Framer Motion successor) — page transitions
- **@react-oauth/google** 0.13.5 — Google OAuth login
- **@google/generative-ai** 1.29 — Gemini SDK (used for product Q&A / search assist)
- **Lucide React** — icons
- **React Hot Toast** 2.6

## Directory Layout

```
storefront/
├── src/
│   ├── App.tsx                Router + AnimatePresence + providers
│   ├── main.tsx
│   ├── index.css              Tailwind v4
│   ├── CartContext.tsx        Cart state (items, totals)
│   ├── context/
│   │   └── AuthContext.tsx    Customer auth (token, profile)
│   ├── services/
│   │   └── api.ts             Axios instance + endpoint groups
│   ├── screens/               One folder per page (see below)
│   ├── components/            Shared UI (nav, cards, etc.)
│   └── types.ts               Customer/Order/Product/CartItem types
├── images/                    Marketing assets
├── public/                    Static, served at /
├── package.json
├── vite.config.ts
├── Dockerfile
└── nginx.conf
```

## Screens

```
screens/
├── Landing            Marketing homepage
├── Home               Browse w/ category tiles & banners
├── Aisle              Single-category product list
├── Search             Text search results
├── ProductDetails     Image gallery, nutrition, reviews, add-to-cart
├── StoreSelection     Pick store / enter postcode for fee calc
├── Cart               Edit quantities, see totals
├── Checkout           Address, delivery slot, payment method
├── OrderSuccess       Confirmation
├── OrderTracking      Live status + driver location (if assigned)
├── OrderHistory       Past orders list
├── RefundStatus       Refund request status
├── Profile            Customer profile, addresses, preferences
├── Offers             Coupons, promotions, rewards
├── Login              Email/password + Google OAuth
├── PrivacyPolicy
├── TermsOfService
└── CookiePolicy
```

## Routing

[storefront/src/App.tsx](../storefront/src/App.tsx) uses `AnimatePresence` from Motion to animate page exits/entries. `ScrollToTop` resets scroll on every route change. A persistent `CookieBanner` enforces consent before non-essential storage.

Protected routes (orders, profile, checkout) require an active customer token; otherwise they redirect to `/login`.

## State Management

| Concern | Tool |
|---|---|
| Cart | **CartContext** — items, qty, price totals; persisted to `localStorage` |
| Auth | **AuthContext** — JWT, customer profile, login/logout |
| Server data | Axios calls — no React Query in storefront; rely on context + local state |
| Cookie consent | dedicated `CookieBanner` reading from `localStorage` |
| Toasts | `react-hot-toast` |

**Difference from admin**: the storefront does NOT use React Query. Each screen fetches via `useEffect` + axios and manages its own loading/error state. Be consistent with this style when editing — do not introduce React Query here unless explicitly directed.

## API Client

[storefront/src/services/api.ts](../storefront/src/services/api.ts) — single axios instance with:
- Request interceptor adding customer JWT.
- Response interceptor — on `401` dispatches a window event `auth_expired` so the AuthContext can log out and redirect to `/login`.

Endpoint groups:
- **catalogApi** — `/storefront/*` (public, no auth) — products, categories, stores, banners, offers
- **customerAuthApi** — register, login, Google login
- **orderApi** — create, history, tracking
- **refundApi** — request, list, detail
- **profileApi** — profile, addresses, preferences
- **rewardsApi** — points balance, redemption

## Cart Behaviour

`CartContext` exposes:
- `items: CartItem[]` — `{ product, quantity }`
- `addItem(product, qty)` / `updateQty(productId, qty)` / `removeItem(productId)` / `clear()`
- `subtotal`, `total`, `count` — derived
- Persisted to `localStorage` so refreshing doesn't clear the cart.

On checkout, the cart is converted to backend `OrderCreate` shape and posted; on success, cart is cleared.

## Auth Flow

1. Customer registers or logs in (email/password or Google OAuth).
2. Token returned, stored in `localStorage`, set in `AuthContext`.
3. Axios attaches token to every customer API call.
4. On `401`, the `auth_expired` event tells `AuthContext` to clear state and redirect.

Customer tokens are NOT the same as staff tokens — see [backend.md](backend.md).

## Responsive Layout

Started mobile-first; commit `f279407` modernised it to be responsive at every breakpoint:

- **Mobile** — design the screen for ~390 px (iPhone) width first
- **Desktop** — chrome (header/footer) caps at `max-w-[90rem]` (1440 px) via [Layout.tsx](../storefront/src/components/Layout.tsx)
- **Full-width pages** (Landing, Login split layout) pass `<Layout fullWidth>` and may extend edge-to-edge; cap their content blocks at `max-w-[90rem] mx-auto` so they align with the header

**Test every screen at both** ~390 px and ≥1024 px. The earlier `max-w-[430px]` global cap is gone — don't reintroduce it.

## Design Tokens

All colors and fonts come from the `@theme` block in [storefront/src/index.css](../storefront/src/index.css). Use semantic class tokens, **not** hex literals:

| Need | Use | Don't |
|---|---|---|
| Page background | `bg-background` | `bg-[#F1F5F9]` |
| Card background | `bg-surface-container-lowest` | `bg-white` |
| Body text | `text-on-surface` | `text-[#1E293B]` |
| Muted text | `text-on-surface-variant` | `text-gray-500` |
| Primary CTA | `bg-primary text-on-primary` | `bg-blue-600` |
| Heading font | `font-headline` (Hanken Grotesk) | (default Inter) |
| Body font | `font-body` (Inter — already default) | — |

Brand-locked colors (e.g. Facebook `#1877F2`, Google's button) are the only acceptable hex literals.

## Build & Dev

```bash
cd storefront
npm install
npm run dev      # http://localhost:5173
npm run build    # static dist/
npm run preview
```

Container: `Dockerfile` builds and serves `dist/` via nginx ([storefront/nginx.conf](../storefront/nginx.conf)).

## Notable Recent Work (from git log)

- `512bfc2` — implemented storefront navigation, cart context, core screens
- `0eb3798` — core storefront UI, dynamic banner carousel, category layout
- `f279407` — premium-branding modernisation of Layout/Landing
- `b0e6366` — rewards banner text fix (introduced the now-removed mobile-only 430px cap)
- `c2098c2` — removed canvas CORS dependency from image component
