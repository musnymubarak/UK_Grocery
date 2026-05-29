# Deployment

## Docker Compose

Two stacks:
- [docker-compose.yml](../docker-compose.yml) — dev/baseline
- [docker-compose.prod.yml](../docker-compose.prod.yml) — production overlay

Services:
| Service | Image / build | Notes |
|---|---|---|
| `db` | `postgres:15-alpine` | `postgres_data` volume |
| `redis` | `redis:7-alpine` | Celery broker + cache |
| `backend` | `./backend/Dockerfile` | mounts `./backend/uploads` |
| `storefront` | `./storefront/Dockerfile` | nginx-served static build |
| `admin` | `./admin/Dockerfile` | nginx-served static build |
| `nginx` | `./nginx/Dockerfile` | publishes `8000:80`; mounts certs + uploads RO |

All on the `app-network` bridge. `nginx` depends on backend + both frontends.

## Nginx routing

[nginx/nginx.conf](../nginx/nginx.conf) — host-based split:

```
dailygrocer.co.uk          → storefront:80    (+ /api → backend, /uploads → /data/uploads)
admin.dailygrocer.co.uk    → admin:80         (+ /api → backend, /uploads → /data/uploads)
```

Rate-limit zones:
- `auth_limit` — 5 req/min by IP
- `api_limit` — 20 req/s by IP, burst 30

Security headers set globally: `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, HSTS `max-age=31536000; includeSubDomains`.

TLS certs live under `/etc/letsencrypt` on the host, mounted into the container RO. The prod nginx config is [nginx/nginx.prod.conf](../nginx/nginx.prod.conf).

## CI

[Jenkinsfile](../Jenkinsfile) — main CI pipeline.
[Jenkinsfile.verify_backup](../Jenkinsfile.verify_backup) — backup verification job.

## Backups & DR

See [BACKUP_RUNBOOK.md](../BACKUP_RUNBOOK.md). Summary:
- **RPO**: ≤24h (nightly `pg_dump -Fc`). Continuous WAL archiving is a tracked follow-up.
- **RTO**: 15–30 min depending on download speed from Azure Blob.
- Manual dump: `docker exec -t daily_grocer_db pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -Fc > db_backup_$(date +%Y%m%d_%H%M%S).dump`.
- Restore: stop app containers → `docker cp` dump into `daily_grocer_db:/tmp/` → `pg_restore --clean --if-exists -Fc /tmp/db_backup.dump` → restart.

## Environment variables

Root [.env](../.env) and [.env.example](../.env.example) supply secrets shared by backend + compose:

```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
DATABASE_URL, DATABASE_URL_SYNC
REDIS_URL
JWT_SECRET_KEY                 (must NOT be default in non-DEBUG)
DEBUG, CORS_ORIGINS, ALLOWED_HOSTS
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
GOOGLE_MAPS_API_KEY, GOOGLE_CLIENT_ID
```
