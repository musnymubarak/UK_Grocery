"""
Seed script — populate the POS database with realistic dummy data.

Uses psycopg2 directly (no async engine needed).

Usage:
    cd backend
    python seed.py

All seeded users share the password: password123
Admin login: admin@retailpos.com / password123
"""

import uuid
import random
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal

import psycopg2
import psycopg2.extras
import bcrypt

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
def _load_env_file():
    """Read .env from project root (one level up or current dir)."""
    for candidate in [os.path.join(os.path.dirname(__file__), "..", ".env"),
                      os.path.join(os.path.dirname(__file__), ".env"),
                      ".env"]:
        p = os.path.abspath(candidate)
        if os.path.isfile(p):
            with open(p) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())
            break

_load_env_file()

DATABASE_URL = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql://pos_user:pos_password@postgres:5432/pos_db",
)

PASSWORD = "password123"
HASHED_PW = bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt()).decode()

# Date range: 3 months  (Dec 1 2025 → Feb 28 2026)
START_DATE = datetime(2025, 12, 1, tzinfo=timezone.utc)
END_DATE   = datetime(2026, 2, 28, 23, 59, 59, tzinfo=timezone.utc)
TOTAL_DAYS = (END_DATE - START_DATE).days  # ~90

# Register UUID adapter for psycopg2
psycopg2.extras.register_uuid()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def uid() -> uuid.UUID:
    return uuid.uuid4()


def rand_dt(start: datetime = START_DATE, end: datetime = END_DATE) -> datetime:
    delta = end - start
    secs = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=secs)


def seq_dt(day: int, hour: int = 9) -> datetime:
    return START_DATE + timedelta(days=day, hours=hour, minutes=random.randint(0, 59))


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------
STORE_DATA = [
    {"name": "Downtown Central",    "code": "DTC", "city": "Mumbai",   "state": "Maharashtra",   "country": "India", "address": "12 MG Road, Fort",           "phone": "+91-22-12345678", "email": "downtown@retailpos.com"},
    {"name": "Mall of India Store", "code": "MOI", "city": "Noida",    "state": "Uttar Pradesh", "country": "India", "address": "Mall of India, Sector 18",   "phone": "+91-120-2345678", "email": "moi@retailpos.com"},
    {"name": "Tech Park Outlet",    "code": "TPO", "city": "Bangalore", "state": "Karnataka",    "country": "India", "address": "Manyata Tech Park, Block C", "phone": "+91-80-34567890", "email": "techpark@retailpos.com"},
    {"name": "Lake City Store",     "code": "LCS", "city": "Udaipur",  "state": "Rajasthan",     "country": "India", "address": "45 Lake Palace Road",        "phone": "+91-294-4567890", "email": "lakecity@retailpos.com"},
    {"name": "Heritage Market",     "code": "HMK", "city": "Jaipur",   "state": "Rajasthan",     "country": "India", "address": "Johari Bazaar, Old City",    "phone": "+91-141-5678901", "email": "heritage@retailpos.com"},
]

CATEGORY_DATA = [
    # (name, description, parent_index_or_None)
    ("Electronics",        "Electronic gadgets and accessories",  None),
    ("Groceries",          "Daily grocery and pantry items",      None),
    ("Beverages",          "Drinks, juices, and water",           None),
    ("Snacks",             "Chips, biscuits, and namkeen",        None),
    ("Personal Care",      "Hygiene and grooming products",       None),
    ("Mobile Accessories", "Cases, chargers, cables",             0),     # child of Electronics
    ("Dairy",              "Milk, curd, cheese, butter",          1),     # child of Groceries
    ("Cleaning",           "Soaps, detergents, cleaners",         None),
]

PRODUCT_DATA = [
    # (name, sku, cat_idx, cost, sell, tax%, unit)
    # Electronics
    ("Wireless Earbuds",       "ELEC-001", 0, 800,  1499, 18, "pcs"),
    ("USB-C Charging Cable",   "ELEC-002", 0, 120,   249, 18, "pcs"),
    ("Bluetooth Speaker",      "ELEC-003", 0, 1200, 2199, 18, "pcs"),
    ("Power Bank 10000mAh",    "ELEC-004", 0, 600,  1099, 18, "pcs"),
    ("LED Desk Lamp",          "ELEC-005", 0, 450,   899, 18, "pcs"),
    ("Wired Mouse",            "ELEC-006", 0, 180,   349, 18, "pcs"),
    # Mobile Accessories
    ("Phone Case - Silicone",  "MOBI-001", 5, 80,    199, 18, "pcs"),
    ("Tempered Glass Screen",  "MOBI-002", 5, 40,    149, 18, "pcs"),
    ("Car Phone Mount",        "MOBI-003", 5, 200,   449, 18, "pcs"),
    ("Fast Charger 25W",       "MOBI-004", 5, 350,   699, 18, "pcs"),
    # Groceries
    ("Basmati Rice 5kg",       "GROC-001", 1, 320,   450,  5, "pcs"),
    ("Whole Wheat Atta 10kg",  "GROC-002", 1, 380,   520,  5, "pcs"),
    ("Toor Dal 1kg",           "GROC-003", 1, 130,   175,  5, "pcs"),
    ("Sugar 5kg",              "GROC-004", 1, 200,   260,  5, "pcs"),
    ("Sunflower Oil 5L",       "GROC-005", 1, 550,   720,  5, "pcs"),
    ("Salt 1kg",               "GROC-006", 1, 18,     25,  0, "pcs"),
    ("Turmeric Powder 200g",   "GROC-007", 1, 35,     55,  5, "pcs"),
    ("Red Chilli Powder 200g", "GROC-008", 1, 45,     70,  5, "pcs"),
    # Dairy
    ("Full Cream Milk 1L",     "DAIR-001", 6, 52,     68,  0, "pcs"),
    ("Paneer 200g",            "DAIR-002", 6, 70,     95,  0, "pcs"),
    ("Curd 400g",              "DAIR-003", 6, 30,     45,  0, "pcs"),
    ("Butter 500g",            "DAIR-004", 6, 210,   270,  5, "pcs"),
    ("Cheese Slice Pack",      "DAIR-005", 6, 85,    120,  5, "pcs"),
    # Beverages
    ("Coca-Cola 2L",           "BEVR-001", 2, 65,     90, 12, "pcs"),
    ("Mango Juice 1L",         "BEVR-002", 2, 75,    110, 12, "pcs"),
    ("Mineral Water 1L",       "BEVR-003", 2, 12,     20,  0, "pcs"),
    ("Cold Coffee 200ml",      "BEVR-004", 2, 25,     40, 12, "pcs"),
    ("Green Tea 25 bags",      "BEVR-005", 2, 90,    150,  5, "pcs"),
    ("Energy Drink 250ml",     "BEVR-006", 2, 50,     85, 12, "pcs"),
    # Snacks
    ("Potato Chips 150g",      "SNCK-001", 3, 30,     50, 12, "pcs"),
    ("Chocolate Bar",          "SNCK-002", 3, 25,     45, 12, "pcs"),
    ("Mixed Nuts 250g",        "SNCK-003", 3, 180,   280, 12, "pcs"),
    ("Biscuit Pack 300g",      "SNCK-004", 3, 28,     45, 12, "pcs"),
    ("Namkeen 400g",           "SNCK-005", 3, 55,     85, 12, "pcs"),
    ("Popcorn Microwave",      "SNCK-006", 3, 40,     70, 12, "pcs"),
    ("Fruit Candy Pack",       "SNCK-007", 3, 15,     30, 12, "pcs"),
    # Personal Care
    ("Shampoo 200ml",          "CARE-001", 4, 110,   180, 18, "pcs"),
    ("Body Wash 250ml",        "CARE-002", 4, 130,   210, 18, "pcs"),
    ("Toothpaste 150g",        "CARE-003", 4, 55,     90, 12, "pcs"),
    ("Hand Sanitizer 200ml",   "CARE-004", 4, 45,     80, 12, "pcs"),
    ("Face Cream 50g",         "CARE-005", 4, 120,   220, 18, "pcs"),
    ("Deodorant Spray 150ml",  "CARE-006", 4, 100,   175, 18, "pcs"),
    # Cleaning
    ("Dish Soap 500ml",        "CLEN-001", 7, 40,     65, 18, "pcs"),
    ("Floor Cleaner 1L",       "CLEN-002", 7, 75,    120, 18, "pcs"),
    ("Laundry Detergent 1kg",  "CLEN-003", 7, 95,    155, 18, "pcs"),
    ("Toilet Cleaner 500ml",   "CLEN-004", 7, 50,     85, 18, "pcs"),
    ("Glass Cleaner 500ml",    "CLEN-005", 7, 55,     90, 18, "pcs"),
    ("Sponge Pack (3 pcs)",    "CLEN-006", 7, 18,     35, 18, "pcs"),
    ("Broom Stick",            "CLEN-007", 7, 80,    140, 18, "pcs"),
    ("Garbage Bags (30 pcs)",  "CLEN-008", 7, 45,     75, 18, "pcs"),
]

PAYMENT_METHODS = ["cash", "card", "upi"]
MANAGER_NAMES = ["Priya Patel", "Arjun Singh", "Neha Gupta", "Vikram Reddy", "Anjali Nair"]
CASHIER_NAMES = [
    "Amit Kumar",  "Sita Devi",   "Ravi Verma",
    "Pooja Mehta", "Deepak Joshi","Kavita Rao",
    "Suresh Yadav","Meena Iyer",  "Rajesh Tiwari",
    "Sunita Das",  "Manoj Pillai","Rekha Saxena",
    "Anil Sharma", "Divya Chopra","Kiran Bhat",
]


# ---------------------------------------------------------------------------
# Seed function
# ---------------------------------------------------------------------------
def seed():
    print("🔌 Connecting to:", DATABASE_URL.split("@")[-1])  # hide creds
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ── Idempotency check ────────────────────────────────────────
        cur.execute("SELECT id FROM organizations WHERE slug = 'retailpos-demo' LIMIT 1")
        row = cur.fetchone()
        if row:
            print("⚠️  Seed data already exists. Wiping and re-seeding…")
            for tbl in ["sync_logs", "stock_movements", "sale_items", "sales",
                        "inventory", "products", "categories", "users", "stores", "organizations"]:
                cur.execute(f"DELETE FROM {tbl}")
            conn.commit()
            print("   Old data cleared.\n")

        # ── 1. Organization ──────────────────────────────────────────
        org_id = uid()
        cur.execute("""
            INSERT INTO organizations (id, name, slug, description, settings, logo_url,
                                       contact_email, contact_phone, address,
                                       created_at, updated_at, is_deleted)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (org_id, "RetailPOS Demo", "retailpos-demo",
              "Multi-store retail demo organization",
              '{"currency":"INR","tax_inclusive":false}',
              None, "admin@retailpos.com", "+91-11-99999999",
              "Corporate HQ, Connaught Place, New Delhi",
              START_DATE, START_DATE, False))
        print(f"✅ Organization created: RetailPOS Demo")

        # ── 2. Stores ────────────────────────────────────────────────
        store_ids = []
        store_codes = []
        for sd in STORE_DATA:
            sid = uid()
            cur.execute("""
                INSERT INTO stores (id, organization_id, name, code, address, city, state,
                                    country, phone, email, is_active, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (sid, org_id, sd["name"], sd["code"], sd["address"], sd["city"],
                  sd["state"], sd["country"], sd["phone"], sd["email"], True,
                  START_DATE, START_DATE, False))
            store_ids.append(sid)
            store_codes.append(sd["code"])
        print(f"✅ Stores: {len(store_ids)} created")

        # ── 3. Users ─────────────────────────────────────────────────
        user_ids = []
        user_roles = []
        user_store_ids = []

        # Admin (no store)
        admin_id = uid()
        cur.execute("""
            INSERT INTO users (id, organization_id, store_id, email, hashed_password,
                               full_name, role, phone, is_active, created_at, updated_at, is_deleted)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (admin_id, org_id, None, "admin@retailpos.com", HASHED_PW,
              "Rahul Sharma (Admin)", "admin", "+91-99000-00001", True,
              START_DATE, START_DATE, False))
        user_ids.append(admin_id)
        user_roles.append("admin")
        user_store_ids.append(None)

        # Managers & cashiers
        cashier_idx = 0
        store_cashier_map = {}  # store_id → [user_id, …]
        for i, sid in enumerate(store_ids):
            # Manager
            mgr_id = uid()
            cur.execute("""
                INSERT INTO users (id, organization_id, store_id, email, hashed_password,
                                   full_name, role, phone, is_active, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (mgr_id, org_id, sid, f"manager{i+1}@retailpos.com", HASHED_PW,
                  f"{MANAGER_NAMES[i]} (Manager)", "manager", f"+91-99000-{10+i:05d}",
                  True, START_DATE, START_DATE, False))
            user_ids.append(mgr_id)
            user_roles.append("manager")
            user_store_ids.append(sid)

            # 3 Cashiers
            cashiers_for_store = []
            for j in range(3):
                cid = uid()
                cur.execute("""
                    INSERT INTO users (id, organization_id, store_id, email, hashed_password,
                                       full_name, role, phone, is_active, created_at, updated_at, is_deleted)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (cid, org_id, sid, f"cashier{cashier_idx+1}@retailpos.com", HASHED_PW,
                      f"{CASHIER_NAMES[cashier_idx]} (Cashier)", "cashier",
                      f"+91-99000-{100+cashier_idx:05d}", True, START_DATE, START_DATE, False))
                user_ids.append(cid)
                user_roles.append("cashier")
                user_store_ids.append(sid)
                cashiers_for_store.append(cid)
                cashier_idx += 1
            store_cashier_map[sid] = cashiers_for_store

        print(f"✅ Users: {len(user_ids)} created (1 admin + 5 managers + 15 cashiers)")

        # ── 4. Categories ────────────────────────────────────────────
        cat_ids = []
        for idx, (name, desc, parent_idx) in enumerate(CATEGORY_DATA):
            cid = uid()
            parent = cat_ids[parent_idx] if parent_idx is not None else None
            cur.execute("""
                INSERT INTO categories (id, organization_id, name, description, parent_id,
                                        sort_order, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (cid, org_id, name, desc, parent, idx, START_DATE, START_DATE, False))
            cat_ids.append(cid)
        print(f"✅ Categories: {len(cat_ids)} created")

        # ── 5. Products ──────────────────────────────────────────────
        prod_ids = []
        prod_prices = []   # (selling_price, tax_rate)
        prod_names = []
        prod_skus = []
        for idx, (name, sku, cat_idx, cost, sell, tax, unit) in enumerate(PRODUCT_DATA):
            pid = uid()
            barcode = f"890{idx:010d}"
            cur.execute("""
                INSERT INTO products (id, organization_id, category_id, name, description,
                                      sku, barcode, qr_code_data, cost_price, selling_price,
                                      tax_rate, unit, low_stock_threshold, image_url,
                                      created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (pid, org_id, cat_ids[cat_idx], name, f"Dummy description for {name}",
                  sku, barcode, None, Decimal(str(cost)), Decimal(str(sell)),
                  Decimal(str(tax)), unit, 10, None, START_DATE, START_DATE, False))
            prod_ids.append(pid)
            prod_prices.append((Decimal(str(sell)), Decimal(str(tax))))
            prod_names.append(name)
            prod_skus.append(sku)
        print(f"✅ Products: {len(prod_ids)} created")

        # ── 6. Inventory (every product × every store) ───────────────
        inv_count = 0
        for sid in store_ids:
            for pid in prod_ids:
                qty = random.randint(20, 200)
                cur.execute("""
                    INSERT INTO inventory (id, product_id, store_id, quantity, reserved_quantity,
                                           created_at, updated_at, is_deleted)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """, (uid(), pid, sid, qty, 0, START_DATE, START_DATE, False))
                inv_count += 1
        print(f"✅ Inventory: {inv_count} rows")

        # ── 7. Sales + SaleItems ─────────────────────────────────────
        sale_count = 0
        item_count = 0
        invoice_counter = 1
        sale_refs = []  # (sale_id, store_id, user_id, created_at, invoice_number)

        for day in range(TOTAL_DAYS):
            num_sales = random.randint(8, 12)
            for _ in range(num_sales):
                store_idx = random.randint(0, len(store_ids) - 1)
                sid = store_ids[store_idx]
                cashier_id = random.choice(store_cashier_map[sid])
                sale_dt = seq_dt(day, hour=random.randint(9, 21))

                # Pick 1-5 random products
                num_items = random.randint(1, 5)
                chosen_idxs = random.sample(range(len(prod_ids)), min(num_items, len(prod_ids)))

                subtotal = Decimal("0")
                tax_total = Decimal("0")
                items_to_insert = []

                for pi in chosen_idxs:
                    qty = random.randint(1, 4)
                    sell_price = prod_prices[pi][0]
                    tax_rate = prod_prices[pi][1]
                    item_tax = (sell_price * qty * tax_rate / Decimal("100")).quantize(Decimal("0.01"))
                    item_total = (sell_price * qty + item_tax).quantize(Decimal("0.01"))
                    subtotal += sell_price * qty
                    tax_total += item_tax
                    items_to_insert.append((
                        uid(), None, prod_ids[pi], prod_names[pi], prod_skus[pi],
                        qty, sell_price, Decimal("0"), item_tax, item_total,
                        sale_dt, sale_dt, False
                    ))

                sale_discount = Decimal("0")
                if random.random() < 0.15:
                    sale_discount = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
                sale_total = (subtotal - sale_discount + tax_total).quantize(Decimal("0.01"))
                subtotal = subtotal.quantize(Decimal("0.01"))

                inv_num = f"INV-{sale_dt.strftime('%Y%m%d')}-{invoice_counter:06d}"
                invoice_counter += 1

                sale_id = uid()
                cur.execute("""
                    INSERT INTO sales (id, store_id, user_id, invoice_number, subtotal,
                                       discount_amount, tax_amount, total, status,
                                       payment_method, notes, client_id,
                                       created_at, updated_at, is_deleted)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (sale_id, sid, cashier_id, inv_num, subtotal,
                      sale_discount, tax_total, sale_total, "completed",
                      random.choice(PAYMENT_METHODS), None, None,
                      sale_dt, sale_dt, False))
                sale_count += 1
                sale_refs.append((sale_id, sid, cashier_id, sale_dt, inv_num))

                for itm in items_to_insert:
                    cur.execute("""
                        INSERT INTO sale_items (id, sale_id, product_id, product_name, product_sku,
                                                quantity, unit_price, discount_amount, tax_amount,
                                                total, created_at, updated_at, is_deleted)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """, (itm[0], sale_id, itm[2], itm[3], itm[4],
                          itm[5], itm[6], itm[7], itm[8], itm[9],
                          itm[10], itm[11], itm[12]))
                    item_count += 1

            # Commit every 10 days to avoid huge transactions
            if day % 10 == 0:
                conn.commit()

        conn.commit()
        print(f"✅ Sales: {sale_count} created")
        print(f"✅ SaleItems: {item_count} created")

        # ── 8. StockMovements ────────────────────────────────────────
        mv_count = 0

        # a) Purchase movements (initial stock per store)
        for si_idx, sid in enumerate(store_ids):
            for pi, pid in enumerate(prod_ids):
                qty = random.randint(50, 300)
                cur.execute("""
                    INSERT INTO stock_movements (id, product_id, store_id, from_store_id,
                                                  quantity, movement_type, reference, notes,
                                                  performed_by, created_at, updated_at, is_deleted)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (uid(), pid, sid, None, qty, "purchase",
                      f"PO-{store_codes[si_idx]}-{prod_skus[pi]}",
                      "Initial stock purchase", admin_id,
                      START_DATE + timedelta(hours=random.randint(1, 24)),
                      START_DATE + timedelta(hours=random.randint(1, 24)),
                      False))
                mv_count += 1

        # b) Sale-linked movements (~200)
        sampled = random.sample(sale_refs, min(200, len(sale_refs)))
        for (s_id, s_sid, s_uid, s_dt, s_inv) in sampled:
            pid = random.choice(prod_ids)
            cur.execute("""
                INSERT INTO stock_movements (id, product_id, store_id, from_store_id,
                                              quantity, movement_type, reference, notes,
                                              performed_by, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (uid(), pid, s_sid, None, -random.randint(1, 5), "sale",
                  s_inv, None, s_uid, s_dt, s_dt, False))
            mv_count += 1

        # c) Adjustments (~30)
        for _ in range(30):
            cur.execute("""
                INSERT INTO stock_movements (id, product_id, store_id, from_store_id,
                                              quantity, movement_type, reference, notes,
                                              performed_by, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (uid(), random.choice(prod_ids), random.choice(store_ids), None,
                  random.randint(-10, 10), "adjustment", None, "Stock count correction",
                  admin_id, rand_dt(), rand_dt(), False))
            mv_count += 1

        # d) Transfers (~20 pairs)
        for _ in range(20):
            pid = random.choice(prod_ids)
            src_i, dst_i = random.sample(range(len(store_ids)), 2)
            qty = random.randint(5, 30)
            dt = rand_dt()
            ref = f"TRF-{store_codes[src_i]}-{store_codes[dst_i]}"

            cur.execute("""
                INSERT INTO stock_movements (id, product_id, store_id, from_store_id,
                                              quantity, movement_type, reference, notes,
                                              performed_by, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (uid(), pid, store_ids[src_i], None, -qty, "transfer_out",
                  ref, f"Transfer to {STORE_DATA[dst_i]['name']}", admin_id, dt, dt, False))
            cur.execute("""
                INSERT INTO stock_movements (id, product_id, store_id, from_store_id,
                                              quantity, movement_type, reference, notes,
                                              performed_by, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (uid(), pid, store_ids[dst_i], store_ids[src_i], qty, "transfer_in",
                  ref, f"Transfer from {STORE_DATA[src_i]['name']}", admin_id, dt, dt, False))
            mv_count += 2

        # e) Returns (~15)
        for _ in range(15):
            cur.execute("""
                INSERT INTO stock_movements (id, product_id, store_id, from_store_id,
                                              quantity, movement_type, reference, notes,
                                              performed_by, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (uid(), random.choice(prod_ids), random.choice(store_ids), None,
                  random.randint(1, 5), "return", None, "Customer return",
                  random.choice(user_ids), rand_dt(), rand_dt(), False))
            mv_count += 1

        conn.commit()
        print(f"✅ StockMovements: {mv_count} created")

        # ── 9. SyncLogs ──────────────────────────────────────────────
        action_types = ["create_sale", "update_product", "adjust_stock", "create_sale", "create_sale"]
        entity_types = ["sale",        "product",        "inventory",    "sale",        "sale"]
        statuses     = ["completed", "completed", "completed", "completed", "failed", "pending"]
        sl_count = 0

        for _ in range(50):
            sid = random.choice(store_ids)
            ai = random.randint(0, len(action_types) - 1)
            status = random.choice(statuses)
            dt = rand_dt()
            import json
            cur.execute("""
                INSERT INTO sync_logs (id, client_id, action_type, entity_type, entity_id,
                                        client_entity_id, payload, status, error_message,
                                        retries, resolved_at, organization_id, store_id,
                                        user_id, created_at, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (uid(), str(uuid.uuid4()), action_types[ai], entity_types[ai],
                  uid(), str(uuid.uuid4()),
                  json.dumps({"synced": True, "source": "offline_client"}),
                  status,
                  "Conflict detected on invoice number" if status == "failed" else None,
                  random.randint(0, 3) if status == "failed" else 0,
                  dt.isoformat() if status == "completed" else None,
                  org_id, sid, random.choice(user_ids),
                  dt, dt, False))
            sl_count += 1

        conn.commit()
        print(f"✅ SyncLogs: {sl_count} created")

        # ── Summary ──────────────────────────────────────────────────
        print(f"\n🎉 Seeding complete!")
        print(f"   Organization:    1")
        print(f"   Stores:          {len(store_ids)}")
        print(f"   Users:           {len(user_ids)} (1 admin + 5 managers + 15 cashiers)")
        print(f"   Categories:      {len(cat_ids)}")
        print(f"   Products:        {len(prod_ids)}")
        print(f"   Inventory rows:  {inv_count}")
        print(f"   Sales:           {sale_count}")
        print(f"   Sale items:      {item_count}")
        print(f"   Stock movements: {mv_count}")
        print(f"   Sync logs:       {sl_count}")
        print(f"\n   🔑 Admin:    admin@retailpos.com / {PASSWORD}")
        print(f"   🔑 Managers: manager1@retailpos.com … manager5@retailpos.com / {PASSWORD}")
        print(f"   🔑 Cashiers: cashier1@retailpos.com … cashier15@retailpos.com / {PASSWORD}")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    seed()
