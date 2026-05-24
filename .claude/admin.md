# Admin Dashboard

Location: [admin/](../admin/)
Production URL: `admin.dailygrocer.co.uk`

## Stack

- **React** 18.3.1 + **TypeScript** 5.7.2
- **Vite** 6.0.5 build/dev server
- **React Router** 7.1.1
- **TanStack Query (React Query)** 5.62 — server state
- **Axios** 1.7.9 — HTTP client
- **Tailwind CSS** — styling
- **Lucide React** — icons
- **Recharts** 2.15 — analytics charts
- **React Hot Toast** 2.4 — notifications
- **Dexie** 4.0 — IndexedDB (offline cache)

## Directory Layout

```
admin/
├── src/
│   ├── App.tsx                Root router + providers
│   ├── main.tsx               Entry / mount
│   ├── index.css              Tailwind base
│   ├── services/
│   │   └── api.ts             Axios instance + endpoint groups
│   ├── features/              Feature-sliced modules (see below)
│   ├── components/            Generic UI (Layout, modals, tables)
│   └── types.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── Dockerfile
└── nginx.conf                 Container-internal nginx for static serve
```

## Feature Slices

Each feature folder owns its own pages, components, hooks, and types:

```
features/
├── auth/          AuthContext, AdminStoreContext, Login
├── dashboard/     KPI tiles, delivery-boy dashboard
├── products/      Product list/edit/create, low-stock, image upload
├── categories/    Category tree management
├── inventory/     Per-store stock levels, adjustments
├── orders/        Order list, detail, status transitions, assignment
├── customers/     Customer directory, profile, addresses
├── delivery/      Delivery zones, postcode mapping
├── refunds/       Refund request queue, per-item approval
├── sales/         Sales dashboard
├── coupons/       Coupon CRUD, redemption history
├── reports/       Report generator + downloads
├── reviews/       Review moderation
├── rewards/       Loyalty tiers, monthly resets
├── audit/         Audit log viewer with filters
├── settings/      Platform config, feature flags
├── stores/        Store CRUD, opening hours
├── users/         Staff user CRUD, roles
├── banners/       CMS promotional banners
├── webhooks/      Webhook endpoints + delivery log
└── system/        Health monitoring
```

## Routing

Defined in [admin/src/App.tsx](../admin/src/App.tsx). Patterns:

- All routes are wrapped in `<AuthProvider>` and `<AdminStoreProvider>`.
- Protected routes redirect to `/login` if no token.
- `/login` is the only public route.
- A `Layout` wrapper provides sidebar + header for authenticated pages.
- The `delivery_boy` role lands on a dedicated dashboard, not the full admin.

## State Management

| Concern | Tool |
|---|---|
| Server data (queries, mutations, cache) | **React Query** |
| Auth (token, current user) | **React Context** (`AuthContext`) |
| Active store selection (multi-store admin) | **React Context** (`AdminStoreContext`) |
| Form state | Local `useState` / lifted props (no form library yet) |
| Notifications | `react-hot-toast` |
| Local persistence | `localStorage` for token; `Dexie` if offline caching needed |

**Rule**: Don't fetch with raw `useEffect + axios` — use `useQuery` / `useMutation` so cache, retries, and invalidation are consistent.

## API Client

Single source: [admin/src/services/api.ts](../admin/src/services/api.ts)

Patterns:
- One configured Axios instance with `baseURL` from `VITE_API_BASE_URL`.
- Request interceptor attaches `Authorization: Bearer <token>`.
- Response interceptor: on `401`, clears token and redirects to `/login`.
- Request interceptor strips `null` / `""` / `undefined` params to avoid backend filter noise.
- Endpoints grouped as named objects (`authApi`, `productApi`, `orderApi`, ...).

**Rule**: All HTTP must go through this file. Don't import `axios` directly in feature code.

## Auth Flow

1. User submits credentials on `/login`.
2. `authApi.login(email, password)` posts to `/api/v1/auth/login`.
3. Response: `{ access_token, refresh_token, user }`.
4. `AuthContext` stores token in `localStorage` + state; `user` in context.
5. Axios interceptor attaches token to every subsequent request.
6. On `401`, interceptor clears token and redirects.
7. Refresh-token flow is available but optional — re-login on expiry is acceptable.

## Common Pitfalls

- The admin and storefront share an axios pattern but **NOT** the same token store. Don't copy code between them blindly.
- Many product/order fields are nullable; always guard with `?.` and provide UI fallbacks.
- The same `Product` schema feeds both admin (full edit) and storefront (public view) — don't leak admin-only fields when copying to storefront types.
- For mutations, invalidate the relevant React Query keys (e.g., after `orderApi.updateStatus`, invalidate `["orders"]` and `["order", id]`).

## Build & Dev

```bash
cd admin
npm install
npm run dev      # http://localhost:5173 (vite)
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

Container: `Dockerfile` builds and serves `dist/` via nginx (see [admin/nginx.conf](../admin/nginx.conf)).
