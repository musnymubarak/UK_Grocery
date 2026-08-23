# Production Readiness Audit — Fixes Applied

Companion record to the production readiness audit conducted on this repo. Every
item below was verified live — rebuilt the actual Docker image, exercised the
real endpoint/component/migration against the running stack (using disposable
test data, cleaned up afterward), and checked the result — not just reviewed by
reading the diff. Where that wasn't possible, it says so explicitly.

Date: 2026-08-23. All fixes are committed locally; see commit hashes below for
what's pushed vs. still local at the time of writing.

## Summary

| # | Fix | Area | Commit(s) |
|---|---|---|---|
| 1 | Purged PII/secrets from git history | Data exposure | history rewrite (not a commit) + `7cbe035` |
| 2 | Branch-level access control for managers | Access control | `1150c83` |
| 3 | Checkout store validation | Data integrity | `eff1e9f` |
| 4 | Automated nightly database backups | Disaster recovery | `c876ac9` |
| 5 | `seed.py` production guard + history scrub | Data safety | `b2f7b14` + history rewrite |
| 6 | Host-level TLS setup documented (private) | Documentation | not committed (intentionally) |
| 7 | Staff/customer JWT audience check | Authentication | `2c6f40a` |
| 8 | GDPR anonymization: DOB/address redaction | Data protection | `d0995eb` |
| 9 | GDPR export: rewards & spend history | Data protection | `6da70b1` |
| 10 | Payment error messages no longer leak internals | Security | `010888d` |
| 11 | Order/Refund/Webhook foreign keys → RESTRICT | Data integrity | `f8a8e23` |
| 12 | Inbound Stripe webhook + idempotency | Payments | `1af6783` |
| 13 | Compose files require real secrets (no fallback) | Configuration | `f8e4e83` |
| 14 | JWT secret strength validation | Configuration | `ab37687` |
| 15 | CHECK constraints on status/role/tier | Data integrity | `d7413c3` |
| 16 | Admin dropdown keyboard accessibility | Accessibility | `55444e0` |
| 17 | Form label associations | Accessibility | `55444e0` |
| 18 | Modal focus trap / ARIA / Escape | Accessibility | `e760e6c` |
| 19 | nginx cache-control + gzip | Frontend infra | `e760e6c` |
| 20 | Removed unused Gemini/Express deps | Frontend hygiene | `0f5d0ed` |
| 21 | Stripe/Google keys moved to env vars | Frontend hygiene | `7828f15` |

Not fixed — see [Deferred / Not Fixed](#deferred--not-fixed) at the end.

---

## 1. Purged PII/secrets from git history

**Problem:** the public GitHub repo had `grocery_dump.sql`, `local_dump.sql`,
`snappy_shopper_seed.sql`, `backend_logs.txt`, `backend_logs_utf8.txt` tracked
in git — containing real-shaped customer/staff PII and bcrypt password hashes,
readable by anyone.

**Fix:** rewrote git history with `git-filter-repo` to strip all five files
from every commit, force-pushed the rewritten history (run by the repo owner,
who has push credentials this sandbox doesn't). Added `*.sql`, `*dump*`,
`*_logs*.txt` to `.gitignore` (`7cbe035`) so they can't be recommitted.

**Verified:** confirmed zero references to any of the five files in the
rewritten history (`git log --all -- <file>` empty for all five) before the
force-push; confirmed again after, from a fresh fetch.

**Still needed (not done by Claude — requires account-level action):** rotate
`JWT_SECRET_KEY` and reset the passwords whose hashes were exposed.

## 2. Branch-level access control for managers

**Problem:** the app is one organization with multiple branches, each with
its own manager — but several endpoints only checked organization-level
access (meaningless with one org) and let a manager reach another branch's
data: `stores.py` (edit any branch), `drivers.py` (view/create/edit drivers
at any branch), `customers.py` (list/view any customer company-wide).

**Fix:**
- `app/api/v1/customers.py` + `app/services/customer.py` — `list_customers`
  and `get_customer_by_id` now scoped to customers who've actually ordered
  from the manager's own store (via an `Order` join), matching the decision
  that customer visibility should be branch-scoped.
- `app/api/v1/stores.py` — `GET`/`PUT /stores/{id}` now enforce
  `get_store_scope`/`enforce_store_access`.
- `app/api/v1/drivers.py` + `app/services/driver.py` — all four driver
  endpoints (list, list-available, create, update) now pin to the manager's
  own store, silently overriding any different `store_id` they submit.

Banners, reviews, and home-layout content were deliberately left
company-wide — confirmed as intentional, not scoped per-branch.

**Verified:** live, with a real staff login and a real store selected in the
admin UI — confirmed a manager account cannot see/edit another branch's store
record, drivers, or non-visiting customers.

## 3. Checkout store validation

**Problem:** `order.py`'s `create_order` never verified `store_id` was a real
store before using it. A bogus ID silently skipped the minimum-order-value
check and only failed by the accident of stock reservation auto-creating a
zero-stock row — not a real validation.

**Fix:** added an explicit store-existence check at the top of `create_order`,
before any other logic runs. Removed two now-redundant re-fetches of the same
`Store` row later in the function (min-order-value check, surge-multiplier
check) — three DB round-trips down to one.

**Verified:** live — confirmed a checkout request with a fake `store_id` now
gets an immediate, explicit 404 instead of failing later via a side effect.

## 4. Automated nightly database backups

**Problem:** there was no automated backup mechanism anywhere — not the
Docker `certbot`/backup services claimed in `docker-compose.prod.yml`, not a
cron job, nothing. The only "backups" that existed were the dump files
tracked in git (see #1) — themselves a data breach.

**Fix:**
- `app/tasks/backup.py` (new) — `pg_dump -Fc` nightly, prunes anything older
  than 14 days.
- Registered in `celery_app.py`'s beat schedule (02:00 UTC).
- Storage: the `postgres_backups` Docker volume — already declared in
  `docker-compose.prod.yml` and unused, wired into `backend` + `celery-worker`
  in both compose files.
- `Dockerfile`: added `postgresql-client-15`, pinned to the exact server
  version — the default package pulled v17, whose dump format v15's
  `pg_restore` can't read at all.
- `Jenkinsfile.verify_backup`: rewritten to check the local volume for a
  recent dump and **fail the build** if none exists, instead of silently
  skipping (its previous behavior for months, per the Azure-backup removal
  visible in git history).
- `BACKUP_RUNBOOK.md` updated to match reality, including the known
  limitation: **backups are local-only, no offsite copy yet.**

**Verified:** built the image, ran the task for real, and fully restored the
resulting dump into a throwaway Postgres 15 container — 41 tables, 23 users
came back correctly.

## 5. `seed.py` production guard + history scrub

**Problem:** `seed.py` had no `DEBUG` guard, and — far more seriously — its
"idempotency check" hard-`DELETE`d ten core tables (`users`, `orders`,
`stores`, etc.) with no confirmation if it found an org with slug
`daily-grocer` already present, which is the real org's actual slug. It also
hardcoded `password123` for every seeded account, including
`admin@dailygrocer.co.uk` — which turned out to be a **live, working
credential** on the real database (confirmed by checking the actual stored
hash).

**Fix:** refuses to run unless `DEBUG` is explicitly `true`. Requires typing
the org slug back to confirm before the wipe-and-reseed path runs. Replaced
the hardcoded password with a new placeholder value, and purged the string
`password123` from git history via `git-filter-repo --replace-text` (run by
the repo owner) so the leaked credential — which matched a real account —
no longer appears anywhere in the repo, past or present.

**Verified:** live, three ways — `DEBUG=false` refuses before touching the
DB; `DEBUG=true` against the real dev database (which does have an org named
`daily-grocer`) correctly showed the warning and aborted cleanly on a
non-matching confirmation, proving the old version would have destroyed this
exact database.

**Still needed (account-level, not done by Claude):** rotate the real
`admin@dailygrocer.co.uk` password — the repo owner chose to do this
themselves rather than have Claude touch the live account.

## 6. Host-level TLS setup documented (private, not committed)

**Problem:** the real TLS termination for `dailygrocer.co.uk` happens via a
separate, host-level system nginx that isn't part of this repo at all — no
record of it anywhere, so losing this server would mean losing the only copy
of how to recreate it. (The Docker `nginx.prod.conf` never terminates TLS
itself, and the `certbot` service in `docker-compose.prod.yml` isn't even
running — a separate systemd timer handles real renewal.)

**Fix:** documented the real proxy chain, both host nginx configs, and the
actual cert-renewal mechanism in `.claude/TLS_HOST_SETUP.md` — deliberately
**not committed** (added to `.gitignore` specifically, verified with
`git check-ignore`), since the repo is public and this reveals infrastructure
details, including that other unrelated clients share this same host.

## 7. Staff/customer JWT audience check

**Problem:** `get_current_user` (staff auth) never checked the JWT's `role`
claim — only `get_current_customer` did. Not exploitable today (staff and
customer IDs are separate UUID spaces that can't collide), but a missing
check that the customer side already had.

**Fix:** added `if payload.get("role") != "staff": raise Unauthorized`,
matching the existing customer-side pattern exactly.

**Verified:** live — a genuine staff token still works; a token with the
*same real admin's ID* but tagged `role=customer` is now rejected; a token
with no role claim at all is also rejected.

## 8. GDPR anonymization: DOB/address redaction

**Problem:** "forget me" anonymization never cleared `customer.dob` or
`referral_code`, and left every historical order's exact delivery address
and instructions untouched in plain text forever.

**Fix:** clears `dob`/`referral_code` on anonymization. Added
`redact_expired_order_addresses()` — scrubs `Order.delivery_address`/
`delivery_instructions` to `[redacted]` once 6 years have passed (UK HMRC
financial record-keeping window); called immediately for orders already past
that window at anonymization time, and swept nightly (`app/tasks/gdpr.py`,
05:00 UTC) for orders that cross the threshold later.

**Verified:** live, with disposable test data — a 7-year-old order's address
got redacted immediately on anonymization while a same-day order was
correctly left untouched; separately, a customer anonymized while their
order was still recent was correctly left alone, then the nightly sweep
function caught it after the order was artificially aged past the window.

## 9. GDPR export: rewards & spend history

**Problem:** the data export ("show me everything you have on me") never
included `RewardEvent` (loyalty activity) or `CustomerMonthlySpend` — an
incomplete response to a Subject Access Request.

**Fix:** both added to the export bundle, with the reward's tier name and
coupon code resolved via their relationships rather than left as raw IDs.

**Verified:** live, with a disposable customer + reward event + monthly
spend row — confirmed both sections appear correctly in the export output.

## 10. Payment error messages no longer leak internals

**Problem:** `payments.py` returned the raw exception message — including
Stripe's internal error text — directly to the customer on any failure,
regardless of `DEBUG`.

**Fix:** logs the full error server-side via `structlog`, returns a fixed
generic message to the client.

**Verified:** live, with a real (not simulated) Stripe error — customer
response was the generic message; server log captured the real Stripe error
detail in full.

## 11. Order/Refund/Webhook foreign keys → RESTRICT

**Problem:** `Order`/`Refund`'s parent foreign keys (`organization_id`,
`store_id`, `customer_id`, `order_id`) were all `ON DELETE CASCADE` —
a genuine hard-`DELETE` on a customer/store row would silently cascade-delete
every order and refund beneath it, destroying financial records. Separately,
`WebhookEndpoint.organization_id` and `WebhookDelivery.endpoint_id` had **no**
foreign key at all.

**Fix:** changed the Order/Refund FKs to `RESTRICT` (matching the pattern
already correctly used on `OrderItem.product_id`). Added proper `ForeignKey`
constraints (also `RESTRICT`) to both webhook columns, after checking the
live database for orphaned rows first (none found).

**Migrations:** `639c14b9f1e0` (Order/Refund), `2108b65b520f` (webhook FKs).

**Verified:** live — attempted a real `DELETE FROM customers` on a
disposable customer with an order; Postgres correctly refused with a foreign
key violation. Attempted inserting a webhook endpoint/delivery with a fake
ID; both correctly rejected.

## 12. Inbound Stripe webhook + idempotency

**Problem:** `STRIPE_WEBHOOK_SECRET` was defined in config but used nowhere —
no route existed to receive Stripe's async events (disputes, delayed
payment confirmations, reversals). Payment status was only ever checked once,
synchronously, at checkout.

**Fix:** `POST /api/v1/webhooks/stripe` — verifies `Stripe-Signature` via the
official `stripe` SDK, handles `payment_intent.succeeded`/`payment_failed`
(updates `Order.payment_status`) and `charge.dispute.*` (logged via
structlog, since no staff actor exists for `AuditLog`). Added a
`stripe_webhook_events` table recording every processed event ID — the
route inserts the ID *before* acting on it, and a unique-constraint conflict
means Stripe redelivered an event already handled, which is skipped rather
than reprocessed (important once this ever does something non-idempotent
like crediting a wallet, not just setting a status field).

Also fixed: `docker-compose.yml` never actually passed
`STRIPE_WEBHOOK_SECRET` through to the backend container in either dev or
prod — the endpoint would have stayed permanently "not configured" even
after someone set the secret correctly.

**Migration:** `90662da2c55a` (`stripe_webhook_events` table).

**Verified:** live, with real HMAC-signed requests (not mocked) — no secret
configured → 500; bad signature → 400; genuinely valid signature → 200 and a
disposable order's `payment_status` actually flipped in the database; same
event ID resent 3× → processed once, skipped twice; a different event ID →
processed normally.

## 13. Compose files require real secrets (no fallback)

**Problem:** `docker-compose.yml`/`docker-compose.prod.yml` fell back to
guessable, committed-in-git defaults (`change-this-secret-key-in-production`,
`pos_password`, etc.) if the real env var was missing — and the fallbacks
were inconsistent across files/services, risking `migrations` connecting to
a different database than the running app.

**Fix:** all 15 occurrences across both files changed from `${VAR:-fallback}`
to `${VAR:?clear error message}` — missing config now fails the deploy
loudly instead of silently starting with a public default.

**Verified:** live — with the real `.env`, resolves and starts exactly as
before; with an explicitly empty env-file, fails immediately with
`required variable POSTGRES_USER is missing a value`. Confirmed all four
services (`backend`, `celery-worker`, `celery-beat`, `migrations`) now
resolve to the *identical* connection string — the inconsistency is
structurally impossible now, not just coincidentally fixed.

## 14. JWT secret strength validation

**Problem:** the only production-mode check was an exact-match blocklist of
two known placeholder strings — `admin123`, a single character, or anything
else short/weak passed cleanly.

**Fix:** kept the blocklist (still needed — one placeholder is 44 characters,
long enough to slip past a length check alone) and added: minimum 32
characters, minimum 8 distinct characters (catches e.g. 32 repeated
characters, which pass length but are trivially guessable).

**Verified:** live, six cases — `DEBUG=true` bypasses (correct);
`DEBUG=false` + `admin123` → rejected (too short); both known placeholders →
rejected (blocklist, including the 44-char one that would've beaten a
length-only check); 32 repeated characters → rejected (diversity); a real
64-char hex secret → passed; confirmed the actual production secret still
starts cleanly.

## 15. CHECK constraints on status/role/tier

**Problem:** `Order.status`, `User.role`, `Customer.membership_tier` were
plain `VARCHAR` — valid values existed only as Python-side logic/comments,
nothing stopped a raw `UPDATE` or bad migration from writing garbage.

**Fix:** added `CHECK` constraints with the exact valid value sets, sourced
from the authoritative code (not the — in one case stale — model comments):
`Order.status` from `VALID_TRANSITIONS`' keys (13 values); `User.role` from
the Pydantic schema pattern (`admin, manager, cashier, delivery_boy` — the
model's own comment was missing `cashier`, a real, live role); `membership_tier`
from `(standard, premium, vip)`. Cross-checked all three against actual
distinct values already in the live database before writing the migration.

**Migration:** `7ca51cc44bf6`.

**Verified:** live — raw `UPDATE`s setting `status='banana'`, `role='superhero'`,
`membership_tier='diamond'` all correctly rejected by Postgres (and
harmlessly, since a rejected `UPDATE` never touches the row). Valid values
(`refund_requested`, `cashier`, `vip`) on disposable rows correctly accepted.

## 16. Admin dropdown keyboard accessibility

**Problem:** `CustomSelect.tsx` (used for order status and product fields
throughout admin) was built from plain `<div>`s with `onClick` handlers —
invisible to Tab, unusable without a mouse.

**Fix:** rebuilt as a proper accessible combobox — real `<button>` trigger,
`role="combobox"`/`listbox`/`option`, `aria-activedescendant`, full
Enter/Space/Arrow/Escape keyboard handling.

**Verified:** live, in a real browser, with real keyboard presses (not
simulated) — Tab reached it after 43 presses through the full nav (proving
it's genuinely in tab order); arrow keys moved the highlight correctly
across a real 10-option status list; Enter selected an option and the
resulting API mutation genuinely changed the order's status in the database;
Escape closed it without changing anything.

## 17. Form label associations

**Problem:** every `<label>` across storefront's `Login.tsx` (8 fields), the
shared `Input` component used in `Checkout.tsx`, and admin's `LoginPage.tsx`
(2 fields) sat visually next to its input with no actual `id`/`htmlFor`
link — invisible to screen readers.

**Fix:** added explicit `id`/`htmlFor` pairs to all 8 storefront fields and
both admin fields; the shared `Checkout.tsx` `Input` component now generates
its own unique id via `useId()`, so every call site gets a correct pairing
automatically without being touched individually.

**Verified:** live, via Playwright's `getByLabel()` — the same resolution
algorithm a screen reader uses — for all fields across both login screens
and all three checkout address fields (Postcode, Street Address, Contact
Number); every one resolved to exactly the right input and filled correctly.

## 18. Modal focus trap / ARIA / Escape

**Problem:** `storefront/components/Modal.tsx` had no `role="dialog"`, no
focus trap (Tab could walk straight out of an open modal into whatever's
behind it), no Escape handler, no focus restored on close, and the icon-only
close button had no accessible name.

**Fix:** added `role="dialog"`/`aria-modal`/`aria-labelledby`; focus moves
into the dialog on open; Tab/Shift+Tab cycle correctly among the dialog's
focusable elements without ever leaving it; Escape closes it; focus is
restored to whatever opened it on close; close button now has
`aria-label="Close"`.

**Verified:** live, using the real "Forget me" (GDPR anonymize) confirmation
dialog on the Profile page — every check passed: dialog role/attributes
present, focus moved in on open, six Tab presses cycled correctly through
Close → Cancel → Confirm → Close..., Escape closed it, and focus returned to
the exact button that opened it.

**Unrelated bug surfaced while testing, not fixed:** a full page reload
while on `/profile` triggers a spurious logout (`/customers/logout` fires
three times, then `/customers/me` returns 401). Client-side navigation is
unaffected. Worth a separate look.

## 19. nginx cache-control + gzip

**Problem:** `admin/nginx.conf` and `storefront/nginx.conf` (identical) had
no explicit `Cache-Control` on `index.html` — a stale SPA shell could keep
referencing hashed bundle filenames a fresh deploy had already replaced. Also
no `gzip` directive.

**Fix:** added explicit `Cache-Control: no-cache` on `index.html` specifically
(the real gap). Also added `gzip on` with standard settings — **note this
part isn't fixing an active problem**: verified the outer Docker nginx layer
already compresses everything regardless of these two files, so this is
defense-in-depth, not a functional fix.

**Verified:** live — `index.html` now returns `cache-control: no-cache`;
`/assets/*.js` still correctly returns `max-age=31536000` (unaffected).

## 20. Removed unused Gemini/Express deps

**Problem:** `storefront/package.json` had `@google/genai`, `express`,
`dotenv`, `tsx` installed but never imported anywhere — leftover from
bootstrapping via Google's AI Studio tool. `.env.example` had matching
AI-Studio boilerplate implying a `VITE_GEMINI_API_KEY` pattern. Not
dangerous today, but exactly the kind of leftover scaffolding that invites
someone to "finish" the integration the wrong way — as a `VITE_`-prefixed
key, which Vite bakes directly into the public bundle.

**Fix:** removed all four packages plus `@types/express` (orphaned once
`express` is gone) via `npm uninstall` — 108 transitive packages came out
with them. Removed the stale `.env.example`.

**Verified:** `tsc --noEmit` clean, a full production build succeeded, the
actual Docker image was rebuilt and deployed, live site confirmed healthy.

## 21. Stripe/Google keys moved to env vars

**Problem:** `storefront/src/constants.ts` hardcoded the Stripe publishable
key and Google client ID directly in source — not secrets by design, but a
code comment flagged the Stripe key as "swap for live before launch," which
is exactly the kind of reminder that gets missed.

**Fix:** moved both to `VITE_STRIPE_PUBLISHABLE_KEY`/`VITE_GOOGLE_CLIENT_ID`
env vars. Since Vite inlines `VITE_`-prefixed vars at *build* time, not
runtime, this required wiring the full chain: root `.env` → Docker build
args in `docker-compose.yml` → `ARG`/`ENV` in the `Dockerfile` → read via
`import.meta.env` in `constants.ts`.

**Verified:** rebuilt the image with deliberately different fake values,
extracted the actual built JS from the image, confirmed the fake values were
genuinely present in the bundle — proving the whole chain works, not just
that the source file looks different. Rebuilt again with the real `.env`
values and confirmed the correct values replaced the fake ones, then
confirmed the live deployed bundle matches.

---

## Deferred / Not Fixed

- **JSONB shape validation** (`Product.nutritional_info`, `Order.applied_promotions`,
  etc.) — the audit's own recommendation was "low priority, only add a
  `jsonb_matches_schema` CHECK if direct DB writes become common." That
  condition isn't currently true, so nothing was implemented.
- **No automated test suite / CI gate** — a CI workflow (`tsc --noEmit` +
  backend sanity check on every PR) was built, verified working, then
  explicitly removed at the repo owner's request ("not now").
- **Jenkins `frontend`/service-name mismatch** — confirmed the pipeline has
  no live trigger connected, so it's dormant code with no active risk;
  deprioritized rather than fixed.
- **Full page reload on `/profile` triggers a spurious logout** — surfaced
  incidentally while testing the Modal fix (#18). Not investigated further.
- **`axios`/`@babel/core` vulnerabilities** (from `npm audit`, surfaced while
  removing unused deps in #20) — pre-existing, unrelated to what was removed,
  not addressed.
- **Cross-organization findings from the original audit** (per-org uniqueness
  on SKU/barcode/coupon/email, GDPR admin-anonymize org check, checkout
  cross-org product/store trust) — downgraded to non-issues once the repo
  owner confirmed this is permanently one organization with multiple
  branches, not a multi-tenant platform. There is no second organization for
  any of these to leak across.
