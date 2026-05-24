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
| GET | `/customers/addresses` | 🛒 | List addresses |
| POST | `/customers/addresses` | 🛒 | Add address |
| PUT | `/customers/addresses/{id}` | 🛒 | Update address |
| DELETE | `/customers/addresses/{id}` | 🛒 | Delete address |
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
| POST | `/orders` | 🛒 | Customer creates order |
| GET | `/orders` | 👤 | Staff list |
| GET | `/orders/{id}` | 👤 / 🛒 | Detail (owner check for customer) |
| PUT | `/orders/{id}` | 👤 | Update meta |
| PUT | `/orders/{id}/status` | 👤 | Transition status |
| POST | `/orders/{id}/assign` | 👤 | Assign to driver |

## Refunds

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/refunds` | 🛒 | Customer requests refund |
| GET | `/refunds` | 👤 | Staff queue |
| GET | `/refunds/{id}` | 👤 / 🛒 | Detail |
| PUT | `/refunds/{id}` | 🛡️ | Approve/reject (per item) |
| POST | `/refunds/{id}/evidence` | 🛒 / 👤 | Upload evidence |

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
| POST | `/wallet/topup` | 🛒 | Topup (Stripe stub) |

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
| POST | `/gdpr/export` | 🛒 | Export my data |
| POST | `/gdpr/delete` | 🛒 | Right to be forgotten |

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
