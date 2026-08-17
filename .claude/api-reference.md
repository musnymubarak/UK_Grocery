# API Reference

All endpoints are prefixed with `/api/v1`. Authentication is JWT bearer unless noted as **Public**.

| Symbol | Meaning |
|---|---|
| 🔓 | Public (no auth) |
| 👤 | Staff JWT (`get_current_user`) |
| 🛒 | Customer JWT (`get_current_customer`) |
| 🛡️ | Staff + role check (admin/manager) |

---

## Auth & Users

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/setup` | 🔓 | One-time bootstrap of org + admin user |
| POST | `/auth/login` | 🔓 | Staff login → JWT |
| GET | `/auth/me` | 👤 | Current staff profile |
| POST | `/auth/users` | 🛡️ | Create staff user |
| GET | `/auth/users` | 🛡️ | List staff |
| PUT | `/auth/users/{id}` | 🛡️ | Update staff |

## Customers (B2C)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/customers/register` | 🔓 | Register account |
| POST | `/customers/login` | 🔓 | Login → customer JWT |
| POST | `/customers/google` | 🔓 | Google OAuth login |
| GET | `/customers/me` | 🛒 | Profile |
| PUT | `/customers/me` | 🛒 | Update profile |
| POST | `/customers/me/addresses` | 🛒 | Add address |
| DELETE | `/customers/me/addresses/{id}` | 🛒 | Delete address |
| PUT | `/customers/me/addresses/{id}/default` | 🛒 | Set as default address |

Addresses are only returned embedded in `GET /customers/me` — there is no standalone list endpoint, and no generic "edit address fields" endpoint (only delete and set-default).
| GET | `/customers` | 🛡️ | List customers (staff) |
| GET | `/customers/{id}` | 🛡️ | Customer detail (staff) |

## Storefront (Public Catalogue)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/storefront/products` | 🔓 | Browse / search products |
| GET | `/storefront/products/{id}` | 🔓 | Product detail |
| GET | `/storefront/categories` | 🔓 | Category tree |
| GET | `/storefront/stores` | 🔓 | List stores |
| GET | `/storefront/banners` | 🔓 | Active banners |
| GET | `/storefront/offers` | 🔓 | Active promotions/coupons |

## Products (Admin)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/products` | 👤 | List w/ filters |
| POST | `/products` | 🛡️ | Create |
| GET | `/products/{id}` | 👤 | Detail |
| PUT | `/products/{id}` | 🛡️ | Update |
| DELETE | `/products/{id}` | 🛡️ | Soft-delete |
| GET | `/products/low-stock` | 👤 | Low-stock alerts |
| POST | `/products/{id}/image` | 🛡️ | Upload image |

## Categories

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/categories` | 👤 | List |
| POST | `/categories` | 🛡️ | Create |
| PUT | `/categories/{id}` | 🛡️ | Update |
| DELETE | `/categories/{id}` | 🛡️ | Soft-delete |

## Inventory

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/inventory/{store_id}` | 👤 | Stock per store |
| PUT | `/inventory/{store_id}/{product_id}` | 👤 | Adjust stock |
| GET | `/inventory/movements` | 👤 | Movement history |

## Orders

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/orders/checkout` | 🛒 | Customer creates order |
| GET | `/orders/me` | 🛒 | Customer's own order list |
| GET | `/orders/me/{id}` | 🛒 | Customer's own order detail |
| POST | `/orders/me/{id}/cancel` | 🛒 | Self-cancel (only within the cancel window, status must be `placed`) |
| POST | `/orders/{id}/reject-substitutions` | 👤 | Driver/staff records door-side substitution rejections (auto-refunds) |
| GET | `/orders` | 👤 | Staff list |
| GET | `/orders/dispatch` | 👤 | Live dispatch board (unassigned/in-flight + driver roster) |
| GET | `/orders/{id}` | 👤 | Staff detail |
| PATCH | `/orders/{id}/status` | 👤 | Transition status |
| PATCH | `/orders/{id}/assign` | 👤 | Assign to driver |
| GET | `/orders/delivery/my-orders` | 👤 | Delivery driver's assigned orders |

**Note on the state machine**: `placed` can transition directly to several later statuses (including `delivered`) in one call, not just to the next step in sequence — this is intentional operational flexibility (collection orders, corrections, catching up after a backlog), not a bug. See `VALID_TRANSITIONS` in `backend/app/services/order.py` for the authoritative list; don't assume the diagram below implies every transition must be taken one step at a time.

## Refunds

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/refunds/request` | 🛒 | Customer requests a granular (per-item) refund — rate-limited 3/hour |
| GET | `/refunds/me` | 🛒 | Customer's own refund requests |
| POST | `/refunds/{refund_item_id}/evidence` | 🛒 | Upload evidence for one refund item — rate-limited 5/hour |
| GET | `/refunds` | 👤 | Staff queue (org-wide) |
| POST | `/refunds/{refund_id}/items/{item_id}/process` | 🛡️ | Approve/reject one refund item (store-scoped for managers) |

There is no single-refund detail route (`GET /refunds/{id}`) — refund objects are only ever returned as part of the `me`/list responses above.

## Delivery

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/delivery-zones` | 👤 | List zones |
| POST | `/delivery-zones` | 🛡️ | Create zone |
| PUT | `/delivery-zones/{id}` | 🛡️ | Update zone |
| POST | `/delivery/calculate-fee` | 🔓 / 🛒 | Postcode → fee |
| POST | `/delivery/calculate-distance-fee` | 🔓 / 🛒 | Distance → fee |

## Coupons / Promotions / Rewards / Wallet

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/coupons` | 👤 | List |
| POST | `/coupons` | 🛡️ | Create |
| POST | `/coupons/validate` | 🛒 | Validate code at checkout |
| GET | `/rewards/me` | 🛒 | Points balance |
| POST | `/rewards/redeem` | 🛒 | Redeem points |
| GET | `/wallet/me` | 🛒 | Wallet balance + history |

There is no top-up endpoint — the wallet is only ever credited by refunds, referral bonuses, and admin adjustments; a customer cannot add funds directly.

## Reviews, Banners, Notifications

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/reviews?product_id=` | 🔓 | Public reviews |
| POST | `/reviews` | 🛒 | Submit review |
| PUT | `/reviews/{id}/moderate` | 🛡️ | Moderate |
| GET | `/banners` | 👤 | Staff list |
| POST | `/banners` | 🛡️ | Create banner |
| GET | `/notifications` | 🛒 / 👤 | Inbox |

## Reports & Analytics

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/reports/sales` | 👤 | Sales by period |
| GET | `/reports/products` | 👤 | Product performance |
| GET | `/analytics/dashboard` | 👤 | KPI tiles |
| GET | `/exports/{kind}` | 🛡️ | CSV/JSON exports |

## Audit, Config, Webhooks, GDPR

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/audit` | 🛡️ | Filterable audit log |
| GET | `/config` | 🛡️ | Platform config |
| PUT | `/config/{key}` | 🛡️ | Set config value |
| GET | `/webhooks` | 🛡️ | Endpoints |
| POST | `/webhooks` | 🛡️ | Create endpoint |
| GET | `/webhooks/deliveries` | 🛡️ | Delivery log |
| GET | `/gdpr/export` | 🛒 | Export my data |
| DELETE | `/gdpr/forget-me` | 🛒 | Right to be forgotten (anonymize) |
| POST | `/gdpr/admin/anonymize/{customer_id}` | 🛡️ | Admin-initiated anonymization (support request) |

## Drivers

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/drivers` | 👤 | List drivers |
| POST | `/drivers` | 🛡️ | Create driver profile |
| PUT | `/drivers/{id}/availability` | 👤 | Update availability |

## System

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/system/health` | 🔓 | Liveness probe |

---

## OpenAPI / Docs

When `DEBUG=true`, FastAPI exposes:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

In production these are disabled.
