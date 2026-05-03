-- =============================================================================
-- Daily Grocer — UK Convenience Store Product Seed
-- Modeled on Snappy Shopper's product taxonomy & UK convenience store catalog
-- Compatible with Daily Grocer schema (organizations, stores, categories,
-- products, inventory tables)
--
-- Usage:
--   1. Run AFTER your alembic migrations and /auth/setup bootstrap
--   2. Replace ORG_ID and STORE_IDs with your actual UUIDs (see bottom)
--   3. psql -U pos_user -d pos_db -f snappy_shopper_seed.sql
--
-- Pricing: UK retail convenience store RRP (GBP), May 2026
-- Barcodes: Real EAN-13 format for major UK brands
-- Cost prices: ~55-65% of selling price (typical convenience margin)
-- Images: Unsplash public domain URLs (swap for your CDN)
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 0: Configuration — update these to match your deployment
-- =============================================================================

DO $$
DECLARE
    v_org_id    UUID;
    v_store1    UUID;  -- e.g. Family Shopper / Sheffield
    v_store2    UUID;  -- e.g. Go Local / South Shields
    v_store3    UUID;  -- e.g. Premier / Goole
    v_store4    UUID;  -- e.g. Stocksfield Village

    -- Category IDs
    cat_fresh       UUID;
    cat_bakery      UUID;
    cat_dairy       UUID;
    cat_meat        UUID;
    cat_frozen      UUID;
    cat_pantry      UUID;
    cat_snacks      UUID;
    cat_beverages   UUID;
    cat_alcohol     UUID;
    cat_household   UUID;
    cat_health      UUID;
    cat_baby        UUID;
    cat_petfood     UUID;
    cat_tobacco     UUID;
    cat_world       UUID;
    cat_seasonal    UUID;

BEGIN
    -- Fetch org and store IDs from existing data
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    SELECT id INTO v_store1 FROM stores ORDER BY created_at ASC LIMIT 1 OFFSET 0;
    SELECT id INTO v_store2 FROM stores ORDER BY created_at ASC LIMIT 1 OFFSET 1;
    SELECT id INTO v_store3 FROM stores ORDER BY created_at ASC LIMIT 1 OFFSET 2;
    SELECT id INTO v_store4 FROM stores ORDER BY created_at ASC LIMIT 1 OFFSET 3;

    -- ==========================================================================
    -- STEP 1: CATEGORIES  (16 top-level, matching Snappy Shopper taxonomy)
    -- ==========================================================================
    
    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Fresh Produce', 'Fresh fruits, vegetables and salads', 1, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Fresh Produce' AND organization_id = v_org_id);
    SELECT id INTO cat_fresh FROM categories WHERE name = 'Fresh Produce' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Bakery', 'Freshly baked bread, rolls, pastries and cakes', 2, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bakery' AND organization_id = v_org_id);
    SELECT id INTO cat_bakery FROM categories WHERE name = 'Bakery' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Dairy & Eggs', 'Milk, cheese, butter, yogurt and eggs', 3, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dairy & Eggs' AND organization_id = v_org_id);
    SELECT id INTO cat_dairy FROM categories WHERE name = 'Dairy & Eggs' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Meat & Poultry', 'Fresh and chilled meat, poultry and fish', 4, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Meat & Poultry' AND organization_id = v_org_id);
    SELECT id INTO cat_meat FROM categories WHERE name = 'Meat & Poultry' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Frozen Food', 'Frozen meals, ice cream, chips and vegetables', 5, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Frozen Food' AND organization_id = v_org_id);
    SELECT id INTO cat_frozen FROM categories WHERE name = 'Frozen Food' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Pantry & Tins', 'Pasta, rice, tinned goods, oils, condiments and spices', 6, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pantry & Tins' AND organization_id = v_org_id);
    SELECT id INTO cat_pantry FROM categories WHERE name = 'Pantry & Tins' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Crisps & Snacks', 'Crisps, popcorn, nuts, biscuits and confectionery', 7, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Crisps & Snacks' AND organization_id = v_org_id);
    SELECT id INTO cat_snacks FROM categories WHERE name = 'Crisps & Snacks' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Soft Drinks & Juice', 'Fizzy drinks, juices, water, energy drinks and squash', 8, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Soft Drinks & Juice' AND organization_id = v_org_id);
    SELECT id INTO cat_beverages FROM categories WHERE name = 'Soft Drinks & Juice' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Alcohol', 'Beer, wine, spirits, cider and premixed drinks', 9, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Alcohol' AND organization_id = v_org_id);
    SELECT id INTO cat_alcohol FROM categories WHERE name = 'Alcohol' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Household & Cleaning', 'Cleaning products, laundry, kitchen roll and bin bags', 10, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Household & Cleaning' AND organization_id = v_org_id);
    SELECT id INTO cat_household FROM categories WHERE name = 'Household & Cleaning' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Health & Beauty', 'Medicines, toiletries, vitamins and first aid', 11, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Health & Beauty' AND organization_id = v_org_id);
    SELECT id INTO cat_health FROM categories WHERE name = 'Health & Beauty' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Baby & Toddler', 'Nappies, formula, baby food and wipes', 12, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Baby & Toddler' AND organization_id = v_org_id);
    SELECT id INTO cat_baby FROM categories WHERE name = 'Baby & Toddler' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Pet Food & Accessories', 'Dog, cat and small animal food and accessories', 13, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pet Food & Accessories' AND organization_id = v_org_id);
    SELECT id INTO cat_petfood FROM categories WHERE name = 'Pet Food & Accessories' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Tobacco & Vaping', 'Cigarettes, rolling tobacco and vaping products', 14, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Tobacco & Vaping' AND organization_id = v_org_id);
    SELECT id INTO cat_tobacco FROM categories WHERE name = 'Tobacco & Vaping' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'World Foods', 'Asian, Caribbean, Eastern European and world cuisine', 15, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'World Foods' AND organization_id = v_org_id);
    SELECT id INTO cat_world FROM categories WHERE name = 'World Foods' AND organization_id = v_org_id LIMIT 1;

    INSERT INTO categories (id, organization_id, name, description, sort_order, created_at, updated_at, is_deleted)
    SELECT gen_random_uuid(), v_org_id, 'Seasonal & Offers', 'Seasonal items and featured promotions', 16, now(), now(), false
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Seasonal & Offers' AND organization_id = v_org_id);
    SELECT id INTO cat_seasonal FROM categories WHERE name = 'Seasonal & Offers' AND organization_id = v_org_id LIMIT 1;

    -- ==========================================================================
    -- STEP 2: PRODUCTS
    -- ==========================================================================

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_fresh, 'Gala Apples (6 Pack)',              'Sweet and crisp British gala apples, 6 per pack',              'FRESH-001', '5016111146372', 1.10, 1.85, 0, 'pack',  15, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Fairtrade Bananas (5 Pack)',        'Fairtrade certified bananas, bunch of 5',                      'FRESH-002', '5017377820259', 0.70, 1.15, 0, 'bunch', 20, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Loose Carrots (1kg)',               'British farm-fresh loose carrots, 1kg bag',                    'FRESH-003', '5014623237526', 0.40, 0.65, 0, 'kg',    20, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Broccoli Crown (350g)',             'Tenderstem broccoli crown, 350g',                              'FRESH-004', '5010112204116', 0.50, 0.80, 0, 'pcs',   15, 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Baby Spinach (200g)',               'Washed and ready to eat baby spinach leaves, 200g',            'FRESH-005', '5014278100543', 0.90, 1.50, 0, 'pack',  15, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Vine Tomatoes (500g)',              'Classic vine-ripened tomatoes on the vine, 500g',              'FRESH-006', '5010162430082', 0.70, 1.20, 0, 'pack',  15, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'White Mushrooms (300g)',            'Closed cup white mushrooms, 300g pack',                        'FRESH-007', '5010162403437', 0.55, 0.90, 0, 'pack',  15, 'https://images.unsplash.com/photo-1506802913710-39e75e8ee91a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Cucumber (Each)',                   'Full-length fresh cucumber, each',                             'FRESH-008', '5010162430365', 0.40, 0.65, 0, 'pcs',   20, 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Iceberg Lettuce (Each)',            'Crisp iceberg lettuce, whole head',                            'FRESH-009', '5010162430396', 0.45, 0.75, 0, 'pcs',   15, 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Red Peppers (3 Pack)',              'Sweet red bell peppers, 3 pack',                               'FRESH-010', '5013529400613', 0.85, 1.45, 0, 'pack',  15, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Sweet Potatoes (750g)',             'Unwashed sweet potatoes, 750g loose bag',                      'FRESH-011', '5014623211748', 0.65, 1.10, 0, 'pack',  15, 'https://images.unsplash.com/photo-1596135291168-5a6d2aad7a9a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'White Potatoes (2kg)',              'British Maris Piper white potatoes, 2kg',                      'FRESH-012', '5010162411433', 0.80, 1.35, 0, 'bag',   15, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Courgettes (2 Pack)',               'Fresh British courgettes, 2 per pack',                         'FRESH-013', '5010162430341', 0.50, 0.85, 0, 'pack',  15, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Conference Pears (4 Pack)',         'Sweet conference pears, 4 per pack',                           'FRESH-014', '5016111146389', 0.90, 1.50, 0, 'pack',  15, 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Strawberries (400g)',               'British strawberries, 400g punnet',                            'FRESH-015', '5010162070077', 1.20, 2.00, 0, 'punnet',10, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Blueberries (150g)',                'Fresh blueberries, 150g punnet',                               'FRESH-016', '5010162025015', 0.90, 1.65, 0, 'punnet',10, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Avocado (Each)',                    'Ready to eat ripe avocado, each',                              'FRESH-017', '5000168005233', 0.55, 0.95, 0, 'pcs',   15, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Flat Mushrooms (4 Pack)',           'Large flat mushrooms, 4 per pack, great for grilling',         'FRESH-018', '5010162403574', 0.65, 1.10, 0, 'pack',  15, 'https://images.unsplash.com/photo-1478476868527-002ae3f3e159?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Leeks (Each)',                      'Fresh British leek, each',                                     'FRESH-019', '5010162430402', 0.30, 0.55, 0, 'pcs',   20, 'https://images.unsplash.com/photo-1584715787777-d8a97c72d22b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Spring Onions (Bunch)',             'Bunch of fresh spring onions',                                 'FRESH-020', '5010162403444', 0.30, 0.55, 0, 'bunch', 20, 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Garlic Bulb (3 Pack)',              'Fresh garlic bulbs, 3 per pack',                               'FRESH-021', '5010162430310', 0.40, 0.70, 0, 'pack',  20, 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Lemon (4 Pack)',                    'Unwaxed lemons, 4 pack',                                       'FRESH-022', '5010162430419', 0.50, 0.90, 0, 'pack',  15, 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Mixed Salad (120g)',                'Ready to eat mixed leaf salad, 120g bag',                      'FRESH-023', '5010162025022', 0.55, 0.95, 0, 'bag',   15, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Grapes Green Seedless (500g)',      'Seedless green grapes, 500g punnet',                           'FRESH-024', '5010162025039', 1.00, 1.75, 0, 'punnet',15, 'https://images.unsplash.com/photo-1423248160288-0d4239c3b1cc?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_fresh, 'Parsnips (500g)',                   'British parsnips, 500g loose bag',                             'FRESH-025', '5014623237533', 0.45, 0.80, 0, 'pack',  15, 'https://images.unsplash.com/photo-1617692855027-33b14f061079?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_bakery, 'Warburtons Medium White Sliced (800g)',   'Soft white medium sliced bread, 800g loaf',               'BAKE-001', '5010044001645', 0.85, 1.40, 0, 'loaf', 15, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Hovis Wholemeal Medium Sliced (800g)',    'Wholemeal medium sliced bread, 800g',                     'BAKE-002', '5010044001690', 0.85, 1.40, 0, 'loaf', 15, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'All-Butter Croissants (4 Pack)',          'All-butter flaky croissants, 4 pack',                     'BAKE-003', '5000168095235', 1.50, 2.50, 20, 'pack', 10, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'French Baguette (Each)',                  'Classic white French baguette, each',                     'BAKE-004', '5017379100037', 0.45, 0.80, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1597079910443-60c43fc4f729?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Warburtons Crumpets (6 Pack)',             'Thick and doughy crumpets, 6 pack',                       'BAKE-005', '5010044001805', 0.65, 1.10, 0, 'pack', 15, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Tiger Bloomer White (800g)',               'Crusty tiger-topped white bloomer, 800g',                 'BAKE-006', '5010044003434', 0.90, 1.55, 0, 'loaf', 15, 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Chocolate Fudge Cake (Each)',              'Rich chocolate fudge celebration cake',                   'BAKE-007', '5000168130225', 2.00, 3.50, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Greggs Sausage Roll (Each)',               'Classic pork sausage roll, freshly baked',                'BAKE-008', '5060219420017', 0.60, 1.05, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Scotch Pancakes (8 Pack)',                 'Golden drop scones/pancakes, 8 pack',                     'BAKE-009', '5010044003502', 0.60, 1.00, 0, 'pack', 15, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Pain au Chocolat (4 Pack)',                'Flaky pastry filled with chocolate, 4 pack',              'BAKE-010', '5000168095242', 1.50, 2.50, 20, 'pack', 10, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Warburtons Seeded Batch (400g)',           'Seeded batch loaf, 400g',                                 'BAKE-011', '5010044004393', 0.75, 1.25, 0, 'loaf', 15, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Hot Cross Buns (4 Pack)',                  'Traditional fruited hot cross buns, 4 pack',              'BAKE-012', '5010044001812', 0.70, 1.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1616951396464-7c8c0b3cdb6e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Iced Finger Buns (4 Pack)',                'Soft finger buns with white icing, 4 pack',               'BAKE-013', '5000168130232', 0.80, 1.35, 20, 'pack', 10, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Naan Bread (2 Pack)',                      'Plain naan bread, 2 per pack',                            'BAKE-014', '5010044003526', 0.50, 0.90, 0, 'pack', 15, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_bakery, 'Warburtons Thick White Rolls (6 Pack)',   'Thick white bread rolls, 6 pack',                         'BAKE-015', '5010044001829', 0.75, 1.25, 0, 'pack', 15, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_dairy, 'Cravendale Semi-Skimmed Milk (2L)',        '2L filtered fresh semi-skimmed milk',                     'DAIRY-001', '5010237025048', 1.05, 1.70, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Cravendale Whole Milk (2L)',               '2L filtered fresh whole milk',                            'DAIRY-002', '5010237025055', 1.10, 1.80, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Cravendale Skimmed Milk (2L)',             '2L filtered skimmed milk',                                'DAIRY-003', '5010237025062', 0.95, 1.60, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Cravendale Semi-Skimmed Milk (4 Pint)',    '4-pint filtered semi-skimmed milk',                       'DAIRY-004', '5010237025079', 1.70, 2.80, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'British Free Range Eggs (6 Medium)',       '6 British free range medium eggs',                        'DAIRY-005', '5013646003122', 1.10, 1.85, 0, 'pack', 20, 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'British Free Range Eggs (12 Large)',       '12 British free range large eggs',                        'DAIRY-006', '5013646003139', 2.00, 3.40, 0, 'pack', 15, 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Anchor Salted Butter (250g)',              'New Zealand butter, lightly salted, 250g block',          'DAIRY-007', '5010321110236', 1.50, 2.50, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Lurpak Spreadable Slightly Salted (250g)', 'Spreadable butter blend, 250g',                           'DAIRY-008', '5740900501091', 1.60, 2.70, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Cathedral City Mature Cheddar (400g)',     'Rich and creamy mature cheddar cheese, 400g',             'DAIRY-009', '5010707006136', 2.20, 3.65, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Philadelphia Original Cream Cheese (180g)','Original cream cheese spread, 180g',                     'DAIRY-010', '7622210022677', 1.00, 1.75, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Danone Activia Strawberry Yogurt (4x125g)','Strawberry probiotic yogurt pots, 4x125g',               'DAIRY-011', '3033491052427', 1.20, 2.00, 0, 'pack', 15, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Müller Rice Vanilla (4x190g)',             'Vanilla rice pudding pots, 4x190g',                       'DAIRY-012', '5010228025220', 1.30, 2.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Ben & Jerry''s Cookie Dough (465ml)',      'Vanilla ice cream with cookie dough chunks, 465ml',       'DAIRY-013', '8711327592611', 3.00, 5.00, 20, 'pcs', 10, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Müller Corner Yogurt (6x135g)',            'Fruit corner yogurt multipack, 6x135g',                   'DAIRY-014', '5010228028023', 1.50, 2.50, 0, 'pack', 15, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Clover Dairy Spread (500g)',               'Light dairy spread, 500g tub',                            'DAIRY-015', '5021986053100', 1.15, 1.95, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Müller Light Vanilla Yogurt (4x175g)',     'Fat free vanilla yogurt, 4x175g',                         'DAIRY-016', '5010228025237', 1.00, 1.70, 0, 'pack', 15, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Eatlean Cheese Slices (200g)',             'High protein low fat cheese slices, 200g',                'DAIRY-017', '5060388281059', 1.50, 2.50, 0, 'pack', 10, 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_dairy, 'Alpro Oat Milk (1L)',                      'Barista oat milk alternative, 1L',                        'DAIRY-018', '5411188119470', 0.85, 1.50, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_meat, 'Chicken Breast Fillets (2 Pack)',           'British chicken breast fillets, 2 pack (approx 380g)',    'MEAT-001', '5019176280135', 2.80, 4.75, 0, 'pack', 10, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Chicken Thighs Boneless (500g)',            'British boneless skinless chicken thighs, 500g',          'MEAT-002', '5019176280142', 2.20, 3.65, 0, 'pack', 10, 'https://images.unsplash.com/photo-1598511796432-32a8b1e24e22?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'British Beef Mince 5% Fat (500g)',          'Extra lean British beef mince, 500g',                     'MEAT-003', '5019176120039', 2.80, 4.65, 0, 'pack', 10, 'https://images.unsplash.com/photo-1588168333986-50d8184b2288?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Unsmoked Back Bacon (300g)',                'British unsmoked back bacon, 8 rashers, 300g',            'MEAT-004', '5010119033614', 1.90, 3.15, 0, 'pack', 10, 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Smoked Streaky Bacon (200g)',               'Smoked streaky bacon rashers, 200g',                      'MEAT-005', '5010119033621', 1.55, 2.60, 0, 'pack', 10, 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Lincolnshire Pork Sausages (8 Pack)',       'Traditional Lincolnshire pork sausages, 454g, 8 pack',    'MEAT-006', '5010119120351', 1.65, 2.75, 0, 'pack', 10, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Pork Loin Chops (2 Pack)',                  'British pork loin chops, 2 pack (approx 360g)',           'MEAT-007', '5019176320596', 2.30, 3.85, 0, 'pack', 10, 'https://images.unsplash.com/photo-1558030137-a56c1b004fa5?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Beef Rump Steak (2 Pack)',                  'British beef rump steaks, 2 pack (approx 340g)',          'MEAT-008', '5019176230284', 3.50, 5.85, 0, 'pack', 10, 'https://images.unsplash.com/photo-1558030137-a56c1b004fa5?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Diced Beef Casserole Steak (400g)',         'British diced beef for slow cooking, 400g',               'MEAT-009', '5019176230291', 2.50, 4.15, 0, 'pack', 10, 'https://images.unsplash.com/photo-1588168333986-50d8184b2288?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Wafer-Thin Ham (140g)',                     'Honey-roasted wafer thin ham slices, 140g',               'MEAT-010', '5010119060818', 1.05, 1.75, 0, 'pack', 15, 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Smoked Salmon (100g)',                      'Scottish smoked salmon slices, 100g pack',                'MEAT-011', '5010119090142', 2.80, 4.65, 0, 'pack', 10, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_meat, 'Pepperoni Slices (70g)',                    'Pizza-style pepperoni slices, 70g pack',                  'MEAT-012', '5010119032167', 1.00, 1.70, 0, 'pack', 15, 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_frozen, 'McCain Oven Chips Straight (900g)',        'Classic straight cut oven chips, 900g',                  'FROZ-001', '5012427018030', 1.30, 2.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1573082891205-f495af91ad8d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Birds Eye Garden Peas (900g)',             'Sweet garden peas, freezer bag, 900g',                   'FROZ-002', '5010119053964', 1.05, 1.75, 0, 'bag',  15, 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Dr. Oetker Ristorante Pepperoni Pizza',   'Thin & crispy pepperoni pizza, 330g',                    'FROZ-003', '4001724819370', 1.40, 2.40, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Chicago Town Deep Dish Pepperoni (2 Pack)','Deep dish pepperoni mini pizzas, 2 pack 270g',           'FROZ-004', '5060327420061', 1.15, 1.95, 20, 'pack', 10, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Youngs Chip Shop Battered Cod (4 Fillets)','Battered cod fillets, chip shop style, 4 pack',         'FROZ-005', '5010119012818', 2.10, 3.50, 0, 'pack', 10, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'McCain Hash Browns (500g)',               'Crispy hash brown potato patties, 500g',                 'FROZ-006', '5012427019617', 1.00, 1.70, 0, 'pack', 15, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Birds Eye Fish Fingers (12 Pack)',        'Classic fish fingers, 12 pack 336g',                     'FROZ-007', '5010119054749', 1.70, 2.85, 0, 'pack', 10, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Aunt Bessie''s Yorkshire Puddings (12pk)','Classic Yorkshire puddings, 12 pack 190g',               'FROZ-008', '5010354901614', 1.00, 1.70, 0, 'pack', 15, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Haagen-Dazs Vanilla Ice Cream (460ml)',  'Classic vanilla ice cream, 460ml tub',                   'FROZ-009', '3415581063498', 2.50, 4.25, 20, 'pcs', 10, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Ben & Jerry''s Phish Food (465ml)',       'Fudge fish & caramel swirl ice cream, 465ml',            'FROZ-010', '8711327592697', 3.00, 5.00, 20, 'pcs', 10, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Walls Twister Lollies (10 Pack)',         'Strawberry & lemon flavour lollies, 10 pack',            'FROZ-011', '5000159461832', 2.00, 3.35, 20, 'pack', 10, 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Birds Eye Chicken Dippers (30 Pack)',     'Crispy breaded chicken dippers, 30 pack 600g',           'FROZ-012', '5010119036769', 2.50, 4.15, 0, 'pack', 10, 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Linda McCartney Vegetarian Sausages (6pk)','Vegetarian sausages, 6 pack 300g',                      'FROZ-013', '5033601001088', 1.50, 2.50, 0, 'pack', 10, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_frozen, 'Quorn Meat Free Mince (500g)',            'Meat-free mycoprotein mince, 500g',                      'FROZ-014', '5017637008079', 1.50, 2.50, 0, 'pack', 10, 'https://images.unsplash.com/photo-1588168333986-50d8184b2288?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_pantry, 'Napolina Penne Pasta (500g)',             'Durum wheat penne pasta, 500g',                          'PANT-001', '5010215239107', 0.40, 0.70, 0, 'pack', 20, 'https://images.unsplash.com/photo-1551462147-37885acc3c41?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Tilda Basmati Rice (1kg)',                'Pure basmati rice, 1kg',                                  'PANT-002', '5011157512419', 1.10, 1.85, 0, 'pack', 20, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Heinz Baked Beans (415g)',                'Heinz baked beans in tomato sauce, 415g tin',            'PANT-003', '5000157023206', 0.38, 0.65, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1595123550441-df232b5accc1?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Heinz Cream of Tomato Soup (400g)',       'Classic cream of tomato soup, 400g tin',                  'PANT-004', '5000157147605', 0.42, 0.75, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Napolina Chopped Tomatoes (400g)',        'Italian chopped tomatoes in tomato juice, 400g',          'PANT-005', '5010215204908', 0.32, 0.55, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1590422502859-99ff63de0f0d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'John West Tuna Chunks in Brine (3x145g)', 'Tuna chunks in brine, 3-pack, 3x145g',                  'PANT-006', '5018374129516', 1.45, 2.45, 0, 'pack', 20, 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Filippo Berio Extra Virgin Olive Oil (500ml)', 'Extra virgin olive oil, 500ml bottle',              'PANT-007', '8002578001843', 2.80, 4.65, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Kikkoman Soy Sauce (150ml)',              'Japanese naturally brewed soy sauce, 150ml',              'PANT-008', '4004371001054', 0.80, 1.40, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Heinz Tomato Ketchup (460g)',             'Classic tomato ketchup, 460g squeezy bottle',            'PANT-009', '5000157007268', 0.95, 1.60, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1558887930-4c74804ec9e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Hellmann''s Real Mayonnaise (200ml)',     'Original real mayonnaise, 200ml squeezy',                'PANT-010', '5000184009955', 0.80, 1.35, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1584255014406-2a68ea38e48c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Marmite Yeast Extract (125g)',            'Iconic yeast extract spread, 125g jar',                  'PANT-011', '5000157002751', 1.30, 2.15, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Baxters Scotch Broth Soup (400g)',        'Traditional scotch broth soup, 400g tin',                'PANT-012', '5000168016027', 0.60, 1.00, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Branston Pickle (360g)',                  'Original tangy chunky pickle, 360g jar',                 'PANT-013', '5000184001577', 0.90, 1.55, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Sharwood''s Tikka Masala Sauce (420g)',   'Tikka masala cooking sauce, 420g jar',                   'PANT-014', '5000171091004', 1.00, 1.65, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Dolmio Bolognese Pasta Sauce (500g)',     'Original bolognese pasta sauce, 500g jar',               'PANT-015', '5000168026231', 0.85, 1.45, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Napolina Spaghetti (500g)',               'Durum wheat spaghetti, 500g',                            'PANT-016', '5010215239084', 0.40, 0.70, 0, 'pack', 20, 'https://images.unsplash.com/photo-1551462147-37885acc3c41?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Schwartz Black Pepper Grinder',          'Black pepper corns in a refillable grinder',             'PANT-017', '5011203007007', 1.10, 1.85, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1560622540-1a5532e5a11d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Bisto Best Beef Gravy Granules (190g)',   'Rich beef gravy granules, 190g tub',                     'PANT-018', '5000168010773', 1.30, 2.20, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Cow & Gate Porridge Oats (750g)',         'Scottish rolled oats, 750g',                             'PANT-019', '5010100073503', 0.65, 1.10, 0, 'pack', 15, 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_pantry, 'Weetabix (24 Pack)',                      'Classic wholegrain wheat biscuits, 24 pack',             'PANT-020', '5010029000152', 1.30, 2.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1571748982800-fa51082c2224?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_snacks, 'Walkers Ready Salted Crisps (6 Pack)',    'Classic ready salted crisps, 6x25g multipack',           'SNCK-001', '5000328067564', 1.15, 1.95, 20, 'pack', 20, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Walkers Salt & Vinegar Crisps (6 Pack)',  'Salt & vinegar crisps, 6x25g multipack',                 'SNCK-002', '5000328067571', 1.15, 1.95, 20, 'pack', 20, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Pringles Original (165g)',                'Original salted Pringles, tall tube 165g',               'SNCK-003', '5053827164405', 1.20, 2.00, 20, 'pcs', 15, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Pringles Sour Cream & Onion (165g)',      'Sour cream & onion Pringles, 165g tube',                 'SNCK-004', '5053827164412', 1.20, 2.00, 20, 'pcs', 15, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'McCoy''s Flame Grilled Steak (6 Pack)',   'Ridged McCoy''s crisps, 6x45g multipack',                'SNCK-005', '5000328550011', 1.70, 2.85, 20, 'pack', 15, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Cadbury Dairy Milk (95g)',                'Iconic milk chocolate bar, 95g',                         'SNCK-006', '7622210111661', 0.65, 1.15, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'KitKat 4-Finger (41.5g)',                'Crisp wafer chocolate bar, classic 4-finger',            'SNCK-007', '5000159461627', 0.50, 0.90, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Haribo Starmix (180g)',                   'Classic Haribo gummy sweets mix, 180g bag',              'SNCK-008', '4001686325599', 0.70, 1.20, 20, 'pack', 20, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Maltesers (93g)',                         'Crunchy honeycomb malt balls in milk chocolate, 93g',   'SNCK-009', '5000159461788', 0.60, 1.10, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Cadbury Roses Tin (450g)',                'Assorted chocolate box in a gift tin, 450g',            'SNCK-010', '7622210110039', 3.50, 5.85, 20, 'pcs', 10, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'McVitie''s Digestive Biscuits (400g)',    'Classic wheat digestive biscuits, 400g pack',           'SNCK-011', '5000168021090', 0.65, 1.10, 20, 'pack', 20, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'McVitie''s Jaffa Cakes (12 Pack)',        'Orange jelly & dark chocolate sponge cakes, 12pk',      'SNCK-012', '5000168012234', 0.70, 1.20, 20, 'pack', 20, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Oreo Original (154g)',                    'Classic chocolate sandwich cookies, 154g pack',         'SNCK-013', '7622210113214', 0.75, 1.30, 20, 'pack', 20, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Snickers (48g)',                          'Caramel peanut and nougat chocolate bar, 48g',          'SNCK-014', '5000159461696', 0.40, 0.75, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Walkers Max Strong Crisps (6 Pack)',      'Intense flavour ridged crisps, 6x50g multipack',        'SNCK-015', '5000328591059', 1.70, 2.85, 20, 'pack', 15, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Doritos Chilli Heatwave (150g)',          'Spicy chilli tortilla chips, 150g sharing bag',         'SNCK-016', '5000328073107', 1.00, 1.70, 20, 'pack', 15, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Quaker Oat So Simple Porridge (8pk)',     'Oat porridge sachets, 8 pack original',                 'SNCK-017', '5000232555069', 1.30, 2.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_snacks, 'Kellogg''s Special K (500g)',             'Original red berry cereal, 500g box',                   'SNCK-018', '5010029017273', 1.30, 2.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1571748982800-fa51082c2224?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_beverages, 'Coca-Cola Original (330ml Can)',          'Classic Coca-Cola, 330ml can',                          'BEV-001', '5449000000996', 0.50, 0.95, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Coca-Cola Original (6x330ml Cans)',       'Classic Coca-Cola multipack, 6x330ml cans',             'BEV-002', '5449000214119', 2.50, 4.20, 20, 'pack', 15, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Coca-Cola Zero Sugar (330ml Can)',        'Zero sugar Coca-Cola, 330ml can',                       'BEV-003', '5449000131836', 0.50, 0.95, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Pepsi Max (330ml Can)',                   'Maximum taste, no sugar Pepsi, 330ml can',              'BEV-004', '5000112636542', 0.48, 0.90, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Sprite (330ml Can)',                      'Lemon & lime sparkling drink, 330ml can',               'BEV-005', '5449000214652', 0.50, 0.90, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Red Bull Energy Drink (250ml)',           'Original energy drink, 250ml can',                      'BEV-006', '9002490100070', 0.80, 1.55, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Monster Energy Original (500ml)',         'Original green monster energy, 500ml can',              'BEV-007', '5060517882046', 0.90, 1.65, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Lucozade Energy Original (500ml)',        'Glucose energy drink, original, 500ml bottle',         'BEV-008', '5000128069908', 0.75, 1.40, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Tropicana Orange Smooth (850ml)',         'Squeezed orange juice smooth, not from concentrate',    'BEV-009', '5010329536794', 1.25, 2.10, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1613478202669-487bc5f77a2e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Ribena Blackcurrant Squash (600ml)',      'No added sugar blackcurrant squash, 600ml',             'BEV-010', '5000159464054', 0.95, 1.60, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1568284424968-f944ff1e11a1?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Evian Still Water (1.5L)',               'Natural still mineral water, 1.5L bottle',              'BEV-011', '3068320058752', 0.55, 1.00, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Highland Spring Sparkling Water (750ml)',  'Scottish sparkling water, 750ml glass bottle',          'BEV-012', '5010163001065', 0.60, 1.10, 20, 'pcs', 15, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Tetley Original Tea Bags (80 Pack)',      'Classic British tea bags, 80 pack',                     'BEV-013', '5018374200239', 1.20, 2.00, 0, 'pack', 15, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Nescafé Gold Original Instant (200g)',   'Rich smooth instant coffee, 200g jar',                  'BEV-014', '5000118217200', 2.80, 4.65, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Irn-Bru Original (330ml Can)',           'Scotland''s iconic fizzy drink, 330ml can',             'BEV-015', '5010251021017', 0.48, 0.90, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Fanta Orange (330ml Can)',               'Sparkling orange flavoured drink, 330ml can',           'BEV-016', '5449000214645', 0.48, 0.90, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Oasis Citrus Punch (500ml)',             'Citrus punch still juice drink, 500ml bottle',          'BEV-017', '5449000214997', 0.50, 0.95, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1568284424968-f944ff1e11a1?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_beverages, 'Kopparberg Strawberry & Lime (500ml)',   'Strawberry & lime fruit cider, 500ml bottle',           'BEV-018', '7317980018002', 1.10, 2.10, 20, 'pcs', 15, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800', true, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, age_restriction_type, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Stella Artois Lager (4x440ml Cans)',      'Belgian lager 5% ABV, 4 can pack',                      'ALC-001', '5410228213610', 3.00, 5.35, 20, 'pack', 15, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Carlsberg Lager (10x330ml Cans)',         'Classic Danish lager 3.8% ABV, 10 can pack',            'ALC-002', '5010168006701', 6.00, 10.00, 20, 'pack', 10, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Fosters Lager (4x440ml Cans)',            'Australian style lager 4% ABV, 4 can pack',             'ALC-003', '5010168012900', 3.00, 5.00, 20, 'pack', 15, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Guinness Draught (4x440ml Cans)',         'Smooth creamy Irish dry stout, 4.2% ABV, 4 pack',      'ALC-004', '5011347000140', 3.80, 6.50, 20, 'pack', 15, 'https://images.unsplash.com/photo-1516900557549-41557d405adf?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Corona Extra (6x330ml Bottles)',          'Mexican pale lager 4.5% ABV, 6 bottle pack',            'ALC-005', '5015406291185', 4.50, 7.50, 20, 'pack', 10, 'https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Peroni Nastro Azzurro (4x330ml Bottles)','Italian premium lager 5.1% ABV, 4 bottle pack',         'ALC-006', '8004160040004', 4.20, 7.00, 20, 'pack', 10, 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Budweiser (6x330ml Bottles)',             'American style lager 4.5% ABV, 6 bottle pack',          'ALC-007', '5010168004226', 3.80, 6.35, 20, 'pack', 10, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Jacob''s Creek Shiraz (75cl)',            'Australian Shiraz red wine 13.5% ABV, 75cl bottle',     'ALC-008', '9300727023415', 3.50, 6.00, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Jacob''s Creek Chardonnay (75cl)',        'Australian Chardonnay white wine 13%, 75cl bottle',     'ALC-009', '9300727023422', 3.50, 6.00, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Blossom Hill White Zinfandel Rosé (75cl)','California rosé wine 9% ABV, 75cl bottle',              'ALC-010', '5000327001543', 3.30, 5.50, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Prosecco Frizzante (75cl)',               'Italian sparkling wine 11% ABV, 75cl bottle',           'ALC-011', '8002270430006', 4.20, 7.00, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Gordon''s London Dry Gin (35cl)',         'London Dry Gin 37.5% ABV, 35cl bottle',                 'ALC-012', '5000289925037', 5.80, 9.65, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Smirnoff No.21 Vodka (35cl)',             'Triple distilled vodka 37.5% ABV, 35cl bottle',         'ALC-013', '5000281025030', 5.40, 9.00, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Jack Daniel''s Tennessee Whiskey (35cl)','Original Tennessee whiskey 40% ABV, 35cl',              'ALC-014', '5099873005569', 7.20, 12.00, 20, 'pcs', 10, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Bacardi Carta Blanca Rum (35cl)',         'White rum 37.5% ABV, 35cl bottle',                      'ALC-015', '5010677007801', 5.60, 9.35, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Rekorderlig Strawberry & Lime (500ml)',  'Swedish fruit cider 4% ABV, 500ml bottle',              'ALC-016', '7317981012006', 1.20, 2.15, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'WKD Blue (4x275ml Bottles)',             'Blue raspberry flavour alcopop 4% ABV, 4 pack',         'ALC-017', '5010327002843', 2.80, 4.65, 20, 'pack', 15, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Strongbow Dark Fruit (4x440ml Cans)',    'Mixed fruits cider 4% ABV, 4 can pack',                 'ALC-018', '5000028310217', 3.20, 5.35, 20, 'pack', 15, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Heineken Lager Beer (4x330ml Bottles)',  'Dutch premium lager 5% ABV, 4 bottle pack',             'ALC-019', '8711000010501', 3.60, 6.00, 20, 'pack', 15, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800', true, 'alcohol', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_alcohol, 'Newcastle Brown Ale (500ml Bottle)',     'Original Newcastle Brown Ale 4.7% ABV, 500ml',          'ALC-020', '5010168005421', 0.90, 1.55, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800', true, 'alcohol', now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_household, 'Fairy Original Washing Up Liquid (433ml)',   'Original green washing up liquid, 433ml',          'HOME-001', '8001841313085', 0.90, 1.55, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Dettol Original Antibacterial Spray (500ml)','Kills 99.9% of bacteria, 500ml spray',            'HOME-002', '5011417543795', 1.30, 2.20, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Flash All Purpose Cleaner (750ml)',           'Multi-surface cleaning spray, 750ml',             'HOME-003', '8001841297804', 1.00, 1.70, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Andrex Classic Clean Toilet Tissue (9 Roll)','Soft toilet tissue, 9 roll pack',                 'HOME-004', '5010477433002', 2.10, 3.50, 20, 'pack', 15, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Plenty Kitchen Roll (2 Roll)',               'Super absorbent kitchen roll, 2 pack',            'HOME-005', '5010477420445', 1.00, 1.70, 20, 'pack', 15, 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Ariel Original 3-in-1 Pods (15 Wash)',       'Washing machine detergent pods, 15 pack',         'HOME-006', '8006540541944', 3.20, 5.35, 20, 'pack', 10, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Domestos Original Bleach (750ml)',            'Thick bleach kills all known germs, 750ml',       'HOME-007', '8710447292174', 0.65, 1.10, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Vileda Supermocio 3 Action Mop Refill',       'Easy-wring mop replacement head',                 'HOME-008', '4023103108844', 2.50, 4.20, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Finish Dishwasher Tablets (28 Pack)',         'All-in-one dishwasher tablets, 28 pack',          'HOME-009', '5011417557280', 3.00, 5.00, 20, 'pack', 10, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Bold 2-in-1 Washing Powder (20 Wash)',        '2-in-1 laundry powder with softener, 20 wash',   'HOME-010', '8001841291987', 2.20, 3.65, 20, 'pack', 10, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Glad Bin Bags 30L (20 Pack)',                 'Strong pedal bin bags, 20 pack',                  'HOME-011', '5010477016086', 0.90, 1.55, 20, 'pack', 15, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Clingfilm (30m Roll)',                        'Multi-purpose cling film, 30m roll',              'HOME-012', '5010477011999', 0.70, 1.20, 20, 'roll', 15, 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Foil Wrap (10m Roll)',                        'Aluminium cooking foil, 10m roll',                'HOME-013', '5010477012002', 0.80, 1.35, 20, 'roll', 15, 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_household, 'Mr. Muscle Window & Glass Cleaner (500ml)',   'Streak-free window cleaner, 500ml spray',         'HOME-014', '5011417521861', 0.85, 1.45, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_health, 'Paracetamol 500mg Tablets (16 Pack)',        '500mg paracetamol pain relief tablets, 16 pack',    'HLTH-001', '5012335002207', 0.55, 0.95, 20, 'pack', 20, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Ibuprofen 200mg Tablets (16 Pack)',           '200mg ibuprofen anti-inflammatory tablets, 16 pack','HLTH-002', '5012335002214', 0.55, 0.95, 20, 'pack', 20, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Colgate Triple Action Toothpaste (100ml)',    'Triple action fluoride toothpaste, 100ml',          'HLTH-003', '8714789950150', 0.85, 1.45, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1559082828-d5b8ad7c7e1b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Dove Original Deodorant (150ml)',             'Classic Dove antiperspirant deodorant, 150ml',      'HLTH-004', '8717163515921', 1.20, 2.00, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1613987876445-fcdb0a530b8f?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Head & Shoulders Classic Clean (200ml)',      'Classic clean anti-dandruff shampoo, 200ml',        'HLTH-005', '8001090302830', 1.50, 2.50, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Durex Thin Feel Condoms (12 Pack)',            'Ultra thin condoms, 12 pack',                      'HLTH-006', '5012200330137', 4.00, 6.65, 20, 'pack', 10, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Always Ultra Normal Pads (12 Pack)',           'Ultra thin day pads with wings, 12 pack',          'HLTH-007', '8001841044200', 1.00, 1.75, 20, 'pack', 15, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Tampax Compak Regular (16 Pack)',              'Regular applicator tampons, 16 pack',              'HLTH-008', '4015400008521', 1.30, 2.20, 20, 'pack', 15, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Gillette Fusion5 Razor (1 Pack)',              'Gillette Fusion5 reusable razor handle, 1 pack',   'HLTH-009', '7702018388288', 3.50, 5.85, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1626197031507-c17099753214?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Rennie Tablets (24 Pack)',                     'Calcium carbonate antacid tablets, 24 pack',       'HLTH-010', '5060122160025', 0.85, 1.45, 20, 'pack', 15, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Vaseline Original Petroleum Jelly (50ml)',    'Original moisturising petroleum jelly, 50ml',      'HLTH-011', '8714100693384', 0.90, 1.55, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1559082828-d5b8ad7c7e1b?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_health, 'Sudocrem Antiseptic Healing Cream (60g)',     'Antiseptic healing cream, 60g tub',                'HLTH-012', '5012335046201', 1.60, 2.65, 20, 'pcs',  10, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_baby, 'Pampers Baby Dry Nappies Size 3 (31pk)',    'Baby dry nappies, size 3 (6-10kg), 31 pack',           'BABY-001', '4015400647294', 4.00, 6.85, 0, 'pack', 10, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'Huggies Pure Baby Wipes (56 Pack)',         'Gentle 99% water baby wipes, 56 pack',                 'BABY-002', '5029053548432', 0.95, 1.65, 0, 'pack', 15, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'Cow & Gate First Infant Milk (800g)',       'First infant formula from birth, 800g tin',            'BABY-003', '5010279618094', 5.50, 9.15, 0, 'pcs',  10, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'Ella''s Kitchen Organic Carrot & Apple',   'Organic stage 1 baby food pouch, 120g',                'BABY-004', '5060107030051', 0.65, 1.15, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'Hipp Organic Banana & Apple (4 Month)',     'Organic fruit purée from 4 months, 125g jar',          'BABY-005', '4062300210547', 0.60, 1.05, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'Sudocrem Baby Nappy Rash Cream (125g)',     'Soothing nappy rash cream, 125g',                      'BABY-006', '5012335046225', 2.50, 4.20, 0, 'pcs',  10, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'WaterWipes Sensitive Baby Wipes (60pk)',    '99.9% water sensitive wipes, 60 pack',                 'BABY-007', '5099514005698', 1.80, 3.00, 0, 'pack', 10, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_baby, 'Johnsons Baby Shampoo (300ml)',             'No more tears gentle baby shampoo, 300ml',             'BABY-008', '3574661436746', 1.50, 2.50, 0, 'pcs',  10, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_petfood, 'Pedigree Adult Beef Dry Dog Food (800g)',  'Complete dry dog food with beef, 800g bag',           'PET-001', '5998749104255', 2.00, 3.35, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Pedigree Wet Dog Food in Jelly (4x100g)',  'Wet dog food pouches in jelly, 4x100g multipack',    'PET-002', '5998749124567', 1.50, 2.50, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Whiskas Adult Tuna in Jelly (12x100g)',    'Wet cat food with tuna in jelly, 12x100g multipack', 'PET-003', '5998749124574', 3.00, 5.00, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Felix As Good As It Looks (12x100g)',      'Wet cat food with tuna & beef, 12x100g',             'PET-004', '5900951239946', 3.20, 5.35, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Whiskas Dry Cat Food Salmon (800g)',       'Complete dry cat food with salmon, 800g',             'PET-005', '5900951242021', 1.90, 3.15, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Pedigree DentaStix Daily Oral Care (7pk)', 'Teeth cleaning dog chews, 7 sticks pack',             'PET-006', '5998749108024', 1.50, 2.50, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Dreamies Cat Treats Mix (60g)',            'Crunchy cat treat mix, chicken & cheese, 60g',       'PET-007', '5900951022501', 0.70, 1.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Bakers Good Mix Adult Dog Food (1kg)',     'Complete dry dog food with vegetables, 1kg',          'PET-008', '5998749102220', 1.30, 2.20, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Cat Litter Fresh Step (2.72kg)',           'Clumping cat litter, odour control, 2.72kg',          'PET-009', '4006261213025', 2.50, 4.15, 0, 'pack', 10, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_petfood, 'Butcher''s Tripe Mix Wet Dog Food (400g)', 'Dog food with tripe, 400g tin',                       'PET-010', '5010234070041', 0.65, 1.10, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, age_restriction_type, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_tobacco, 'Clipper Lighter (Standard)',             'Standard disposable lighter, assorted colours',         'TOB-001', '3093369302020', 0.35, 0.99, 20, 'pcs',  20, 'https://images.unsplash.com/photo-1616170963413-24f3de73e8a4?w=800', false, 'tobacco', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_tobacco, 'Rizla Regular Blue Papers (50pk)',        'Regular blue cigarette rolling papers, 50 pack',       'TOB-002', '3026980010027', 0.35, 0.65, 20, 'pack', 20, 'https://images.unsplash.com/photo-1616170963413-24f3de73e8a4?w=800', true, 'tobacco', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_tobacco, 'Rizla Liquorice Rolling Papers (50pk)',   'Liquorice flavour rolling papers, 50 pack',            'TOB-003', '3026980072022', 0.35, 0.65, 20, 'pack', 20, 'https://images.unsplash.com/photo-1616170963413-24f3de73e8a4?w=800', true, 'tobacco', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_tobacco, 'Swan Extra Slim Filter Tips (165pk)',     'Extra slim cigarette filter tips, 165 pack',           'TOB-004', '5012169061346', 0.40, 0.75, 20, 'pack', 20, 'https://images.unsplash.com/photo-1616170963413-24f3de73e8a4?w=800', true, 'tobacco', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_tobacco, 'Vuse Go Disposable Vape (600 Puffs)',     'Vuse Go disposable e-cigarette, blueberry, 600 puff', 'TOB-005', '4028777268001', 3.50, 5.99, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1616170963413-24f3de73e8a4?w=800', true, 'tobacco', now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_tobacco, 'Elf Bar 600 Disposable Vape (600 Puffs)', 'Elf Bar 600 disposable vape, various flavours',        'TOB-006', '6925313761004', 3.50, 5.99, 20, 'pcs',  15, 'https://images.unsplash.com/photo-1616170963413-24f3de73e8a4?w=800', true, 'tobacco', now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO products (id, organization_id, category_id, name, description, sku, barcode, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, is_age_restricted, created_at, updated_at, is_deleted)
    VALUES
        (gen_random_uuid(), v_org_id, cat_world, 'Maggi Noodles Chicken Flavour (72g)',       'Instant noodles with chicken seasoning, 72g',           'WRLD-001', '7613032919290', 0.25, 0.45, 0, 'pcs',  20, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Pot Noodle Chicken & Mushroom (90g)',       'Snack pot noodle, chicken & mushroom, 90g',            'WRLD-002', '8710398185808', 0.50, 0.95, 20, 'pcs', 20, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Uncle Ben''s Long Grain Rice (500g)',       'Easy cook long grain white rice, 500g',                'WRLD-003', '5000118194945', 0.65, 1.10, 0, 'pack', 20, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Blue Dragon Sweet Chilli Sauce (190ml)',    'Sweet chilli dipping sauce, 190ml',                    'WRLD-004', '5020219001042', 0.70, 1.20, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Patak''s Tikka Paste (283g)',              'Authentic Indian tikka spice paste, 283g jar',         'WRLD-005', '5010024012204', 0.90, 1.55, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Amoy Straight-to-Wok Noodles (300g)',      'Pre-cooked wok-ready noodles, 300g',                   'WRLD-006', '5000168025951', 0.75, 1.30, 0, 'pack', 15, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Encona West Indian Hot Pepper Sauce (142ml)','Original hot pepper sauce, 142ml',                   'WRLD-007', '5019620900136', 0.85, 1.45, 0, 'pcs',  15, 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Batchelors Super Noodles Chicken (100g)',  'Quick cook flavoured noodles, chicken, 100g',          'WRLD-008', '5000308007380', 0.35, 0.65, 0, 'pack', 20, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Sharwood''s Egg Fried Rice (250g)',         'Ready to heat egg fried rice, 250g',                   'WRLD-009', '5000171095261', 0.75, 1.30, 0, 'pack', 15, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', false, now(), now(), false),
        (gen_random_uuid(), v_org_id, cat_world, 'Bisto Instant Mashed Potato (160g)',        'Instant potato powder, makes 4-6 portions, 160g',     'WRLD-010', '5000168004416', 0.70, 1.20, 0, 'pack', 15, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800', false, now(), now(), false)
    ON CONFLICT (sku) DO NOTHING;

    -- ==========================================================================
    -- STEP 3: INVENTORY — seed stock for all 4 stores
    -- ==========================================================================

    INSERT INTO inventory (id, product_id, store_id, quantity, reserved_quantity, created_at, updated_at, is_deleted)
    SELECT
        gen_random_uuid(),
        p.id,
        s.id,
        CASE
            WHEN c.name IN ('Alcohol', 'Tobacco & Vaping') THEN (20 + floor(random() * 60))::int
            WHEN c.name IN ('Fresh Produce', 'Bakery', 'Dairy & Eggs') THEN (40 + floor(random() * 80))::int
            ELSE (30 + floor(random() * 90))::int
        END,
        0,
        now(),
        now(),
        false
    FROM products p
    JOIN categories c ON c.id = p.category_id
    CROSS JOIN stores s
    WHERE p.organization_id = v_org_id
      AND s.organization_id = v_org_id
    ON CONFLICT (product_id, store_id) DO NOTHING;

END;
$$;

-- ==========================================================================
-- STEP 4: VERIFICATION QUERIES
-- ==========================================================================

SELECT c.name AS category, COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_deleted = false
GROUP BY c.name
ORDER BY c.name;

SELECT s.name AS store, COUNT(i.id) AS sku_count, SUM(i.quantity) AS total_units
FROM stores s
LEFT JOIN inventory i ON i.store_id = s.id
GROUP BY s.name
ORDER BY s.name;

SELECT name, category_id, selling_price, age_restriction_type
FROM products
WHERE is_age_restricted = true AND is_deleted = false
ORDER BY selling_price DESC;

SELECT COUNT(*) AS total_products FROM products WHERE is_deleted = false;

COMMIT;
