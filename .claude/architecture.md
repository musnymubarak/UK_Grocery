# Architecture

## High-Level Diagram

```
                ┌─────────────────────────────────────────┐
                │           Internet / Users              │
                └──────────────┬──────────────────────────┘
                               │
                       ┌───────▼────────┐
                       │  nginx (proxy) │  TLS, rate-limit, gzip
                       └───┬────────┬───┘
              dailygrocer  │        │  admin.dailygrocer
                           │        │
                ┌──────────▼──┐   ┌─▼────────────┐
                │ storefront  │   │    admin     │   React SPAs
                │ (React 19)  │   │  (React 18)  │   built static
                └──────┬──────┘   └─────┬────────┘
                       │ /api/v1/*      │ /api/v1/*
                       └────────┬───────┘
                                │
                       ┌────────▼────────┐
                       │    backend      │   FastAPI 0.115 (async)
                       │   (uvicorn)     │
                       └─┬──────┬─────┬──┘
                         │      │     │
                ┌────────▼─┐ ┌──▼──┐ ┌▼─────────┐
                │PostgreSQL│ │Redis│ │  Celery  │
                │   15     │ │  7  │ │worker+beat│
                └──────────┘ └─────┘ └──────────┘
```

## Request Lifecycle

1. **Browser** hits `dailygrocer.co.uk` or `admin.dailygrocer.co.uk`.
2. **nginx** terminates TLS, applies rate limits (20 req/s general, 5 req/min auth), serves SPA static files for `/`, proxies `/api/` to `backend:8000` and `/uploads/` to disk.
3. **FastAPI** middleware stack:
   - `TrustedHostMiddleware` — whitelist check
   - `CORSMiddleware` — origin check
   - `GZipMiddleware` (≥500 bytes)
   - `RequestTracingMiddleware` — structlog request ID injection
   - `SlowAPI` rate limiter
   - Security headers middleware (HSTS, X-Frame-Options, CSP, etc.)
4. **Router** dispatches to `app/api/v1/*` endpoint functions.
5. **Dependencies** resolve DB session, auth token, organization context.
6. **Service layer** executes business logic against async SQLAlchemy session.
7. **Response** serialized via Pydantic schema, gzipped, returned.

## Multi-Tenancy Model

`Organization` is the tenant root. Every business entity carries `organization_id`:

```
Organization
 ├── Stores            (physical branches)
 ├── Users (staff)     (admin / manager / delivery_boy)
 ├── Customers         (B2C shoppers)
 ├── Products
 ├── Categories
 ├── Orders
 ├── Coupons / Promotions / Banners
 ├── DeliveryZones
 └── AuditLog
```

**Rule**: Every query for a business entity MUST filter by `organization_id` derived from the auth context. The dependency `get_current_organization` provides this. Cross-tenant data leakage is the #1 risk.

## Two JWT Audiences

| Audience | Login route | Token claim | Dependency |
|---|---|---|---|
| **Staff** | `POST /api/v1/auth/login` | `user_id` | `get_current_user` |
| **Customer** | `POST /api/v1/customers/login` | `customer_id` | `get_current_customer` |

Do not share tokens or dependencies between the two. Storefront sends customer tokens; admin sends staff tokens.

## Async Background Architecture

Celery is wired into Redis. Tasks live in `backend/app/tasks/`:

| Schedule | Task | Purpose |
|---|---|---|
| Every 60s | `auto_assign_orders` | Match `ready_for_collection` orders to available drivers |
| Every 2min | `order_timeout_check` | Cancel stale unconfirmed orders |
| Daily 01:00 | `expire_stale_coupons` | Mark expired coupons inactive |
| Daily 03:00 | `rebuild_search_index` | Refresh PostgreSQL tsvector |
| Daily 04:30 | `cleanup_expired_tokens` | Purge old refresh tokens |
| Day 28, 23:50 | `run_monthly_rewards_reset` | Reset rewards tier eligibility |
| On-demand | webhook dispatch with retry | External integrations |

In dev, `celery-worker` and `celery-beat` are optional; in prod (`docker-compose.prod.yml`) they're required containers.

## Data Storage Decisions

- **PostgreSQL 15** — relational with JSONB columns for flexible attributes (`applied_promotions`, `nutritional_info`, `alcohol_data`).
- **UUID PKs** — `gen_random_uuid()` from `pgcrypto`; distributed-system friendly.
- **Soft delete** — `is_deleted: bool` filter at service layer.
- **Audit timestamps** — `created_at`, `updated_at` via `TimestampMixin` on every table.
- **Full-text search** — PostgreSQL `tsvector` on products, rebuilt nightly.
- **Redis** — Celery broker, rate-limit token bucket, optional cache.

## Security Boundaries

- **CORS** — explicit origin list per env (`CORS_ORIGINS`).
- **Trusted hosts** — `ALLOWED_HOSTS` whitelist enforced at middleware.
- **JWT** — HS256, 8-hour access token, 30-day refresh token stored in `RefreshToken` table.
- **Passwords** — bcrypt via passlib.
- **Rate limits** — auth 5/min, general API 20/sec.
- **Security headers** — HSTS, X-Frame, X-Content-Type, XSS, CSP.
- **Uploads** — 50 MB max body, served from `/uploads/` with 30-day cache.

## Deployment Topology

**Dev** (`docker-compose.yml`): db, redis, backend, storefront (vite dev), admin (vite dev), nginx.

**Prod** (`docker-compose.prod.yml`): adds `migrations` (one-shot alembic upgrade), `celery-worker`, `celery-beat`, `certbot`. Storefront and admin are built static, served by their own nginx containers.

Jenkins picks up pushes to `main`, pulls `.env` from `/etc/pos/.env`, then `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
