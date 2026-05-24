# UK Grocery — Project Context for Claude

This file is the entry-point context document for the UK Grocery (DailyGrocer) multi-tier e-commerce platform. Always read the linked module docs in this folder when working on a specific area.

## What This Project Is

**DailyGrocer** is a multi-tenant UK grocery e-commerce platform with three deployable apps and a shared FastAPI backend:

| App | URL (prod) | Purpose |
|---|---|---|
| **Storefront** | `dailygrocer.co.uk` | Customer-facing shopping app (React 19) |
| **Admin** | `admin.dailygrocer.co.uk` | Staff/manager dashboard (React 18) |
| **Backend** | `/api/v1/*` behind nginx | FastAPI 0.115 + PostgreSQL 15 + Redis + Celery |

Multi-store, multi-tenant via the `Organization` entity. Built features: catalogue, cart, checkout, COD/Stripe/wallet payments, delivery-zone fee calculation, granular item-level refunds, loyalty/rewards, coupons, promotions, audit log, GDPR export/delete, webhooks.

## Repository Layout

```
/var/www/UK_Grocery/
├── backend/         FastAPI app, Alembic migrations, Celery tasks → see backend.md
├── admin/           React 18 + Vite admin dashboard → see admin.md
├── storefront/      React 19 + Vite customer SPA → see storefront.md
├── nginx/           Reverse proxy configs (dev + prod)
├── docker-compose.yml, docker-compose.prod.yml
├── Jenkinsfile      CI/CD on main push
└── .claude/         You are here — project documentation
```

## Documentation Index

Read the file relevant to your task before touching code:

- [architecture.md](architecture.md) — System overview, request flow, multi-tenancy model
- [backend.md](backend.md) — FastAPI structure, services, tasks, auth, migrations
- [admin.md](admin.md) — Admin dashboard features, routing, state, API client
- [storefront.md](storefront.md) — Customer app screens, cart/auth contexts
- [database.md](database.md) — All 30+ entities, relationships, key fields
- [api-reference.md](api-reference.md) — Endpoint catalogue by router
- [infrastructure.md](infrastructure.md) — Docker, nginx, env vars, CI/CD
- [development.md](development.md) — How to run, build, migrate, test locally
- [conventions.md](conventions.md) — Code patterns and team conventions

## High-Signal Facts

- **Async everywhere**: SQLAlchemy 2.0 async with `asyncpg`; never use sync session in request paths.
- **UUIDs everywhere**: All primary keys are `gen_random_uuid()` UUIDs.
- **Soft deletes**: `is_deleted` flag — filter at query layer, do not hard-delete.
- **Order lifecycle is a state machine**: 11 transitions enforced server-side ([backend/app/services/order.py](../backend/app/services/order.py)). Never mutate `Order.status` directly.
- **Multi-tenancy**: Every business entity carries `organization_id`. Always filter by it from dependency-injected org context.
- **Refunds are granular**: Per-`OrderItem`, with evidence uploads. Driven by `effective_unit_price`.
- **Background work runs in Celery**: Order timeouts, search reindex, auto-assignment, monthly rewards reset, coupon expiry.
- **Two JWT audiences**: Staff tokens (`/api/v1/auth/*`) and Customer tokens (`/api/v1/customers/*`) — separate flows, do not mix.

## When Modifying...

| Area | First read | Don't forget |
|---|---|---|
| A backend model | [database.md](database.md) + [backend.md](backend.md) | Create Alembic migration; update schemas; check indexes |
| An API endpoint | [api-reference.md](api-reference.md) | Update both admin and storefront API clients if shape changes |
| Order status flow | [backend.md](backend.md) → "Order State Machine" | Add `OrderStatusHistory` entry; emit audit log |
| Auth/permissions | [backend.md](backend.md) → "Auth" | Verify the right dependency (`get_current_user` vs `get_current_customer`) |
| Storefront UI | [storefront.md](storefront.md) | Test mobile (~390px) AND desktop (≥1024px); use theme tokens (`bg-primary`, `text-on-surface`, etc.) — no hex literals |
| Admin UI | [admin.md](admin.md) | Use React Query; don't bypass `api.ts` axios instance |
| Docker/nginx | [infrastructure.md](infrastructure.md) | Update both `docker-compose.yml` and `.prod.yml` if needed |

## Build & Run Quick Reference

See [development.md](development.md) for full details.

```bash
# Full stack (dev)
docker compose up -d

# Backend only (host)
cd backend && uvicorn app.main:app --reload

# Migrations
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "describe change"

# Frontends
cd admin && npm run dev          # http://localhost:5173
cd storefront && npm run dev     # http://localhost:5173
```
