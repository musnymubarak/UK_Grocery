# Database & Data Model

PostgreSQL 15 with `pgcrypto` for `gen_random_uuid()`. All entities use UUID PKs, `created_at`/`updated_at` (TimestampMixin), and most have `is_deleted` for soft delete.

## Entity Inventory (~34 tables)

### Tenancy & Identity
- **Organization** — tenant root
- **Store** — physical branch (1:N to organization)
- **User** — staff/admin; role enum `admin | manager | delivery_boy`
- **Customer** — B2C shopper; tier `standard | premium | vip`
- **CustomerAddress** — multiple delivery addresses per customer
- **RefreshToken** — JWT refresh storage
- **DriverProfile** — extra fields for `delivery_boy` users

### Catalogue
- **Category** — hierarchy of product groupings
- **Product** — SKU, barcode, QR, cost/sell/member/promo prices, tax, age restriction, nutritional info, alcohol_data (JSONB), extended attributes (safety, storage, country of origin)
- **Banner** — homepage/promo banners with date range
- **Review** — product rating + text, moderated

### Inventory
- **Inventory** — stock level per (product, store)
- **StockMovement** — append-only ledger of every stock change (purchase / sale / adjustment / waste)

### Orders & Fulfilment
- **Order** — header: customer, store, status, type (`delivery|collection`), payment_method (`cod|online|wallet`), fees, tips, totals, coupon_id, applied_promotions (JSONB), delivery_address (snapshot), assigned_to (driver)
- **OrderItem** — line items: product snapshot, qty, `effective_unit_price`, `refunded_quantity`
- **OrderStatusHistory** — every status transition with actor + timestamp

### Refunds (granular)
- **Refund** — request header
- **RefundItem** — per-`OrderItem` refund row
- **RefundEvidence** — photo/text evidence uploads

### Promotions & Loyalty
- **Coupon** — code, type, value, expiry, usage limits
- **CouponRedemption** — usage log
- **Promotion** — automatic rules (BOGO, % off, etc.)
- **Rewards** — loyalty configuration / tier definitions
- **RewardEvent** — points earned/spent
- **CustomerMonthlySpend** — rolling spend window for tier eligibility
- **WalletTransaction** — prepaid balance ledger

### Delivery
- **DeliveryZone** — named service area with base fee
- **PostcodeZoneMapping** — postcode prefix → zone

### Platform / Ops
- **AuditLog** — append-only log of staff actions
- **Notification** — system notifications
- **WebhookEndpoint** — registered outbound webhook
- **WebhookDelivery** — per-event delivery attempt log with retry state
- **PlatformConfig** — dynamic key/value settings
- **FeatureFlag** — feature toggles

## Relationship Map

```
Organization 1───N Store
            1───N User ──── DriverProfile (1:1, optional)
            1───N Customer ───N CustomerAddress
            1───N Product ───N Inventory ── Store
            1───N Category ── Product (N:1)
            1───N Order
            1───N Coupon / Promotion / Banner / DeliveryZone

Customer 1───N Order ── Store
                 1───N OrderItem ── Product
                 1───N OrderStatusHistory
                 1───N Refund ───N RefundItem ─ OrderItem
                                 ───N RefundEvidence
                 0───1 Coupon (applied)
                 0───1 User (assigned driver)

Customer 1───N WalletTransaction
         1───N RewardEvent
         1───N CustomerMonthlySpend
         1───N Review ── Product

DeliveryZone 1───N PostcodeZoneMapping
```

## Order State Machine (canonical)

```
placed
  ├─→ confirmed
  │      ├─→ picking
  │      │      ├─→ substitution_pending
  │      │      │      └─→ ready_for_collection
  │      │      └─→ ready_for_collection
  │      │             ├─→ (collection) delivered
  │      │             └─→ assigned_to_driver
  │      │                    └─→ out_for_delivery
  │      │                           ├─→ delivered
  │      │                           └─→ delivery_failed
  │      └─→ cancelled / rejected
  └─→ cancelled / rejected
```

This shows the intended sequence — in practice `placed` can jump directly to most later statuses (including `delivered`) in one call; see `VALID_TRANSITIONS` in [backend/app/services/order.py](../backend/app/services/order.py) for the authoritative rules. This flexibility is intentional, not a gap.

All transitions enforced by `OrderService`. Each one inserts an `OrderStatusHistory` row; only staff-initiated transitions (via `update_status`) also write an `AuditLog` row — the customer self-cancel and auto-reject-timeout paths don't, since `AuditLog` is scoped to staff actions. See [backend.md](backend.md) → "Order State Machine" for details.

## Refund Pricing

Refunds are priced from `OrderItem.effective_unit_price * quantity_to_refund`. `OrderItem.refunded_quantity` tracks the running total — you cannot refund more than `quantity - refunded_quantity`. If `payment_method = wallet`, refund credits go back to `WalletTransaction`; otherwise back to the original payment method (Stripe path is stubbed but recorded).

## Key JSONB Columns

| Table.Column | Shape |
|---|---|
| `Product.nutritional_info` | `{calories, fat, protein, carbs, allergens: [...], ...}` |
| `Product.alcohol_data` | `{abv, units, container_size, ...}` (when alcoholic) |
| `Product.extended_data` | safety statements, storage type, country of origin, company details |
| `Order.applied_promotions` | `[{promotion_id, name, discount_amount}, ...]` |
| `Order.delivery_address` | snapshot of `CustomerAddress` at time of order |
| `AuditLog.metadata` | actor, before/after diff, request id |

## Indexes / Performance

Migrations include performance indexes on:
- `Order.customer_id`, `Order.store_id`, `Order.status`, `Order.created_at`
- `OrderItem.order_id`, `OrderItem.product_id`
- `Inventory.(store_id, product_id)` (unique)
- `Product.sku` (unique per org), `Product.barcode`
- `Product.search_vector` (`tsvector`, GIN) — rebuilt nightly by Celery

## Migration History (selected)

Alembic migrations in [backend/alembic/versions/](../backend/alembic/versions/):
- Phase 1 — core model enrichment
- Phase 2 — coupons
- Phase 3 — rewards
- Phase 4 — scale/hardening (indexes, search vector)
- Phase 5 — platform config + feature flags
- Extended product details (nutritional, alcohol)
- Granular refund system (RefundItem, RefundEvidence)
- POS → Grocery transformation

When adding columns or tables: `alembic revision --autogenerate -m "..."`, then **review the file by hand** before committing.

## Dev Data

[backend/seed.py](../backend/seed.py) seeds an organization, store, sample products and categories, an admin user, and a test customer. Run with `python -m seed` inside the backend container.
