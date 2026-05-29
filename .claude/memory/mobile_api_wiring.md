---
name: Mobile API wiring
description: How the Flutter mobile app talks to the FastAPI backend (dio client, env-aware base URL, JWT in SharedPreferences)
type: project
---

The mobile app is wired to the backend via `mobile/lib/data/api/` services that mirror `storefront/src/services/api.ts` 1:1.

**Stack**: `dio` for HTTP, `shared_preferences` for JWT persistence (key `customer_token`, matching storefront's localStorage key).

**Base URL resolution** in [mobile/lib/core/network/api_config.dart](../../mobile/lib/core/network/api_config.dart):
1. `--dart-define=API_BASE_URL=...` wins everywhere.
2. Android emulator → `http://10.0.2.2:8000` (host loopback).
3. Otherwise → `http://localhost:8000`.

**Auth/401 flow**: [mobile/lib/core/network/api_client.dart](../../mobile/lib/core/network/api_client.dart) is a singleton wrapping Dio. Its request interceptor attaches the `Bearer` token, the response interceptor converts 4xx into typed `ApiException`. On 401 it now **transparently refreshes**: a single-flight call to `/customers/refresh` via an interceptor-free Dio (loop-guarded by a `__retried` flag), then retries the original request once; only if refresh fails does it `tokens.clear()` + broadcast `onAuthExpired` (which `AuthProvider` listens to). The refresh token is persisted alongside the access token (`customer_refresh_token`). The customer `Token` response carries **no profile**, so `login`/`register`/`googleLogin` persist tokens and `AuthProvider` then loads the customer via `auth.me()`.

**Why**: The user explicitly asked for backend wiring after the mobile UI was complete. Mock data was removed; every screen now loads from the API with skeleton-loading + error-with-retry states. Stores load via `StoreProvider.refresh()` on construction.

**How to apply**: When adding a new API endpoint, create a method on the matching service in `mobile/lib/data/api/` (or a new service registered in `api_registry.dart`). Use `_client.request<T>(() => _client.raw.get(...))` to get typed `ApiException`s. For new screens fetching data: stateful widget, fetch in `didChangeDependencies` or a post-frame callback in `initState`, render `Skeleton` while loading, `EmptyState` + retry button on error.
