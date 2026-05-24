# Infrastructure

## Docker Compose

### Development — [docker-compose.yml](../docker-compose.yml)

| Service | Image / Build | Port | Purpose |
|---|---|---|---|
| `db` | `postgres:15-alpine` | 5432 | PostgreSQL data |
| `redis` | `redis:7-alpine` | 6379 | Celery broker, rate-limit, cache |
| `backend` | build `./backend` | 8000 | FastAPI (uvicorn `--reload`) |
| `storefront` | build `./storefront` | 5173 | Vite dev server (HMR) |
| `admin` | build `./admin` | 5173 | Vite dev server (HMR) |
| `nginx` | build `./nginx` | 8000 | Reverse proxy in front of stack |

Volumes:
- `db_data:/var/lib/postgresql/data`
- `./backend:/app` — backend hot reload
- `./backend/uploads:/app/uploads` — uploaded images

### Production — [docker-compose.prod.yml](../docker-compose.prod.yml)

Overrides + adds:

| Service | Purpose |
|---|---|
| `migrations` | One-shot: `alembic upgrade head` then exits |
| `celery-worker` | Background task executor |
| `celery-beat` | Scheduled task dispatcher |
| `certbot` | Let's Encrypt certificate renewal |

In prod, `storefront` and `admin` build to static `dist/` and are served by an internal nginx ([storefront/nginx.conf](../storefront/nginx.conf), [admin/nginx.conf](../admin/nginx.conf)).

## nginx

### Dev — [nginx/nginx.conf](../nginx/nginx.conf)

Single virtual server proxying:
- `/api/` → `backend:8000` (rate-limited)
- `/uploads/` → static files (30d cache)
- `/` → `storefront:5173` or `admin:5173`

### Prod — [nginx/nginx.prod.conf](../nginx/nginx.prod.conf)

Two virtual servers:

1. **`dailygrocer.co.uk`** — storefront
2. **`admin.dailygrocer.co.uk`** — admin

Both: TLS via Let's Encrypt certs, HSTS, rate limits, gzip ≥256 bytes, 50 MB max upload.

**Security headers** applied at nginx level:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Rate limit zones**:
- `auth`: 5 req/min on `/api/v1/auth/*`
- `api`: 20 req/sec on `/api/`

## Environment Variables

Loaded from `.env` (dev) or `/etc/pos/.env` (prod, Jenkins copies it). Template at [.env.example](../.env.example).

### Required

| Var | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@db:5432/dailygrocer_db` |
| `DATABASE_URL_SYNC` | `postgresql://...` (Alembic only) |
| `REDIS_URL` | `redis://redis:6379/0` |
| `JWT_SECRET_KEY` | HS256 signing key (long random string) |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | DB init |
| `CORS_ORIGINS` | comma-separated allowed origins |
| `ALLOWED_HOSTS` | comma-separated trusted host names |
| `DEBUG` | `true` in dev, `false` in prod |

### Optional / Feature

| Var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth for customer login |
| `STRIPE_SECRET_KEY` | Stripe (stub today) |
| `GEMINI_API_KEY` | Storefront AI features |
| `SMTP_*` | Email notifications |
| `SENTRY_DSN` | Error tracking |
| `LOG_LEVEL` | Default `INFO` |

### Frontend (Vite)

Vite only exposes vars prefixed `VITE_*`:

| Var | Purpose |
|---|---|
| `VITE_API_BASE_URL` | e.g. `https://dailygrocer.co.uk/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id |
| `VITE_GEMINI_API_KEY` | Storefront Gemini key (storefront only) |

## CI/CD — Jenkins

### [Jenkinsfile](../Jenkinsfile)

Triggered on push to `main`:

1. **Checkout** — git fetch from main
2. **Load env** — `cp /etc/pos/.env .env`
3. **Build & Deploy** —
   ```
   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
     up -d --build
   ```
4. **On failure** — tail container logs

### [Jenkinsfile.verify_backup](../Jenkinsfile.verify_backup)

Separate pipeline that restores `local_dump.sql` into a throwaway Postgres and runs smoke checks — verifies backups are restorable. See [BACKUP_RUNBOOK.md](../BACKUP_RUNBOOK.md) for context.

## Backups

Documented in [BACKUP_RUNBOOK.md](../BACKUP_RUNBOOK.md). DB dumps live alongside the repo (`grocery_dump.sql`, `local_dump.sql`, `snappy_shopper_seed.sql`) — these are seeds / known-good restore points, not live backups.

## Logs

- Backend logs to stdout in structured JSON (structlog) — captured by Docker.
- Snapshots: `backend_logs.txt`, `backend_logs_utf8.txt` (large; reference only).
- `tsc_errors.txt` from old TypeScript runs — historical, ignore.

## Uploads / Static Files

- Path: `/var/www/UK_Grocery/backend/uploads/` (mounted into backend container).
- Served by nginx at `/uploads/...` with 30-day cache.
- Max single upload: 50 MB.
- Product images go through `PUT /api/v1/products/{id}/image` which pipelines through Pillow for resize/optimisation.

## SSL / Certificates

In prod, `certbot` container renews Let's Encrypt certs. Cert files are bind-mounted into the nginx container's `/etc/letsencrypt/`.
