# Development Workflow

## Prerequisites

- Docker + Docker Compose
- Node 20+ (for running frontends on host)
- Python 3.11+ (for running backend on host)

## First-Time Setup

```bash
cp .env.example .env          # Edit with your secrets
docker compose build
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m seed   # Optional dev data
```

Visit:
- Storefront: http://localhost:5173
- Admin: http://localhost:5173 (different vite instance if run separately, else routed by nginx)
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs (DEBUG=true only)

## Common Tasks

### Start / Stop the Stack

```bash
docker compose up -d                # Start everything
docker compose down                 # Stop, keep data
docker compose down -v              # Stop, wipe volumes (destroys DB!)
docker compose logs -f backend      # Tail backend logs
docker compose restart backend
```

### Run a Single Service on the Host

```bash
# Backend (with DB still in Docker)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Admin
cd admin
npm install
npm run dev

# Storefront
cd storefront
npm install
npm run dev
```

### Database Migrations

```bash
cd backend

# Generate a migration after model changes
alembic revision --autogenerate -m "add foo column to product"
# ALWAYS open and review the generated file in alembic/versions/

# Apply migrations
alembic upgrade head

# Roll back one
alembic downgrade -1

# Check current revision
alembic current

# Show history
alembic history
```

Inside Docker: prefix with `docker compose exec backend ...`.

### Seed / Reset Data

```bash
# Re-seed dev data
docker compose exec backend python -m seed

# Reset DB completely (dev only)
docker compose down -v
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m seed
```

### Restore from a Dump

```bash
# Load a SQL dump (dev)
docker compose exec -T db psql -U postgres dailygrocer_db < grocery_dump.sql
```

### Frontend Builds

```bash
cd admin && npm run build           # → admin/dist/
cd storefront && npm run build      # → storefront/dist/
```

### Type Checking / Lint (Frontends)

```bash
cd admin && npx tsc --noEmit
cd storefront && npx tsc --noEmit
```

### Background Tasks (Celery)

```bash
# Worker (one-off in dev)
docker compose exec backend celery -A app.core.celery_app worker --loglevel=info

# Beat (scheduler)
docker compose exec backend celery -A app.core.celery_app beat --loglevel=info

# Trigger a task manually
docker compose exec backend python -c "
from app.tasks.maintenance import expire_stale_coupons
expire_stale_coupons.delay()
"
```

In prod these run as their own `celery-worker` / `celery-beat` containers.

### Inspect the DB

```bash
docker compose exec db psql -U postgres dailygrocer_db
# psql tips:
\dt          -- list tables
\d products  -- describe table
\q           -- quit
```

## Debugging

### Backend

- Set `DEBUG=true` in `.env` → enables `/docs`, verbose errors, structlog `DEBUG` level.
- Logs: structured JSON to stdout; `docker compose logs -f backend`.
- Each request has a generated request id — grep logs by it.
- Drop into a route handler with `import pdb; pdb.set_trace()` — make sure you ran with `--reload`.

### Frontend

- React DevTools + browser DevTools.
- Network tab: confirm requests go to `VITE_API_BASE_URL`.
- Common: `401` loop usually means missing or stale token — clear `localStorage`.
- CORS errors → check `CORS_ORIGINS` in backend `.env` includes your frontend origin.

### Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `400 Trusted Host` | request `Host` not in `ALLOWED_HOSTS` | add to env, restart backend |
| `401` everywhere on storefront | customer JWT expired | logout + login again |
| Migration fails: missing extension | `pgcrypto` not enabled | `CREATE EXTENSION IF NOT EXISTS pgcrypto;` |
| Search returns nothing for new products | tsvector not yet rebuilt | trigger `rebuild_search_index` or wait for nightly task |
| Order stuck `placed` | autoconfirm/timeout task not running | check `order_timeout_check` Celery beat |

## Pre-Commit Checklist

Before opening a PR:
1. Backend changed? Migration created and applied locally?
2. API shape changed? Updated `admin/src/services/api.ts` AND `storefront/src/services/api.ts`?
3. Schema fields added? Updated Pydantic schemas + frontend `types.ts`?
4. New env var? Added to `.env.example` and [infrastructure.md](infrastructure.md)?
5. New scheduled task? Registered in `celery_app.py` beat schedule?
6. Frontend builds clean (`tsc --noEmit`)?
7. Manual smoke test of the affected flow in a browser?

## Branch & Commit

Looking at recent history (`feat:`, `fix:`, `ui:`), the team uses conventional-commit-style prefixes loosely. Keep messages short and intent-focused.
