# Backend — FastAPI

Location: [backend/](../backend/)

## Stack

- **FastAPI** 0.115.6, **Uvicorn** 0.34.0
- **SQLAlchemy** 2.0.36 async + **asyncpg**
- **Pydantic** 2.10.4
- **Alembic** 1.14.1 for migrations
- **Celery** 5.4.0 + **Redis** 7 broker
- **passlib[bcrypt]**, **python-jose** for JWT
- **slowapi** for rate limiting, **structlog** for logging
- **Pillow**, **python-barcode**, **qrcode** for media

Full list: [backend/requirements.txt](../backend/requirements.txt)

## Directory Layout

```
backend/
├── app/
│   ├── main.py              FastAPI app factory, middleware, lifespan
│   ├── core/                Cross-cutting infrastructure
│   │   ├── config.py        Pydantic Settings from env
│   │   ├── database.py      Async engine, session factory, TimestampMixin
│   │   ├── security.py      JWT + bcrypt helpers
│   │   ├── dependencies.py  get_db / get_current_user / get_current_customer / get_current_organization
│   │   ├── middleware.py    Request tracing + security headers
│   │   ├── exceptions.py    Custom exception classes
│   │   ├── redis.py         Redis connection
│   │   ├── celery_app.py    Celery config + Beat schedule
│   │   ├── rate_limiter.py  SlowAPI config
│   │   └── logging_config.py
│   ├── api/v1/              HTTP route handlers (router.py aggregates)
│   ├── models/              SQLAlchemy ORM models
│   ├── schemas/             Pydantic request/response schemas
│   ├── services/            Business logic (~25 files)
│   └── tasks/               Celery background jobs
├── alembic/                 Migrations (15+ versions)
├── alembic.ini
├── seed.py                  Dev data seeder
├── requirements.txt
└── Dockerfile
```

## Key Pattern: Layered Request Flow

```
Route handler (app/api/v1/foo.py)
    │   depends on get_db, get_current_user, get_current_organization
    ▼
Service (app/services/foo.py)              ← put business logic here
    │   takes AsyncSession + domain args
    ▼
Model (app/models/foo.py)                  ← SQLAlchemy ORM
    │
    ▼
Schema (app/schemas/foo.py)                ← Pydantic for I/O serialisation
```

**Rule**: Route handlers must be thin. Don't write queries in handlers — call a service. Don't return ORM models — return Pydantic schemas.

## API Routers (mounted at `/api/v1`)

See [api-reference.md](api-reference.md) for endpoint details. Routers:

| Router | Path prefix | Audience |
|---|---|---|
| `auth` | `/auth` | Staff |
| `users` | `/auth/users` | Staff (admin) |
| `products` | `/products` | Staff |
| `categories` | `/categories` | Staff |
| `inventory` | `/inventory` | Staff |
| `orders` | `/orders` | Staff |
| `customers` | `/customers` | Customer (self) + Staff |
| `storefront` | `/storefront` | Public (no auth) |
| `delivery_zones` | `/delivery-zones` | Staff |
| `delivery` | `/delivery` | Customer + Public |
| `refunds` | `/refunds` | Customer + Staff |
| `coupons` | `/coupons` | Staff + Customer (validate) |
| `rewards` | `/rewards` | Customer + Staff |
| `wallet` | `/wallet` | Customer + Staff |
| `banners` | `/banners` | Staff + Public |
| `reviews` | `/reviews` | Customer + Staff |
| `reports` | `/reports` | Staff |
| `audit` | `/audit` | Staff (admin) |
| `notifications` | `/notifications` | Customer + Staff |
| `webhooks` | `/webhooks` | Staff + System |
| `analytics` | `/analytics` | Staff |
| `drivers` | `/drivers` | Staff |
| `config` | `/config` | Staff |
| `exports` | `/exports` | Staff |
| `gdpr` | `/gdpr` | Customer (self) + Staff |
| `system` | `/system` | Public health |

## Services (`app/services/`)

Where business logic lives. Each service is a module with async functions that take an `AsyncSession`. Important ones:

- **OrderService** — order creation, line items, status state machine, refund triggering
- **RefundService** — granular per-`OrderItem` refunds, evidence handling, refund-to-wallet vs refund-to-card
- **InventoryService** — stock check, decrement on order, movement log
- **PaymentService** — Stripe stub + COD + wallet payment branching
- **DeliveryService** + **DistanceService** — postcode → zone, fee calculation
- **CouponService** + **PromotionService** — code validation, automatic rules
- **RewardsService** — tier eligibility, points
- **AuditService** — append-only `AuditLog` writes — call from every state change
- **WebhookService** — outbound delivery with retry
- **GDPRService** — data export bundle, right-to-be-forgotten

## Auth

JWT (`HS256`) via `python-jose`. Two flows:

| Flow | Token contains | Created by | Validated by |
|---|---|---|---|
| Staff | `sub=user_id` | `auth.py::login` | `get_current_user` dependency |
| Customer | `sub=customer_id, type=customer` | `customers.py::login` | `get_current_customer` dependency |

Settings:
- `ACCESS_TOKEN_EXPIRE_MINUTES` = 480 (8h)
- `REFRESH_TOKEN_EXPIRE_DAYS` = 30, stored hashed in `refresh_tokens` table

Rate limits (`slowapi`):
- Auth endpoints: **5 req/min** per IP
- General API: **20 req/sec** per IP

## Order State Machine

Defined in [backend/app/services/order.py](../backend/app/services/order.py). Statuses:

```
placed → confirmed → picking → substitution_pending → ready_for_collection
       → assigned_to_driver → out_for_delivery → delivered
                                                  └→ failed_delivery
       → cancelled / rejected (allowed from several states)
```

Each transition:
1. Validates the transition is legal.
2. Updates `Order.status`.
3. Inserts an `OrderStatusHistory` row.
4. Writes an `AuditLog`.
5. May enqueue a Celery side-effect (e.g., refund webhook).

**Do not bypass the service** — never `order.status = "..."` in route handlers.

## Database

- Async engine in [backend/app/core/database.py](../backend/app/core/database.py)
- Connection pool: 10 + 5 overflow, recycle 300s
- `TimestampMixin` adds `created_at` / `updated_at` to every model
- Use `pgcrypto.gen_random_uuid()` for PKs
- Soft delete via `is_deleted` — filter in service queries

## Alembic Migrations

Location: [backend/alembic/versions/](../backend/alembic/versions/)

Workflow:

```bash
# Generate
cd backend
alembic revision --autogenerate -m "add foo column"
# Review the generated file, then:
alembic upgrade head
# Roll back one:
alembic downgrade -1
```

**Always review autogenerated migrations** — Alembic can miss enum changes, server defaults, and JSONB schema changes. In prod, the `migrations` compose service runs `alembic upgrade head` on every deploy.

## Celery Background Jobs

Config: [backend/app/core/celery_app.py](../backend/app/core/celery_app.py)
Tasks: [backend/app/tasks/](../backend/app/tasks/)

See [architecture.md](architecture.md) for the full schedule.

## Configuration

All settings come from environment variables, parsed by Pydantic Settings in [backend/app/core/config.py](../backend/app/core/config.py). See [infrastructure.md](infrastructure.md) for the full env var list.

## Logging

Structured JSON logs via `structlog`. Every request carries a generated request-id (see `RequestTracingMiddleware`). Log via `structlog.get_logger()`, not `print` or stdlib `logging`.

## Health Checks

- `GET /system/health` — liveness
- Use this for Docker healthchecks and any external probe.
