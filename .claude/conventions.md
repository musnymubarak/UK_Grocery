# Code Conventions

Established patterns to follow when adding code. These are derived from existing code, not arbitrary rules.

## Backend (Python / FastAPI)

### Layering — strict
```
router  → service  → model
        ↘ schema (Pydantic in/out)
```
- **Routers** are thin: parse, call a service, return a schema.
- **Services** own business logic. Take `AsyncSession` + domain args. Pure async.
- **Models** are SQLAlchemy ORM only — no business logic.
- **Schemas** are Pydantic only — no logic beyond validators.

### Async-only Database Access
- All DB code uses `async def` + `AsyncSession`.
- Use `await session.execute(select(...))`, never `session.query(...)`.
- Never block (`time.sleep`, `requests`) — use `asyncio.sleep`, `httpx.AsyncClient`.

### Imports
```python
# stdlib
import uuid
from datetime import datetime

# third-party
from fastapi import APIRouter, Depends
from sqlalchemy import select

# local — absolute from `app`
from app.core.dependencies import get_db, get_current_user
from app.services.order import OrderService
from app.schemas.order import OrderRead, OrderCreate
```

### Naming
- Files & modules: `snake_case.py`
- Classes: `PascalCase`
- Functions / vars: `snake_case`
- Pydantic schemas: `EntityCreate`, `EntityUpdate`, `EntityRead`
- Service classes: `EntityService`

### Multi-Tenancy
**Every query that touches a tenant entity MUST filter by `organization_id`.**
```python
async def list_products(db, organization_id):
    result = await db.execute(
        select(Product)
        .where(Product.organization_id == organization_id)
        .where(Product.is_deleted == False)
    )
    return result.scalars().all()
```

### Soft Delete
- Set `is_deleted = True`, do not `DELETE`.
- Always filter `is_deleted == False` (or `.is_(False)`) on reads.

### IDs
- Use `uuid.UUID` (Python) / `UUID` column with `server_default=text("gen_random_uuid()")` (SQLAlchemy).
- Never use auto-increment integers for new tables.

### Audit & State Changes
- Any state change visible to staff/customers must write an `AuditLog` entry.
- Order status changes must go through `OrderService` — they cascade `OrderStatusHistory` + `AuditLog`.

### Errors
- Raise `HTTPException` with appropriate status from route handlers.
- Raise domain-specific exceptions from services (defined in `app/core/exceptions.py`); the router translates them.
- Don't return `{"error": "..."}` shaped responses — use HTTP status + standard FastAPI error envelope.

### Logging
```python
import structlog
log = structlog.get_logger()
log.info("order.created", order_id=str(order.id), customer_id=str(customer_id))
```
- Use snake.case event names.
- Pass context as kwargs, not interpolated into the message.

### Migrations
- Always autogenerate with a clear `-m "..."` message.
- **Manually review** every generated migration — Alembic misses enum changes, JSONB shape changes, and complex constraints.
- Provide both `upgrade()` and `downgrade()`.
- Don't squash existing migrations.

## Frontend — Admin (React 18)

### File Organisation
- Feature-sliced: `features/<feature>/` owns its pages, components, hooks, and types.
- Generic UI lives in `components/`.
- API calls go through `services/api.ts` — do not import axios elsewhere.

### Server State → React Query
```ts
const { data, isLoading } = useQuery({
  queryKey: ["products", { search }],
  queryFn: () => productApi.list({ search }),
});

const mutation = useMutation({
  mutationFn: productApi.update,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
});
```
- Query keys: `[entity, params]`.
- Always invalidate the relevant keys in `onSuccess`.

### Auth & Context
- Token lives in `localStorage` + `AuthContext`.
- Active store lives in `AdminStoreContext`.
- On 401 the axios interceptor handles redirect — feature code doesn't need to.

### Styling
- Tailwind utility classes.
- Lucide icons.
- Layout: sidebar + content; use the shared `Layout` component for new pages.

### Notifications
- `react-hot-toast` — success/error toasts after mutations.

## Frontend — Storefront (React 19)

### Feature Organisation
- Page-per-folder under `screens/`.
- Shared UI under `components/`.
- All HTTP via `services/api.ts`.

### Server State — NOT React Query
The storefront uses `useEffect + axios` patterns and local state. **Do not introduce React Query here** without explicit direction.

### Cart & Auth
- Cart goes through `CartContext` — never write directly to `localStorage` for cart items.
- Customer JWT through `AuthContext`.

### Responsive Layout
- Design mobile-first (~390 px), then verify desktop (≥1024 px).
- Layout chrome caps at `max-w-[90rem]` (1440 px). Full-width pages pass `<Layout fullWidth>` and cap their own content blocks at `max-w-[90rem] mx-auto` to align with the header.
- The earlier global `max-w-[430px]` cap is gone — don't reintroduce it.
- Tailwind v4 syntax (`@theme`, `@source` directives if used).

### Design Tokens
- Use theme tokens from [storefront/src/index.css](../storefront/src/index.css) — `bg-background`, `text-on-surface`, `bg-primary`, `text-error`, `border-outline-variant`, etc.
- Headlines use `font-headline` (Hanken Grotesk). Body uses default (`font-body` / Inter).
- Hex literals (`bg-[#xxx]`, `text-[#xxx]`) are only acceptable for brand-locked colors (Facebook, Google button, etc.). Everything else routes through the `@theme` block.

### Animations
- Use `motion/react` (Motion library) for page transitions and micro-interactions.
- Wrap route changes in `AnimatePresence` (already done in `App.tsx`).

### Cookies & Consent
- Honour the cookie banner — don't set non-essential cookies before consent.

## Cross-Cutting

### API Contracts
When changing an endpoint shape:
1. Update Pydantic schema in `backend/app/schemas/`.
2. Update both admin and storefront API client functions if they call it.
3. Update TS types (`admin/src/types.ts` / `storefront/src/types.ts`).
4. Bump anyone consuming the field.

### Secrets
- Never commit secrets. `.env` is gitignored.
- New env vars: add to `.env.example` AND [infrastructure.md](infrastructure.md).

### Tests
- The repo currently has limited automated tests. When fixing bugs in critical paths (orders, payments, refunds, auth), prefer adding a regression test in `backend/tests/` if the folder exists; otherwise call it out in the PR and do a documented manual test.

### Don't
- Don't hard-delete data — use soft delete.
- Don't mutate `Order.status` directly — use `OrderService`.
- Don't share JWT tokens across staff/customer.
- Don't fetch in a frontend `useEffect` without a cleanup if the response sets state.
- Don't query without an `organization_id` filter on tenant entities.
- Don't add a sync DB session to a hot path.
- Don't introduce a UI library (Material UI, Chakra) — stay with Tailwind + Lucide.

### Do
- Do put business logic in services.
- Do write structured logs at state changes.
- Do invalidate React Query keys after mutations (admin).
- Do test mobile width on storefront changes.
- Do review autogenerated migrations before applying.
