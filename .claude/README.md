# .claude — Project Notes

Local-only documentation for working on **UK_Grocery / Daily Grocer**, a multi-location online grocery platform. This folder is gitignored — keep it for context, not for shared docs.

## Files

- [ARCHITECTURE.md](ARCHITECTURE.md) — High-level system map, tech stack, deployment topology.
- [BACKEND.md](BACKEND.md) — FastAPI service: layout, models, auth, background jobs.
- [STOREFRONT.md](STOREFRONT.md) — Customer React 19 app: routes, cart, auth.
- [ADMIN.md](ADMIN.md) — Staff React 18 dashboard: features, roles, data fetching.
- [MOBILE.md](MOBILE.md) — Flutter mobile rebuild of the storefront (premium UI redesign).
- [DEPLOYMENT.md](DEPLOYMENT.md) — Docker Compose, nginx routing, Jenkins, backups.
- [DEVELOPMENT.md](DEVELOPMENT.md) — Local setup, common commands, ports, env.

## At-a-glance

| App | Stack | Port (dev) | Public URL (prod) |
|---|---|---|---|
| backend | FastAPI + Postgres 15 + Redis + Celery | 8000 | dailygrocer.co.uk/api |
| storefront | React 19 + Vite + Tailwind 4 | 3000 | dailygrocer.co.uk |
| admin | React 18 + Vite + TanStack Query | 5173 | admin.dailygrocer.co.uk |
| mobile | Flutter 3.27 + Provider + Material 3 | (device) | (App Store / Play) |
