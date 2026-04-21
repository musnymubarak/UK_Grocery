--
-- PostgreSQL database dump
--

\restrict lMeGPhe0ekIt5MUYzsXVjizhcOYFnhSV3bReBNXFBNKCUAg4b8n2N2BaUPLp0WC

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    store_id uuid,
    user_id uuid,
    user_name character varying(255) NOT NULL,
    user_role character varying(50) NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(45),
    user_agent text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    organization_id uuid NOT NULL,
    store_id uuid,
    title character varying(255) NOT NULL,
    subtitle character varying(500),
    image_url character varying(500) NOT NULL,
    link_url character varying(500),
    "position" integer NOT NULL,
    is_active boolean NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    parent_id uuid,
    sort_order integer NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: coupon_redemptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupon_redemptions (
    coupon_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    order_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.coupon_redemptions OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    organization_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_order_value numeric(10,2),
    max_redemptions integer,
    current_redemptions integer NOT NULL,
    max_per_customer integer NOT NULL,
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    applicable_store_ids jsonb,
    applicable_category_ids jsonb,
    is_first_order_only boolean NOT NULL,
    is_combinable boolean NOT NULL,
    issued_to_customer_id uuid,
    source character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_addresses (
    customer_id uuid NOT NULL,
    label character varying(50),
    street text NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postcode character varying(20) NOT NULL,
    country character varying(100) NOT NULL,
    lat numeric(10,7),
    lng numeric(10,7),
    is_default boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO postgres;

--
-- Name: customer_monthly_spends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_monthly_spends (
    customer_id uuid NOT NULL,
    store_id uuid NOT NULL,
    year_month character varying(7) NOT NULL,
    spend_amount numeric(10,2) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_monthly_spends OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    organization_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(50),
    is_active boolean NOT NULL,
    membership_tier character varying(50) NOT NULL,
    lifetime_value numeric(12,2) NOT NULL,
    discount_rate numeric(5,2) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    dob date,
    wallet_balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    referral_code character varying(20),
    referred_by uuid
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: delivery_zones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_zones (
    store_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    base_fee numeric(10,2) NOT NULL,
    per_km_fee numeric(10,2) NOT NULL,
    min_order_for_free_delivery numeric(10,2) NOT NULL,
    is_active boolean NOT NULL,
    postcode_patterns character varying[] NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.delivery_zones OWNER TO postgres;

--
-- Name: driver_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_profiles (
    user_id uuid NOT NULL,
    vehicle_type character varying(50),
    is_available boolean NOT NULL,
    is_online boolean NOT NULL,
    total_deliveries integer NOT NULL,
    shift_start timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.driver_profiles OWNER TO postgres;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_flags (
    organization_id uuid NOT NULL,
    key character varying(100) NOT NULL,
    is_enabled boolean NOT NULL,
    description text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO postgres;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    product_id uuid NOT NULL,
    store_id uuid NOT NULL,
    quantity integer NOT NULL,
    reserved_quantity integer NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    customer_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    notification_type character varying(50) NOT NULL,
    reference_id uuid,
    is_read boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    product_sku character varying(100),
    quantity numeric(10,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    is_substituted boolean DEFAULT false NOT NULL,
    substituted_product_id uuid,
    effective_unit_price numeric(12,2),
    refunded_quantity numeric(10,3) DEFAULT '0'::numeric NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    order_id uuid NOT NULL,
    from_status character varying(30),
    to_status character varying(30) NOT NULL,
    changed_by_type character varying(20) NOT NULL,
    changed_by_id uuid,
    notes text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    organization_id uuid NOT NULL,
    store_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    delivery_address_id uuid,
    assigned_to uuid,
    order_number character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    delivery_fee numeric(10,2) NOT NULL,
    discount numeric(10,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    payment_status character varying(20) NOT NULL,
    notes text,
    delivery_instructions text,
    estimated_delivery_at timestamp with time zone,
    delivered_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    order_type character varying(20) DEFAULT 'delivery'::character varying NOT NULL,
    service_fee numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    tip_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    coupon_id uuid,
    coupon_code character varying(50),
    confirmed_at timestamp with time zone,
    picked_at timestamp with time zone,
    dispatched_at timestamp with time zone,
    rejected_reason text,
    delivery_address text,
    delivery_postcode character varying(20),
    cancel_window_expires_at timestamp with time zone,
    scheduled_delivery_start timestamp with time zone,
    scheduled_delivery_end timestamp with time zone,
    promotion_discount numeric(10,2) DEFAULT 0.00 NOT NULL,
    applied_promotions jsonb
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    settings json NOT NULL,
    logo_url character varying(500),
    contact_email character varying(255),
    contact_phone character varying(50),
    address text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: platform_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_configs (
    organization_id uuid NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    setting_type character varying(50),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.platform_configs OWNER TO postgres;

--
-- Name: postcode_zone_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.postcode_zone_mappings (
    postcode character varying(20) NOT NULL,
    zone_id uuid NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.postcode_zone_mappings OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    organization_id uuid NOT NULL,
    category_id uuid,
    name character varying(255) NOT NULL,
    description text,
    sku character varying(100) NOT NULL,
    barcode character varying(100),
    qr_code_data character varying(500),
    cost_price numeric(12,2) NOT NULL,
    selling_price numeric(12,2) NOT NULL,
    tax_rate numeric(5,2) NOT NULL,
    unit character varying(50) NOT NULL,
    low_stock_threshold integer NOT NULL,
    image_url character varying(500),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    member_price numeric(12,2),
    promo_price numeric(12,2),
    promo_start timestamp with time zone,
    promo_end timestamp with time zone,
    is_age_restricted boolean DEFAULT false NOT NULL,
    age_restriction_type character varying(50),
    allergens jsonb,
    nutritional_info jsonb,
    weight_unit character varying(20),
    calories_per_100g numeric(8,2),
    search_vector tsvector
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotions (
    organization_id uuid NOT NULL,
    store_id uuid,
    name character varying(255) NOT NULL,
    description text,
    promotion_type character varying(50) NOT NULL,
    config jsonb NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_active boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.promotions OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    token_hash character varying(255) NOT NULL,
    user_id uuid,
    customer_id uuid,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean NOT NULL,
    revoked_at timestamp with time zone,
    device_info text,
    replaced_by character varying(255),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refund_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund_items (
    refund_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    quantity numeric(10,3) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    admin_notes text,
    requires_manual_review boolean DEFAULT false NOT NULL
);


ALTER TABLE public.refund_items OWNER TO postgres;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refunds (
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    admin_notes text,
    processed_by uuid,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    total_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    destination character varying(20) DEFAULT 'wallet'::character varying NOT NULL
);


ALTER TABLE public.refunds OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    store_id uuid NOT NULL,
    store_rating integer NOT NULL,
    delivery_rating integer,
    comment text,
    is_published boolean NOT NULL,
    store_response text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reward_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reward_events (
    customer_id uuid NOT NULL,
    store_id uuid,
    tier_id uuid NOT NULL,
    coupon_id uuid,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.reward_events OWNER TO postgres;

--
-- Name: rewards_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewards_tiers (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    threshold_amount numeric(10,2) NOT NULL,
    reward_type character varying(50) NOT NULL,
    reward_value numeric(10,2) NOT NULL,
    expiry_days integer,
    store_id uuid,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.rewards_tiers OWNER TO postgres;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    product_id uuid NOT NULL,
    store_id uuid NOT NULL,
    from_store_id uuid,
    quantity integer NOT NULL,
    movement_type character varying(50) NOT NULL,
    reference character varying(255),
    notes text,
    performed_by uuid,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: stores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stores (
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    address text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    phone character varying(50),
    email character varying(255),
    is_active boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL,
    slug character varying(100),
    store_type character varying(50),
    description text,
    logo_url character varying(500),
    banner_url character varying(500),
    lat numeric(10,7),
    lng numeric(10,7),
    opening_hours jsonb,
    default_delivery_fee numeric(10,2) DEFAULT 1.99 NOT NULL,
    free_delivery_threshold numeric(10,2) DEFAULT 30.00 NOT NULL,
    min_order_value numeric(10,2) DEFAULT 10.00 NOT NULL,
    avg_prep_time_min integer DEFAULT 15 NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    temporarily_closed_reason text,
    surge_multiplier numeric(4,2),
    is_surge_active boolean
);


ALTER TABLE public.stores OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    organization_id uuid NOT NULL,
    store_id uuid,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    phone character varying(50),
    is_active boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_transactions (
    customer_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    source character varying(30) NOT NULL,
    reference_id uuid,
    notes text,
    balance_after numeric(12,2) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.wallet_transactions OWNER TO postgres;

--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_deliveries (
    endpoint_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    payload text NOT NULL,
    response_status integer,
    response_body text,
    attempts integer NOT NULL,
    delivered boolean NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.webhook_deliveries OWNER TO postgres;

--
-- Name: webhook_endpoints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_endpoints (
    organization_id uuid NOT NULL,
    url character varying(500) NOT NULL,
    secret character varying(255) NOT NULL,
    events character varying[] NOT NULL,
    is_active boolean NOT NULL,
    description text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.webhook_endpoints OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
cf5777792362
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, organization_id, store_id, user_id, user_name, user_role, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, notes, created_at) FROM stdin;
dee3f863-a373-4859-b2dc-70be974c30f3	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	\N	2026-04-12 11:17:43.645427+05:30
b8e0f95f-e454-4e0c-bff6-01dd81ae8c5c	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_CREATED	Product	9eb9887d-cadd-44c2-8186-4f16dde96fa2	null	{"id": "9eb9887d-cadd-44c2-8186-4f16dde96fa2", "sku": "BISC-228886", "name": "Biscuit", "barcode": "5010907307619", "tax_rate": 0.0, "cost_price": 100.0, "is_deleted": false, "category_id": "1da940f4-28fa-4fd0-b53a-7810d9f46c5c", "selling_price": 160.0}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	\N	2026-04-12 11:30:41.082223+05:30
6c915f0d-9886-4b6f-b4dc-fb140dfcde49	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	\N	2026-04-12 21:07:09.595395+05:30
05679872-32f7-4cf1-9897-a8b434eca536	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	\N	2026-04-13 09:38:13.352578+05:30
90afed9b-02e2-4567-b88f-de51147d56b5	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-17 20:52:16.937706+05:30
201855db-327f-40a0-816c-371538572e52	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-17 22:33:58.151787+05:30
380c44c2-5a07-4899-8eaa-78f744b3ec39	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 12:42:02.826751+05:30
217c640a-e0cb-4632-962c-935bca4c0030	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	AUTH_LOGIN_SUCCESS	\N	\N	null	null	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 20:56:37.121587+05:30
c53c14aa-74dc-41d8-92be-371da6cf5a7e	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	8036790a-b809-4b53-913a-9f23d7bd7ded	{"id": "8036790a-b809-4b53-913a-9f23d7bd7ded", "sku": "FRESH-001", "name": "Gala Apples (6 Pack)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 1.2, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 1.85, "is_age_restricted": false}	{"id": "8036790a-b809-4b53-913a-9f23d7bd7ded", "sku": "FRESH-001", "name": "Gala Apples (6 Pack)", "barcode": "5016111146372", "tax_rate": 0.0, "allergens": null, "cost_price": 1.2, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 1.85, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 20:58:23.551417+05:30
0973b4f6-3f01-463c-a0fb-bf6a82ac63c4	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	1293b2f7-2c43-48d1-958b-7195b4152428	{"id": "1293b2f7-2c43-48d1-958b-7195b4152428", "sku": "PANT-001", "name": "Penne Rigate Pasta (500g)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 0.4, "is_deleted": false, "category_id": "856694de-f57a-4a4b-bb22-76a04a9c36da", "promo_price": null, "member_price": null, "selling_price": 0.75, "is_age_restricted": false}	{"id": "1293b2f7-2c43-48d1-958b-7195b4152428", "sku": "PANT-001", "name": "Penne Rigate Pasta (500g)", "barcode": "5010215239107", "tax_rate": 0.0, "allergens": null, "cost_price": 0.4, "is_deleted": false, "category_id": "856694de-f57a-4a4b-bb22-76a04a9c36da", "promo_price": null, "member_price": null, "selling_price": 0.75, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:01:44.094655+05:30
37f0b455-b61b-45db-b2c2-29c1c8901afc	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	cf36c46a-6094-4268-aecf-aae25771442f	{"id": "cf36c46a-6094-4268-aecf-aae25771442f", "sku": "FRESH-002", "name": "Fairtrade Bananas (Bunch)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 0.8, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 1.15, "is_age_restricted": false}	{"id": "cf36c46a-6094-4268-aecf-aae25771442f", "sku": "FRESH-002", "name": "Fairtrade Bananas (Bunch)", "barcode": "5017377820259", "tax_rate": 0.0, "allergens": null, "cost_price": 0.8, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 1.15, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:01:54.820056+05:30
ea682c21-f7ae-431a-933b-a745940f694e	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	eedfec5e-f2c7-4049-8bed-ca50681e55a2	{"id": "eedfec5e-f2c7-4049-8bed-ca50681e55a2", "sku": "FRESH-003", "name": "Loose Carrots (1kg)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 0.4, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 0.65, "is_age_restricted": false}	{"id": "eedfec5e-f2c7-4049-8bed-ca50681e55a2", "sku": "FRESH-003", "name": "Loose Carrots (1kg)", "barcode": "5014623237526", "tax_rate": 0.0, "allergens": null, "cost_price": 0.4, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 0.65, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:02:04.099449+05:30
1403ca08-5d54-4dd5-aea7-26f770d38597	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23	{"id": "2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23", "sku": "FRESH-004", "name": "Broccoli Crowns (350g)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 0.5, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 0.8, "is_age_restricted": false}	{"id": "2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23", "sku": "FRESH-004", "name": "Broccoli Crowns (350g)", "barcode": "5010112204116", "tax_rate": 0.0, "allergens": null, "cost_price": 0.5, "is_deleted": false, "category_id": "8a37383a-66a0-4dec-8696-352886772655", "promo_price": null, "member_price": null, "selling_price": 0.8, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:02:29.107554+05:30
9d63c20c-6d01-4684-a032-4001165e8cca	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	81cdd358-a143-4a7d-86c4-2948c3aa72bc	{"id": "81cdd358-a143-4a7d-86c4-2948c3aa72bc", "sku": "MEAT-001", "name": "Chicken Breast Fillets (650g)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 3.5, "is_deleted": false, "category_id": "7403534c-fef9-42c7-8a9d-9bdba12632be", "promo_price": null, "member_price": null, "selling_price": 5.5, "is_age_restricted": false}	{"id": "81cdd358-a143-4a7d-86c4-2948c3aa72bc", "sku": "MEAT-001", "name": "Chicken Breast Fillets (650g)", "barcode": "5019176280135", "tax_rate": 0.0, "allergens": null, "cost_price": 3.5, "is_deleted": false, "category_id": "7403534c-fef9-42c7-8a9d-9bdba12632be", "promo_price": null, "member_price": null, "selling_price": 5.5, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:06:35.567908+05:30
7198520e-aeb8-490b-a369-c340232167e0	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	65f564f7-11e2-4ca1-8391-0dd4fdc89c54	{"id": "65f564f7-11e2-4ca1-8391-0dd4fdc89c54", "sku": "BEV-002", "name": "English Breakfast Tea (80 Bags)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 1.2, "is_deleted": false, "category_id": "f6c982bd-efe7-46be-a9de-0fd94b6b7aa3", "promo_price": null, "member_price": null, "selling_price": 2.1, "is_age_restricted": false}	{"id": "65f564f7-11e2-4ca1-8391-0dd4fdc89c54", "sku": "BEV-002", "name": "English Breakfast Tea (80 Bags)", "barcode": "5017062672293", "tax_rate": 0.0, "allergens": null, "cost_price": 1.2, "is_deleted": false, "category_id": "f6c982bd-efe7-46be-a9de-0fd94b6b7aa3", "promo_price": null, "member_price": null, "selling_price": 2.1, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:06:41.562427+05:30
83073232-c7cd-4945-9d1b-87e6faf0ccde	a859fb85-b615-4a1a-a6a9-a37448e044bf	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	Super Admin	admin	PRODUCT_UPDATED	Product	1a210d3d-8721-485e-b1af-193e5d08562b	{"id": "1a210d3d-8721-485e-b1af-193e5d08562b", "sku": "DAIRY-003", "name": "Mature British Cheddar (400g)", "barcode": null, "tax_rate": 0.0, "allergens": null, "cost_price": 2.2, "is_deleted": false, "category_id": "8bdc5ff3-2e59-4e35-a225-5988e47ddf2d", "promo_price": null, "member_price": null, "selling_price": 3.4, "is_age_restricted": false}	{"id": "1a210d3d-8721-485e-b1af-193e5d08562b", "sku": "DAIRY-003", "name": "Mature British Cheddar (400g)", "barcode": "5012021531468", "tax_rate": 0.0, "allergens": null, "cost_price": 2.2, "is_deleted": false, "category_id": "8bdc5ff3-2e59-4e35-a225-5988e47ddf2d", "promo_price": null, "member_price": null, "selling_price": 3.4, "is_age_restricted": false}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2026-04-19 21:06:48.491648+05:30
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (organization_id, store_id, title, subtitle, image_url, link_url, "position", is_active, starts_at, ends_at, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (organization_id, name, description, parent_id, sort_order, id, created_at, updated_at, is_deleted) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	Food	Eatable	\N	0	1da940f4-28fa-4fd0-b53a-7810d9f46c5c	2026-04-12 11:29:53.460612+05:30	2026-04-12 11:29:53.460616+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Fresh Produce	Fresh fruits and vegetables from local farms.	\N	0	8a37383a-66a0-4dec-8696-352886772655	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Bakery	Freshly baked artisan bread, pastries, and cakes.	\N	1	f3dbc8a8-abd1-4a5b-b855-4e076ed8efa9	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Dairy & Eggs	Farm-fresh milk, regional cheeses, and free-range eggs.	\N	2	8bdc5ff3-2e59-4e35-a225-5988e47ddf2d	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Meat & Poultry	High-quality British meat and poultry.	\N	3	7403534c-fef9-42c7-8a9d-9bdba12632be	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Frozen Food	Convenient frozen meals, vegetables, and desserts.	\N	4	ea63ebc8-caaf-4d9e-935c-497e33772ccd	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Pantry Essentials	Staples for your kitchen: pasta, rice, oil, and spices.	\N	5	856694de-f57a-4a4b-bb22-76a04a9c36da	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Beverages	Refreshing juices, sparkling water, tea, and coffee.	\N	6	f6c982bd-efe7-46be-a9de-0fd94b6b7aa3	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	Household	Eco-friendly cleaning supplies and home essentials.	\N	7	0e9ac16c-24c0-4f3f-bbd7-e395190e3997	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
\.


--
-- Data for Name: coupon_redemptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupon_redemptions (coupon_id, customer_id, order_id, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (organization_id, code, discount_type, discount_value, minimum_order_value, max_redemptions, current_redemptions, max_per_customer, valid_from, valid_until, applicable_store_ids, applicable_category_ids, is_first_order_only, is_combinable, issued_to_customer_id, source, is_active, id, created_at, updated_at, is_deleted) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	WELCOME10	percentage_discount	10.00	10.00	100	0	1	\N	\N	null	null	f	f	\N	manual	t	155a0702-a1a3-4103-8383-168ce7424bce	2026-04-19 21:19:07.701824+05:30	2026-04-19 21:19:07.701844+05:30	f
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_addresses (customer_id, label, street, city, state, postcode, country, lat, lng, is_default, id, created_at, updated_at, is_deleted) FROM stdin;
fb8800d1-498c-4b64-8307-07f6b6338186	home	MAin Street	Stocksfield		NE43 7LA	United Kingdom	\N	\N	t	da41cfe0-318f-4ae8-b99b-ce5742f1f462	2026-04-13 11:15:42.403962+05:30	2026-04-13 11:20:44.184561+05:30	f
\.


--
-- Data for Name: customer_monthly_spends; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_monthly_spends (customer_id, store_id, year_month, spend_amount, id, created_at, updated_at, is_deleted) FROM stdin;
fb8800d1-498c-4b64-8307-07f6b6338186	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	2026-04	321.00	b6978c4c-fa61-46d5-9bdc-c62a41e6c52f	2026-04-13 00:10:25.164485+05:30	2026-04-13 09:41:09.087421+05:30	f
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (organization_id, email, hashed_password, full_name, phone, is_active, membership_tier, lifetime_value, discount_rate, id, created_at, updated_at, is_deleted, dob, wallet_balance, referral_code, referred_by) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	test_reg_f31becf4@example.com	$2b$12$Px.ZkJaVp5iAkAYEs8UYhetupYwsIxN/f2jJQ2SyvfchzWd9N6slu	Debug User	\N	t	standard	0.00	0.00	5bac4ba5-1141-445d-aff4-ba071e8ed3ca	2026-04-12 11:42:58.714798+05:30	2026-04-12 11:42:58.714808+05:30	f	\N	0.00	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	tester123@example.com	$2b$12$H9Ut/cbzinMklMceYmxHK.iZvLRdthMmtHZop7PmZruTMivpJebB2	Test User	\N	t	standard	0.00	0.00	4a335597-2d55-4a29-aeaa-f71c7face9ac	2026-04-18 13:19:23.333671+05:30	2026-04-18 13:19:23.333888+05:30	f	\N	0.00	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	john@gmail.com	$2b$12$Y/xnj05phNakvrCxnXF7/upHe1QwBWY.SUn4GoQ1AMjqJTDb9Jixu	John	+442564754	t	standard	0.00	0.00	fb8800d1-498c-4b64-8307-07f6b6338186	2026-04-12 11:44:48.618869+05:30	2026-04-19 12:43:14.432921+05:30	f	\N	5.50	\N	\N
\.


--
-- Data for Name: delivery_zones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_zones (store_id, name, base_fee, per_km_fee, min_order_for_free_delivery, is_active, postcode_patterns, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: driver_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.driver_profiles (user_id, vehicle_type, is_available, is_online, total_deliveries, shift_start, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_flags (organization_id, key, is_enabled, description, id, created_at, updated_at, is_deleted) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	SMS_NOTIFICATIONS	f	Triggers Twilio events when orders are dispatched or rejected.	f12ee062-aeff-4938-bdfd-6a012aaee1cc	2026-04-12 22:57:59.646748+05:30	2026-04-12 22:58:01.050552+05:30	f
a859fb85-b615-4a1a-a6a9-a37448e044bf	REWARDS_SYSTEM_ENABLED	f	Activates tier points accumulation and wallet mechanisms post-checkout.	bb2cff09-813a-4473-94c4-2021a08ed834	2026-04-13 09:41:54.086605+05:30	2026-04-13 09:41:55.442817+05:30	f
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (product_id, store_id, quantity, reserved_quantity, id, created_at, updated_at, is_deleted) FROM stdin;
1094f57d-6248-464e-b3c5-e78d9b6c8991	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	41	0	937accac-94cf-47b3-bfcd-7516df4b7be1	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a210d3d-8721-485e-b1af-193e5d08562b	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	137	0	0ff1595a-a0a8-4c84-831a-9a8f25215ca8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
793ce057-7885-41f4-94f5-cc8012009cd8	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	149	0	16e13d77-ff69-45e2-a2cc-431d0629f9bf	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
85695fef-2213-48a1-b330-efe5e5fcda0f	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	132	0	78a0cb01-aa04-49df-a36a-6a09ad15004f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3293781f-8f65-46b5-aa3c-54fa714e2c85	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	117	0	7e1d7ff6-a3c5-4e4a-a430-93f7ae2355e2	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
dbc72f01-7c11-46b6-8a1e-63f96a3a1987	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	30	0	3385d387-4ce1-4cb3-bd98-772c72d53e72	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1293b2f7-2c43-48d1-958b-7195b4152428	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	76	0	b8734fa7-2f11-45e9-9678-1a287af1b2be	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
56a7ef29-f722-4d5f-8874-25ba296d280b	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	126	0	4c2cb36b-e6ce-4d94-b7ac-b199f2f9e550	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3a9c5c80-7001-4f0f-a5ca-4cfdcc553a2c	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	37	0	94776542-e1e2-4c69-ab60-d6cbb9617c83	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d8b200c7-cec6-4959-befd-5380061fde63	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	43	0	5ec3e743-c39e-47e4-b8d5-3973a99ffc38	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
651cf6a3-b0d2-4bfa-9081-c360583a570a	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	63	0	b152a80c-a3b6-42f6-8117-9b07e1ff088b	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
bf90eac9-6a99-4cd2-9892-2cdc0f7c9435	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	145	0	e5ffb8dc-5e4f-456c-958a-f91f18da16ff	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c45d7191-4062-4b13-acd1-0fded8f6d627	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	55	0	861d0d3e-b3fe-47d1-95b8-fa11af2f28e2	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
9eb9887d-cadd-44c2-8186-4f16dde96fa2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	97	3	388fafe1-96cd-4eb0-ba8a-1dce5df4e4a0	2026-04-12 11:30:41.066975+05:30	2026-04-19 22:22:02.483834+05:30	f
8036790a-b809-4b53-913a-9f23d7bd7ded	345bbcbf-0762-4572-9274-da08232bbde5	41	0	fa61e222-277d-4154-9017-fead018961a7	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cf36c46a-6094-4268-aecf-aae25771442f	345bbcbf-0762-4572-9274-da08232bbde5	133	0	95e174cf-0479-4c47-99d9-ab7875b4ab78	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
eedfec5e-f2c7-4049-8bed-ca50681e55a2	345bbcbf-0762-4572-9274-da08232bbde5	77	0	e8d60f49-be49-4686-9bb9-273bf95c78c7	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23	345bbcbf-0762-4572-9274-da08232bbde5	76	0	5ffd97db-2ee2-4ded-9376-186478a92d01	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d1c7fab9-acf7-4af9-a6f0-40d37b973d39	345bbcbf-0762-4572-9274-da08232bbde5	50	0	8decd93c-f2e5-40f0-896c-7019f51884e4	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
620088bb-442c-42b7-8b7b-59cb2f7bc0ee	345bbcbf-0762-4572-9274-da08232bbde5	39	0	32c8764a-e8e7-4fd0-a5ab-b50fbb884eb3	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
74d3df9c-797a-4c53-9bce-873651a81715	345bbcbf-0762-4572-9274-da08232bbde5	125	0	13f89150-6f4b-441b-bb21-92e3aa903856	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
77974897-e4b7-4f62-8da0-7a181d462283	345bbcbf-0762-4572-9274-da08232bbde5	48	0	ddce09c6-5ddd-4d2f-b58b-f2bb3cc36257	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cc7bf748-f246-4321-8a32-cdc0cdbe3e00	345bbcbf-0762-4572-9274-da08232bbde5	72	0	1dec55c8-c6b5-425f-9aed-f66f2b9ced44	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1094f57d-6248-464e-b3c5-e78d9b6c8991	345bbcbf-0762-4572-9274-da08232bbde5	147	0	8f973838-03ba-4dcb-81db-2adc3209a355	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c2e778c5-c15a-42c0-9019-c931725a15f1	345bbcbf-0762-4572-9274-da08232bbde5	83	0	44d0f794-c5b6-40eb-b173-830fd5e6810f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a210d3d-8721-485e-b1af-193e5d08562b	345bbcbf-0762-4572-9274-da08232bbde5	131	0	c6cc1045-947e-401c-8bbe-967bbf04f929	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
f8e922be-60ff-4292-a800-c643f02aea09	345bbcbf-0762-4572-9274-da08232bbde5	101	0	cc3dabea-7c9b-4ba7-9af6-fcb56195dc95	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
793ce057-7885-41f4-94f5-cc8012009cd8	345bbcbf-0762-4572-9274-da08232bbde5	95	0	7fb16f71-e477-468d-a0f8-188d3d14ecb0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
81cdd358-a143-4a7d-86c4-2948c3aa72bc	345bbcbf-0762-4572-9274-da08232bbde5	89	0	aac9c2a7-0b3d-4c99-99d0-37b87bc814e2	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
85695fef-2213-48a1-b330-efe5e5fcda0f	345bbcbf-0762-4572-9274-da08232bbde5	81	0	e1eba601-c3a6-4910-8ab2-63d3bf72c43c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3293781f-8f65-46b5-aa3c-54fa714e2c85	345bbcbf-0762-4572-9274-da08232bbde5	112	0	c1c941c0-fa3d-4fed-976d-04286391c62d	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a94dbf28-bbcc-456c-b178-a18287ac91f2	345bbcbf-0762-4572-9274-da08232bbde5	123	0	8beb1384-546c-4611-beb9-cee3b1d94bdc	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
0ca9f601-3ece-46ad-b3f6-3c24507c5aef	345bbcbf-0762-4572-9274-da08232bbde5	128	0	2539ceab-b539-4a94-a063-a505d32f5f3e	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c8e3bf87-036f-4a9a-a433-2ae5661785db	345bbcbf-0762-4572-9274-da08232bbde5	49	0	53d3260a-b620-4c78-90f4-18051ff8c685	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
dbc72f01-7c11-46b6-8a1e-63f96a3a1987	345bbcbf-0762-4572-9274-da08232bbde5	93	0	bf38faef-4d6b-4736-80bd-045a4f307615	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a741198-83f6-474c-b50c-7b2492a7c225	345bbcbf-0762-4572-9274-da08232bbde5	86	0	d2a70c99-7572-44e8-876e-b8d6966abdea	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1293b2f7-2c43-48d1-958b-7195b4152428	345bbcbf-0762-4572-9274-da08232bbde5	111	0	196c6f7c-3612-4378-be45-976caee355b7	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1da2e48a-703c-435a-a44b-61d009fff020	345bbcbf-0762-4572-9274-da08232bbde5	38	0	7858fd68-8f93-4890-9a0f-eced7727e9ef	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
56a7ef29-f722-4d5f-8874-25ba296d280b	345bbcbf-0762-4572-9274-da08232bbde5	115	0	cf3bb0e9-9513-4c2e-937b-5a5f97757881	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3a9c5c80-7001-4f0f-a5ca-4cfdcc553a2c	345bbcbf-0762-4572-9274-da08232bbde5	106	0	1c48bd7d-a03f-4f37-9308-c68bdbb9cf7c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d8b200c7-cec6-4959-befd-5380061fde63	345bbcbf-0762-4572-9274-da08232bbde5	50	0	97979a4f-c23c-4eba-85fb-855ad8ee38d0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
651cf6a3-b0d2-4bfa-9081-c360583a570a	345bbcbf-0762-4572-9274-da08232bbde5	102	0	278ea87f-7207-4c01-8954-d1a58e819545	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
65f564f7-11e2-4ca1-8391-0dd4fdc89c54	345bbcbf-0762-4572-9274-da08232bbde5	100	0	174401c1-2139-4bf2-b3db-f6a8cb836397	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
bf90eac9-6a99-4cd2-9892-2cdc0f7c9435	345bbcbf-0762-4572-9274-da08232bbde5	113	0	7152b998-c3fc-4ec5-812e-f5c4b05ccf32	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c45d7191-4062-4b13-acd1-0fded8f6d627	345bbcbf-0762-4572-9274-da08232bbde5	67	0	d093724b-d750-4530-aea3-51cccfa544b3	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	345bbcbf-0762-4572-9274-da08232bbde5	110	0	68e6ef07-4d0d-4cd6-b08a-1eb4493341ea	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
e0a244bd-48f3-4ba6-8200-16acca3d92fd	345bbcbf-0762-4572-9274-da08232bbde5	77	0	2552b846-a4c7-4152-a4c3-4310a5165b49	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a80d9b6f-430f-451c-b54a-eaf8ae6e234f	345bbcbf-0762-4572-9274-da08232bbde5	119	0	7b2cc072-8af8-4933-b2a7-209282ef7bf8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
4f265ce6-1a44-4f06-a920-8d8161a84f2a	345bbcbf-0762-4572-9274-da08232bbde5	138	0	bdd8dfc0-3a50-4131-a824-2caf6204eb3a	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
055ea93d-5ae9-43fc-adf8-37bb72b98d1a	345bbcbf-0762-4572-9274-da08232bbde5	82	0	65ceb391-cbd2-46d5-b82b-64a399aba991	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
8036790a-b809-4b53-913a-9f23d7bd7ded	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	115	0	740c6506-bd3f-4175-935d-1ed43958327c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cf36c46a-6094-4268-aecf-aae25771442f	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	85	0	5dcc8776-6fb5-4719-8931-f81349a86531	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
eedfec5e-f2c7-4049-8bed-ca50681e55a2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	90	0	b6b825a3-bc8b-48d9-b867-072510833c96	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	42	0	d1dd9c9b-e02e-4ff2-a682-875c8483bff6	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d1c7fab9-acf7-4af9-a6f0-40d37b973d39	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	97	0	e97145f3-6d76-4dfa-b84b-db8aaf0729d9	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
e0a244bd-48f3-4ba6-8200-16acca3d92fd	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	121	0	be269d86-64a7-4e14-9af0-66b74bcd12ea	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a80d9b6f-430f-451c-b54a-eaf8ae6e234f	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	52	0	32499a33-894b-40c9-abf8-4c22675a87df	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
4f265ce6-1a44-4f06-a920-8d8161a84f2a	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	47	0	be17b50b-6171-46f8-ae62-a19bf910a687	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
055ea93d-5ae9-43fc-adf8-37bb72b98d1a	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	111	0	405cafdd-8688-492a-b302-29472f3c0659	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
8036790a-b809-4b53-913a-9f23d7bd7ded	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	78	0	f2f2fb80-c6b9-48b1-84df-cdac39226416	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cf36c46a-6094-4268-aecf-aae25771442f	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	58	0	1cd0adad-247e-4c1f-bf3a-9575f2cbd325	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
65f564f7-11e2-4ca1-8391-0dd4fdc89c54	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	91	1	e2193c09-a8e8-4500-a443-4c8d38cea47e	2026-04-13 11:42:27.17566+05:30	2026-04-13 13:11:48.858054+05:30	f
f8e922be-60ff-4292-a800-c643f02aea09	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	106	1	3cc07293-f29b-462d-85a5-f09069ed146d	2026-04-13 11:42:27.17566+05:30	2026-04-13 13:11:48.863034+05:30	f
c2e778c5-c15a-42c0-9019-c931725a15f1	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	98	1	4019eb4f-2c99-4d7b-b764-d66fe9198f94	2026-04-13 11:42:27.17566+05:30	2026-04-13 13:11:48.868434+05:30	f
cc7bf748-f246-4321-8a32-cdc0cdbe3e00	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	44	0	eb4b2d95-10d1-4c03-851b-c7d35eb1bbf8	2026-04-13 11:42:27.17566+05:30	2026-04-19 13:11:30.382906+05:30	f
1da2e48a-703c-435a-a44b-61d009fff020	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	104	0	678ca6fd-958c-4d23-b57f-bc4a4eba7b2a	2026-04-13 11:42:27.17566+05:30	2026-04-18 00:34:24.654808+05:30	f
0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	89	0	853e2a30-5e3d-48a0-bdd3-9aec07825dd9	2026-04-13 11:42:27.17566+05:30	2026-04-18 00:34:25.163427+05:30	f
eedfec5e-f2c7-4049-8bed-ca50681e55a2	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	44	0	b460ce2c-90b7-4b43-9d6c-076086a7592e	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	120	0	0a686f5d-be2a-422d-8492-97b512d96ca0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d1c7fab9-acf7-4af9-a6f0-40d37b973d39	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	33	0	ef7a6477-9957-4cb7-8459-12aa0ba7ef00	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
620088bb-442c-42b7-8b7b-59cb2f7bc0ee	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	77	0	c8ca91b2-33c2-4f69-b774-fc3b8ad44452	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
74d3df9c-797a-4c53-9bce-873651a81715	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	73	0	7810afed-a067-4268-8f1c-d797eebad461	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
77974897-e4b7-4f62-8da0-7a181d462283	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	66	0	7596aec9-cd4f-408c-80e9-e76ae93e8f3c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cc7bf748-f246-4321-8a32-cdc0cdbe3e00	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	64	0	26e11847-13b5-49a4-bd59-36680117cc6c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1094f57d-6248-464e-b3c5-e78d9b6c8991	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	102	0	bb431bd6-3d18-4cdf-a41a-617c221f638e	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c2e778c5-c15a-42c0-9019-c931725a15f1	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	146	0	06e861bf-9c72-4b7e-ab1e-e8d028210b76	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a210d3d-8721-485e-b1af-193e5d08562b	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	37	0	893c18c1-1840-4b42-801c-a46f0371b9d8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
f8e922be-60ff-4292-a800-c643f02aea09	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	95	0	5e2a98ce-a04e-4420-bed0-f6b28a1e68cc	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
793ce057-7885-41f4-94f5-cc8012009cd8	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	124	0	e911bb5d-307c-47a9-b691-8b604290cf54	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
81cdd358-a143-4a7d-86c4-2948c3aa72bc	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	96	0	6bb07ed6-7387-4838-9582-ca4c7c5b53b1	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
85695fef-2213-48a1-b330-efe5e5fcda0f	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	143	0	aec6774a-b647-483e-b026-5b9d0b170d7c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3293781f-8f65-46b5-aa3c-54fa714e2c85	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	150	0	63c1c5e8-13a8-48e5-9296-8fb02cd0079f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a94dbf28-bbcc-456c-b178-a18287ac91f2	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	34	0	fd6ae6a3-c3d3-4b0d-8520-d06f4f6e8fba	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
0ca9f601-3ece-46ad-b3f6-3c24507c5aef	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	106	0	436f8917-3794-42ee-9058-8facec679299	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c8e3bf87-036f-4a9a-a433-2ae5661785db	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	127	0	67be88a9-7d58-4dec-a73d-600293b5c663	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
dbc72f01-7c11-46b6-8a1e-63f96a3a1987	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	137	0	d9645840-abbc-43f7-88dc-ead0ffbe0d2f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a741198-83f6-474c-b50c-7b2492a7c225	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	74	0	549523fc-f93e-42d6-96ac-27ce9d218845	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1293b2f7-2c43-48d1-958b-7195b4152428	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	107	0	d1918c63-a505-49f5-b9ec-9e0999df48c1	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1da2e48a-703c-435a-a44b-61d009fff020	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	87	0	95c0549e-ad17-43d7-959c-374a10f3e6e4	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
56a7ef29-f722-4d5f-8874-25ba296d280b	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	76	0	db369f9e-f6ee-404d-aa0f-f5e2279e9e93	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3a9c5c80-7001-4f0f-a5ca-4cfdcc553a2c	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	91	0	fb957cb3-4df1-435d-bd55-1da321f1ccd0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d8b200c7-cec6-4959-befd-5380061fde63	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	122	0	a9e05a72-89e1-4ad1-8a2f-8cc5fed1d2a8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
651cf6a3-b0d2-4bfa-9081-c360583a570a	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	65	0	13ad0731-3f53-4e16-94fa-3e6c3aae1ec7	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
65f564f7-11e2-4ca1-8391-0dd4fdc89c54	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	32	0	fbc21eb1-b1b3-48dd-9067-545d09e30d9a	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
bf90eac9-6a99-4cd2-9892-2cdc0f7c9435	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	43	0	cee7fd6d-b7a3-43ce-a4f8-b8e4db585fb3	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c45d7191-4062-4b13-acd1-0fded8f6d627	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	50	0	2730414a-f546-40ab-b7e4-c094e7fb0bca	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	61	0	9149404f-c4b2-4c69-a6a6-411149a3c86b	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
e0a244bd-48f3-4ba6-8200-16acca3d92fd	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	143	0	05f52e9c-ff8a-40f8-b779-b371d1d2ac38	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a80d9b6f-430f-451c-b54a-eaf8ae6e234f	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	71	0	58ec1130-c474-4069-8b9b-a2f5de6cc5cd	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
4f265ce6-1a44-4f06-a920-8d8161a84f2a	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	44	0	525e23c3-804a-4da7-94d2-18cd2cf55555	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
055ea93d-5ae9-43fc-adf8-37bb72b98d1a	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	124	0	7b42799e-ccd8-4982-8293-7ae2c8ba47fe	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
8036790a-b809-4b53-913a-9f23d7bd7ded	fe50ef86-5e53-49ea-982d-f79efe505a01	64	0	a0803bbf-d7ad-4f0a-855e-8c94cfcbf354	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cf36c46a-6094-4268-aecf-aae25771442f	fe50ef86-5e53-49ea-982d-f79efe505a01	92	0	a1e00318-f2fd-4859-8e4d-23fc915e6015	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
eedfec5e-f2c7-4049-8bed-ca50681e55a2	fe50ef86-5e53-49ea-982d-f79efe505a01	66	0	e47b54fd-4d3a-4d90-b761-ae817286e7d0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23	fe50ef86-5e53-49ea-982d-f79efe505a01	96	0	e7dbce2d-d99e-47d8-a261-cee1d73ebbfc	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d1c7fab9-acf7-4af9-a6f0-40d37b973d39	fe50ef86-5e53-49ea-982d-f79efe505a01	80	0	6522b965-be78-46d6-8d13-cb4fd2ef8644	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
620088bb-442c-42b7-8b7b-59cb2f7bc0ee	fe50ef86-5e53-49ea-982d-f79efe505a01	95	0	1c8dc8a7-6c3b-4842-ac76-cc61d029cb9a	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
74d3df9c-797a-4c53-9bce-873651a81715	fe50ef86-5e53-49ea-982d-f79efe505a01	33	0	8a145680-741a-4092-b191-84d5bdff97db	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
77974897-e4b7-4f62-8da0-7a181d462283	fe50ef86-5e53-49ea-982d-f79efe505a01	36	0	71b315a2-7baf-47d7-abcc-0ec71a3497d0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
cc7bf748-f246-4321-8a32-cdc0cdbe3e00	fe50ef86-5e53-49ea-982d-f79efe505a01	89	0	8908f525-bd5b-4d0c-8d7a-b7b48a60a0d8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1094f57d-6248-464e-b3c5-e78d9b6c8991	fe50ef86-5e53-49ea-982d-f79efe505a01	145	0	4c4e8b93-2ff2-441b-a61e-55c31d76a40f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c2e778c5-c15a-42c0-9019-c931725a15f1	fe50ef86-5e53-49ea-982d-f79efe505a01	56	0	80e293cd-1a84-4588-8058-a4ae23b91553	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a210d3d-8721-485e-b1af-193e5d08562b	fe50ef86-5e53-49ea-982d-f79efe505a01	137	0	b9d9964c-81c4-4bd3-9b80-56c54dd3610b	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
f8e922be-60ff-4292-a800-c643f02aea09	fe50ef86-5e53-49ea-982d-f79efe505a01	114	0	33a51e33-6ab2-44bb-9b3b-32c8c47d5b69	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
793ce057-7885-41f4-94f5-cc8012009cd8	fe50ef86-5e53-49ea-982d-f79efe505a01	115	0	e4bbcfbb-c7ce-4e22-ad74-5f95d969d0b0	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
81cdd358-a143-4a7d-86c4-2948c3aa72bc	fe50ef86-5e53-49ea-982d-f79efe505a01	107	0	9358e640-af1a-4bb9-8eba-0c0c43b51ffe	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
85695fef-2213-48a1-b330-efe5e5fcda0f	fe50ef86-5e53-49ea-982d-f79efe505a01	105	0	21da700d-f6b0-4f9f-a4b0-608e0918c694	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3293781f-8f65-46b5-aa3c-54fa714e2c85	fe50ef86-5e53-49ea-982d-f79efe505a01	35	0	a3267149-ea44-4b3b-9b89-e9bf22b5e785	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a94dbf28-bbcc-456c-b178-a18287ac91f2	fe50ef86-5e53-49ea-982d-f79efe505a01	55	0	e94c5267-8ff7-4393-818c-b96add509a7b	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
0ca9f601-3ece-46ad-b3f6-3c24507c5aef	fe50ef86-5e53-49ea-982d-f79efe505a01	102	0	08933889-8f33-4451-b31b-e7506ec88d6d	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c8e3bf87-036f-4a9a-a433-2ae5661785db	fe50ef86-5e53-49ea-982d-f79efe505a01	113	0	202f755f-bbea-4760-b90b-56449e62ec05	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
dbc72f01-7c11-46b6-8a1e-63f96a3a1987	fe50ef86-5e53-49ea-982d-f79efe505a01	60	0	b004797c-00f4-41dd-82ec-33fc2bd097cc	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1a741198-83f6-474c-b50c-7b2492a7c225	fe50ef86-5e53-49ea-982d-f79efe505a01	139	0	f8666755-0030-4863-8fec-6864ba1975f4	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1293b2f7-2c43-48d1-958b-7195b4152428	fe50ef86-5e53-49ea-982d-f79efe505a01	112	0	d8f64edf-c864-4db2-97f8-63a9fefb5f20	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
1da2e48a-703c-435a-a44b-61d009fff020	fe50ef86-5e53-49ea-982d-f79efe505a01	63	0	8d3438c1-d759-49e8-85cc-0d2400251286	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
56a7ef29-f722-4d5f-8874-25ba296d280b	fe50ef86-5e53-49ea-982d-f79efe505a01	129	0	5254c552-d616-49b5-a7b3-c87bfdd235a9	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
3a9c5c80-7001-4f0f-a5ca-4cfdcc553a2c	fe50ef86-5e53-49ea-982d-f79efe505a01	141	0	5348c279-b44b-48f9-84a8-2a75092020a1	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
d8b200c7-cec6-4959-befd-5380061fde63	fe50ef86-5e53-49ea-982d-f79efe505a01	100	0	3b294326-9efa-4a4b-8dc2-a210c286b172	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
651cf6a3-b0d2-4bfa-9081-c360583a570a	fe50ef86-5e53-49ea-982d-f79efe505a01	73	0	9e8350cb-85d4-4fa4-be82-ef19c450b48d	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
65f564f7-11e2-4ca1-8391-0dd4fdc89c54	fe50ef86-5e53-49ea-982d-f79efe505a01	79	0	4e9a4c95-b8c6-4fa0-a063-14815e44664c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
bf90eac9-6a99-4cd2-9892-2cdc0f7c9435	fe50ef86-5e53-49ea-982d-f79efe505a01	91	0	ca18c54e-86f0-49bc-a345-34bea03f068d	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c45d7191-4062-4b13-acd1-0fded8f6d627	fe50ef86-5e53-49ea-982d-f79efe505a01	112	0	f1fdbcae-2f92-4641-94f8-e800dfff7e89	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	fe50ef86-5e53-49ea-982d-f79efe505a01	109	0	b87679c3-574d-48d9-9865-7e7352227829	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
e0a244bd-48f3-4ba6-8200-16acca3d92fd	fe50ef86-5e53-49ea-982d-f79efe505a01	69	0	cb4789dd-9575-44ba-bc09-83960d5ad0ec	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
a80d9b6f-430f-451c-b54a-eaf8ae6e234f	fe50ef86-5e53-49ea-982d-f79efe505a01	84	0	e709db6a-cda7-4eda-b9d4-d43242f14955	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
4f265ce6-1a44-4f06-a920-8d8161a84f2a	fe50ef86-5e53-49ea-982d-f79efe505a01	86	0	8743e0c8-68ee-4f9e-9e32-93c43115e279	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
055ea93d-5ae9-43fc-adf8-37bb72b98d1a	fe50ef86-5e53-49ea-982d-f79efe505a01	134	0	aa593ac5-76c9-4f7b-80fa-b10194babf88	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f
c8e3bf87-036f-4a9a-a433-2ae5661785db	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	94	1	b6431ea5-72fb-4e9f-8bbf-9124178500bc	2026-04-13 11:42:27.17566+05:30	2026-04-13 12:53:04.19907+05:30	f
0ca9f601-3ece-46ad-b3f6-3c24507c5aef	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	124	1	d3ea8135-ef42-4e29-b8d8-c805f4f91636	2026-04-13 11:42:27.17566+05:30	2026-04-13 12:53:04.20363+05:30	f
1a741198-83f6-474c-b50c-7b2492a7c225	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	135	1	bafe2824-4a4e-468c-9f6c-c035f289fc5a	2026-04-13 11:42:27.17566+05:30	2026-04-13 12:53:04.20836+05:30	f
81cdd358-a143-4a7d-86c4-2948c3aa72bc	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	104	1	fdeda42c-49ec-4cad-9f32-a29f873b8415	2026-04-13 11:42:27.17566+05:30	2026-04-13 12:53:04.212847+05:30	f
a94dbf28-bbcc-456c-b178-a18287ac91f2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	63	1	a97b61f1-26a9-4081-acb3-e70894dea306	2026-04-13 11:42:27.17566+05:30	2026-04-13 12:53:04.216332+05:30	f
620088bb-442c-42b7-8b7b-59cb2f7bc0ee	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	80	3	2ac50409-9e75-4b95-9e16-b2052484dd43	2026-04-13 11:42:27.17566+05:30	2026-04-19 13:11:30.376208+05:30	f
74d3df9c-797a-4c53-9bce-873651a81715	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	36	3	70ed3abc-6526-4f32-b718-49fadbd1e784	2026-04-13 11:42:27.17566+05:30	2026-04-19 22:22:02.485243+05:30	f
77974897-e4b7-4f62-8da0-7a181d462283	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	47	3	6b25ae79-ce0e-4093-80a3-a79ab3fd5a36	2026-04-13 11:42:27.17566+05:30	2026-04-19 22:22:02.486305+05:30	f
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (customer_id, title, body, notification_type, reference_id, is_read, id, created_at, updated_at, is_deleted) FROM stdin;
fb8800d1-498c-4b64-8307-07f6b6338186	Order Confirmed ✅	Your order ORD-NXCYYMRN has been accepted and is being prepared.	order_update	1e4874c0-5df5-493a-9a15-155d90845802	f	73f4c653-f2c9-48f8-93c1-a56fafe911dc	2026-04-18 00:34:24.635897+05:30	2026-04-18 00:34:24.635899+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	Order Being Picked 🛒	Your order ORD-NXCYYMRN is being picked from the shelves.	order_update	1e4874c0-5df5-493a-9a15-155d90845802	f	e4e2325e-59a9-45fa-aabb-18de2e47f70b	2026-04-18 00:34:36.961456+05:30	2026-04-18 00:34:36.961458+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	Ready for Collection 📦	Your order ORD-NXCYYMRN is ready! Head to the store.	order_update	1e4874c0-5df5-493a-9a15-155d90845802	f	bf857538-fe6d-465e-bbed-49755f01a6fe	2026-04-18 00:34:47.204334+05:30	2026-04-18 00:34:47.204336+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	On Its Way! 🚗	Your order ORD-NXCYYMRN is out for delivery.	order_update	1e4874c0-5df5-493a-9a15-155d90845802	f	ddeb7aa3-9565-4852-b464-0a328908bb6d	2026-04-18 00:35:01.874626+05:30	2026-04-18 00:35:01.87463+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	Delivered! 🎉	Your order ORD-NXCYYMRN has been delivered. Enjoy!	order_update	1e4874c0-5df5-493a-9a15-155d90845802	f	914556d8-160f-43b3-809b-42791788c1d3	2026-04-18 00:35:08.622073+05:30	2026-04-18 00:35:08.622075+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	Order Being Picked 🛒	Your order ORD-W6ZKUIS0 is being picked from the shelves.	order_update	9efa5463-2641-4e10-8b17-b107562e6ea0	f	04ead944-392c-49c7-96c0-d3e320e4490b	2026-04-19 13:11:30.332836+05:30	2026-04-19 13:11:30.332846+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	Delivered! 🎉	Your order ORD-W6ZKUIS0 has been delivered. Enjoy!	order_update	9efa5463-2641-4e10-8b17-b107562e6ea0	f	b8b26ad1-0ab9-4879-8458-2b9f369aadd6	2026-04-19 13:11:34.020145+05:30	2026-04-19 13:11:34.020147+05:30	f
fb8800d1-498c-4b64-8307-07f6b6338186	Ready for Collection 📦	Your order ORD-W6ZKUIS0 is ready! Head to the store.	order_update	9efa5463-2641-4e10-8b17-b107562e6ea0	f	86febc0f-763a-4e9c-96ca-c2b926cb981b	2026-04-19 13:13:24.24178+05:30	2026-04-19 13:13:24.241782+05:30	f
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, tax_amount, total, id, created_at, updated_at, is_deleted, is_substituted, substituted_product_id, effective_unit_price, refunded_quantity) FROM stdin;
458eacdd-e953-463f-a875-5fd3cf220237	9eb9887d-cadd-44c2-8186-4f16dde96fa2	Biscuit	BISC-228886	1.000	160.00	0.00	160.00	37fb7e40-bfe8-4aef-be8a-fc7b5c44ebeb	2026-04-12 21:52:34.540845+05:30	2026-04-12 21:52:34.540858+05:30	f	f	\N	160.00	0.000
dcfcc2fe-cf25-4f9b-8b32-3b8a4f4d65ba	9eb9887d-cadd-44c2-8186-4f16dde96fa2	Biscuit	BISC-228886	1.000	160.00	0.00	160.00	391d985e-c341-4b8d-8989-f52d0a2a2585	2026-04-13 00:09:28.375668+05:30	2026-04-13 00:09:28.37567+05:30	f	f	\N	160.00	0.000
d42e1376-d8a6-4092-bdf2-5e36ef6a2489	9eb9887d-cadd-44c2-8186-4f16dde96fa2	Biscuit	BISC-228886	1.000	160.00	0.00	160.00	8cc3eff9-3f74-4417-940d-c3b4ab3313a5	2026-04-13 09:40:35.750672+05:30	2026-04-13 09:40:35.750675+05:30	f	f	\N	160.00	0.000
d8951a1b-8ab3-4549-89fc-965258ecf5e9	9eb9887d-cadd-44c2-8186-4f16dde96fa2	Biscuit	BISC-228886	3.000	160.00	0.00	480.00	0b0199c2-bd8e-4b49-9a00-48331ea2af20	2026-04-13 09:53:55.265223+05:30	2026-04-13 09:53:55.265226+05:30	f	f	\N	160.00	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	620088bb-442c-42b7-8b7b-59cb2f7bc0ee	Artisan White Sliced Bread	BAKE-001	1.000	1.35	0.00	1.35	5edb4b4c-559e-4fd9-a80d-6b801e956e72	2026-04-13 12:53:04.166736+05:30	2026-04-13 12:53:04.166738+05:30	f	f	\N	1.35	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	74d3df9c-797a-4c53-9bce-873651a81715	All-Butter Croissants (4 Pack)	BAKE-002	1.000	2.50	0.00	2.50	9cf7f2b4-daa8-4995-9eb1-5ea71fed451e	2026-04-13 12:53:04.189095+05:30	2026-04-13 12:53:04.189097+05:30	f	f	\N	2.50	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	77974897-e4b7-4f62-8da0-7a181d462283	Fresh French Baguette	BAKE-003	1.000	0.85	0.00	0.85	8198c8ea-01c8-46ce-996d-dc42b3dc39cc	2026-04-13 12:53:04.193879+05:30	2026-04-13 12:53:04.193881+05:30	f	f	\N	0.85	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	c8e3bf87-036f-4a9a-a433-2ae5661785db	Pepperoni Feast Pizza	FROZ-002	1.000	3.00	0.00	3.00	22a806f3-89c5-4937-90c4-30a852a6d8b4	2026-04-13 12:53:04.198197+05:30	2026-04-13 12:53:04.198199+05:30	f	f	\N	3.00	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	0ca9f601-3ece-46ad-b3f6-3c24507c5aef	Frozen Garden Peas (1kg)	FROZ-001	1.000	1.10	0.00	1.10	24a88fc1-78dd-4f7d-9d52-3a66fe93d5a4	2026-04-13 12:53:04.202284+05:30	2026-04-13 12:53:04.202285+05:30	f	f	\N	1.10	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	1a741198-83f6-474c-b50c-7b2492a7c225	Vanilla Dairy Ice Cream (2L)	FROZ-004	1.000	3.20	0.00	3.20	36463183-1ab0-4b59-becb-de22f955497d	2026-04-13 12:53:04.207335+05:30	2026-04-13 12:53:04.207337+05:30	f	f	\N	3.20	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	81cdd358-a143-4a7d-86c4-2948c3aa72bc	Chicken Breast Fillets (650g)	MEAT-001	1.000	5.50	0.00	5.50	7aa2f476-2039-4c69-a6e2-5247632b995e	2026-04-13 12:53:04.212057+05:30	2026-04-13 12:53:04.212059+05:30	f	f	\N	5.50	0.000
66ea9fb4-c6e9-4a54-896a-4c87679df0bd	a94dbf28-bbcc-456c-b178-a18287ac91f2	Pork Sausages (8 Pack)	MEAT-004	1.000	2.20	0.00	2.20	4a6a0938-4e95-43c8-b53b-35c938397189	2026-04-13 12:53:04.215634+05:30	2026-04-13 12:53:04.215636+05:30	f	f	\N	2.20	0.000
21ee58a5-53b3-42f8-afbb-21dda0af6c15	620088bb-442c-42b7-8b7b-59cb2f7bc0ee	Artisan White Sliced Bread	BAKE-001	1.000	1.35	0.00	1.35	7c0c37dc-18da-4d47-9bc7-d3470daee637	2026-04-13 13:11:48.814094+05:30	2026-04-13 13:11:48.814097+05:30	f	f	\N	1.35	0.000
21ee58a5-53b3-42f8-afbb-21dda0af6c15	74d3df9c-797a-4c53-9bce-873651a81715	All-Butter Croissants (4 Pack)	BAKE-002	1.000	2.50	0.00	2.50	656c9eb5-5b14-4e38-a65f-1ae56d1966e5	2026-04-13 13:11:48.844886+05:30	2026-04-13 13:11:48.844888+05:30	f	f	\N	2.50	0.000
21ee58a5-53b3-42f8-afbb-21dda0af6c15	77974897-e4b7-4f62-8da0-7a181d462283	Fresh French Baguette	BAKE-003	1.000	0.85	0.00	0.85	954a4320-7dd8-46c0-9736-d755b9adf2e5	2026-04-13 13:11:48.851256+05:30	2026-04-13 13:11:48.851257+05:30	f	f	\N	0.85	0.000
21ee58a5-53b3-42f8-afbb-21dda0af6c15	65f564f7-11e2-4ca1-8391-0dd4fdc89c54	English Breakfast Tea (80 Bags)	BEV-002	1.000	2.10	0.00	2.10	d4f3ec11-0641-4c6b-97fe-2c5efd53725f	2026-04-13 13:11:48.857091+05:30	2026-04-13 13:11:48.857093+05:30	f	f	\N	2.10	0.000
21ee58a5-53b3-42f8-afbb-21dda0af6c15	f8e922be-60ff-4292-a800-c643f02aea09	Greek Style Yogurt (500g)	DAIRY-004	1.000	1.20	0.00	1.20	4e462110-6fbc-4b51-8c5d-5eefb1e58821	2026-04-13 13:11:48.861817+05:30	2026-04-13 13:11:48.861819+05:30	f	f	\N	1.20	0.000
21ee58a5-53b3-42f8-afbb-21dda0af6c15	c2e778c5-c15a-42c0-9019-c931725a15f1	Large Free Range Eggs (12)	DAIRY-002	1.000	2.75	0.00	2.75	d2c16e8a-d648-4cbf-83a0-4974216c24dc	2026-04-13 13:11:48.867117+05:30	2026-04-13 13:11:48.867118+05:30	f	f	\N	2.75	0.000
9d53ebf1-0810-4b36-a214-02e8937387a9	620088bb-442c-42b7-8b7b-59cb2f7bc0ee	Artisan White Sliced Bread	BAKE-001	1.000	1.35	0.00	1.35	b7833f33-ff5e-4722-86a7-e7814b5b78b1	2026-04-17 20:32:39.969688+05:30	2026-04-17 20:32:39.969692+05:30	f	f	\N	1.35	0.000
9d53ebf1-0810-4b36-a214-02e8937387a9	74d3df9c-797a-4c53-9bce-873651a81715	All-Butter Croissants (4 Pack)	BAKE-002	1.000	2.50	0.00	2.50	7940e188-4ec7-43ae-b8df-e94fca854584	2026-04-17 20:32:39.977909+05:30	2026-04-17 20:32:39.977911+05:30	f	f	\N	2.50	0.000
9d53ebf1-0810-4b36-a214-02e8937387a9	77974897-e4b7-4f62-8da0-7a181d462283	Fresh French Baguette	BAKE-003	1.000	0.85	0.00	0.85	42147195-9722-48e7-bb09-c4a9b3d86787	2026-04-17 20:32:39.983792+05:30	2026-04-17 20:32:39.983795+05:30	f	f	\N	0.85	0.000
1e4874c0-5df5-493a-9a15-155d90845802	0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	Cloudy Apple Juice (1L)	BEV-005	2.000	1.60	0.00	3.20	1109df62-4aba-4341-afc9-aa3d60f90b45	2026-04-18 00:26:11.340652+05:30	2026-04-18 00:26:11.340655+05:30	f	f	\N	1.60	0.000
9efa5463-2641-4e10-8b17-b107562e6ea0	620088bb-442c-42b7-8b7b-59cb2f7bc0ee	Artisan White Sliced Bread	BAKE-001	2.000	1.35	0.00	2.70	7a386f99-206b-4360-aab6-9f2b767f0ec8	2026-04-18 13:13:28.126566+05:30	2026-04-18 13:13:28.126569+05:30	f	f	\N	1.35	0.000
9efa5463-2641-4e10-8b17-b107562e6ea0	cc7bf748-f246-4321-8a32-cdc0cdbe3e00	Chocolate Fudge Cake	BAKE-004	1.000	4.50	0.00	4.50	f794e3fc-73bd-41c7-b64a-cd9dc9e90a15	2026-04-18 13:13:28.140098+05:30	2026-04-18 13:13:28.140101+05:30	f	f	\N	4.50	0.000
9efa5463-2641-4e10-8b17-b107562e6ea0	77974897-e4b7-4f62-8da0-7a181d462283	Fresh French Baguette	BAKE-003	1.000	0.85	0.00	0.85	3feceaad-bc5b-4a4f-9153-4d415baa94ef	2026-04-18 13:13:28.146827+05:30	2026-04-18 13:13:28.146829+05:30	f	f	\N	0.85	0.000
1e4874c0-5df5-493a-9a15-155d90845802	1da2e48a-703c-435a-a44b-61d009fff020	Basmati Rice (1kg)	PANT-002	1.000	1.80	0.00	1.80	b8f66b59-2e28-4958-be75-d64a2c1d1f02	2026-04-18 00:26:11.33401+05:30	2026-04-19 22:09:10.122021+05:30	f	f	\N	1.80	1.000
a28c0714-3836-415a-8487-1dcf0fdc4233	9eb9887d-cadd-44c2-8186-4f16dde96fa2	Biscuit	BISC-228886	3.000	160.00	0.00	480.00	d3015ff9-622b-4c51-bfe6-12e7e23a07fb	2026-04-19 22:20:06.767269+05:30	2026-04-19 22:20:06.767271+05:30	f	f	\N	160.00	0.000
a28c0714-3836-415a-8487-1dcf0fdc4233	74d3df9c-797a-4c53-9bce-873651a81715	All-Butter Croissants (4 Pack)	BAKE-002	4.000	2.50	0.00	10.00	7f12a7b5-b821-4f4a-8881-fa1709696ae3	2026-04-19 22:20:06.776805+05:30	2026-04-19 22:20:06.776807+05:30	f	f	\N	2.50	0.000
a28c0714-3836-415a-8487-1dcf0fdc4233	77974897-e4b7-4f62-8da0-7a181d462283	Fresh French Baguette	BAKE-003	3.000	0.85	0.00	2.55	01d27f7c-bd38-4da1-9d07-ac879adfab59	2026-04-19 22:20:06.78144+05:30	2026-04-19 22:20:06.781442+05:30	f	f	\N	0.85	0.000
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_history (order_id, from_status, to_status, changed_by_type, changed_by_id, notes, id, created_at, updated_at, is_deleted) FROM stdin;
1e4874c0-5df5-493a-9a15-155d90845802	\N	placed	customer	fb8800d1-498c-4b64-8307-07f6b6338186	\N	c1f5d614-89ed-4a8d-903f-545a768017ef	2026-04-18 00:26:11.320767+05:30	2026-04-18 00:26:11.320771+05:30	f
1e4874c0-5df5-493a-9a15-155d90845802	placed	confirmed	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	a64c9fbd-f9ef-4060-a4b1-1e865422df4a	2026-04-18 00:34:24.647132+05:30	2026-04-18 00:34:24.647135+05:30	f
1e4874c0-5df5-493a-9a15-155d90845802	confirmed	picking	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	d4433c05-56e2-45e1-9ae5-e79afac9a53b	2026-04-18 00:34:36.962576+05:30	2026-04-18 00:34:36.962578+05:30	f
1e4874c0-5df5-493a-9a15-155d90845802	picking	ready_for_collection	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	615a6d2f-79a4-4d03-a052-c73da54c986e	2026-04-18 00:34:47.205408+05:30	2026-04-18 00:34:47.20541+05:30	f
1e4874c0-5df5-493a-9a15-155d90845802	ready_for_collection	assigned_to_driver	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	f0a8dfc9-9725-4254-96c0-086585a40ce5	2026-04-18 00:34:54.50755+05:30	2026-04-18 00:34:54.507557+05:30	f
1e4874c0-5df5-493a-9a15-155d90845802	assigned_to_driver	out_for_delivery	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	cd2a58ff-1a2d-4c35-9db3-16cfb282ff9e	2026-04-18 00:35:01.877962+05:30	2026-04-18 00:35:01.877966+05:30	f
1e4874c0-5df5-493a-9a15-155d90845802	out_for_delivery	delivered	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	af7666a4-39da-4479-aff9-0c2df734b07c	2026-04-18 00:35:08.624641+05:30	2026-04-18 00:35:08.624643+05:30	f
9efa5463-2641-4e10-8b17-b107562e6ea0	\N	placed	customer	fb8800d1-498c-4b64-8307-07f6b6338186	\N	3f7d97f8-c64f-4cc3-958f-dec7b18fb5b2	2026-04-18 13:13:28.109875+05:30	2026-04-18 13:13:28.109877+05:30	f
9efa5463-2641-4e10-8b17-b107562e6ea0	placed	picking	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	d313e023-99e2-44ea-842b-87ed085d48f0	2026-04-19 13:11:30.356219+05:30	2026-04-19 13:11:30.356226+05:30	f
9efa5463-2641-4e10-8b17-b107562e6ea0	picking	delivered	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	9bb02015-8a02-4fed-b6f6-e525a0168a0d	2026-04-19 13:11:34.023382+05:30	2026-04-19 13:11:34.023386+05:30	f
9efa5463-2641-4e10-8b17-b107562e6ea0	picking	ready_for_collection	staff	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	cc01671c-a2dd-4f25-98fc-938fa3cba23c	2026-04-19 13:13:24.246874+05:30	2026-04-19 13:13:24.246876+05:30	f
a28c0714-3836-415a-8487-1dcf0fdc4233	\N	placed	customer	fb8800d1-498c-4b64-8307-07f6b6338186	\N	ad200b97-f886-42c9-b91d-7e9b8c4f2004	2026-04-19 22:20:06.755178+05:30	2026-04-19 22:20:06.75518+05:30	f
a28c0714-3836-415a-8487-1dcf0fdc4233	placed	cancelled	customer	fb8800d1-498c-4b64-8307-07f6b6338186	Customer self-cancelled within cancellation window	3a68d92f-d814-40d2-8eff-8a70d62126be	2026-04-19 22:22:02.487502+05:30	2026-04-19 22:22:02.487504+05:30	f
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (organization_id, store_id, customer_id, delivery_address_id, assigned_to, order_number, status, delivery_fee, discount, total, payment_method, payment_status, notes, delivery_instructions, estimated_delivery_at, delivered_at, id, created_at, updated_at, is_deleted, order_type, service_fee, tip_amount, coupon_id, coupon_code, confirmed_at, picked_at, dispatched_at, rejected_reason, delivery_address, delivery_postcode, cancel_window_expires_at, scheduled_delivery_start, scheduled_delivery_end, promotion_discount, applied_promotions) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	da41cfe0-318f-4ae8-b99b-ce5742f1f462	\N	ORD-1UW7V5Q1	placed	0.00	0.00	11.25	cod	pending		Saved Address: MAin Street, Stocksfield, NE43 7LA	\N	\N	21ee58a5-53b3-42f8-afbb-21dda0af6c15	2026-04-13 13:11:48.788465+05:30	2026-04-13 13:11:48.869337+05:30	f	delivery	0.50	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	\N	\N	ORD-2V931VLR	delivered	0.00	0.00	160.00	cod	paid		Address: ,	\N	2026-04-12 22:33:20.317928+05:30	458eacdd-e953-463f-a875-5fd3cf220237	2026-04-12 21:52:34.50508+05:30	2026-04-12 22:33:20.31791+05:30	f	delivery	0.50	0.00	\N	\N	2026-04-12 22:30:10.952825+05:30	2026-04-12 22:31:38.629811+05:30	\N	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	\N	\N	ORD-L9XTLUKV	delivered	0.00	0.00	160.50	cod	paid		Saved Address: No.72, Jawa Street, Kinniya-6, Kinniya, 31100	\N	2026-04-13 09:41:09.075405+05:30	d42e1376-d8a6-4092-bdf2-5e36ef6a2489	2026-04-13 09:40:35.718157+05:30	2026-04-13 09:41:09.075397+05:30	f	delivery	0.50	0.00	\N	\N	2026-04-13 09:40:52.656739+05:30	2026-04-13 09:41:00.042947+05:30	\N	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	\N	\N	ORD-0J104CT7	placed	0.00	0.00	480.50	cod	pending		Saved Address: No.72, Jawa Street, Kinniya-6, Kinniya, 31100	\N	\N	d8951a1b-8ab3-4549-89fc-965258ecf5e9	2026-04-13 09:53:55.237714+05:30	2026-04-13 09:53:55.269449+05:30	f	delivery	0.50	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	\N	\N	ORD-YEOFDPU1	delivered	0.00	0.00	160.50	cod	paid		Saved Address: No.72, Jawa Street, Kinniya-6, Kinniya, 31100	\N	2026-04-13 00:10:25.153753+05:30	dcfcc2fe-cf25-4f9b-8b32-3b8a4f4d65ba	2026-04-13 00:09:28.349856+05:30	2026-04-13 00:10:25.153749+05:30	f	delivery	0.50	0.00	\N	\N	2026-04-13 00:09:45.346463+05:30	2026-04-13 00:09:52.759203+05:30	2026-04-13 00:10:18.380706+05:30	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	da41cfe0-318f-4ae8-b99b-ce5742f1f462	\N	ORD-6QE6HCX2	placed	0.00	0.00	5.20	cod	pending		Saved Address: MAin Street, Stocksfield, NE43 7LA	\N	\N	9d53ebf1-0810-4b36-a214-02e8937387a9	2026-04-17 20:32:39.939525+05:30	2026-04-17 20:32:39.98576+05:30	f	delivery	0.50	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	da41cfe0-318f-4ae8-b99b-ce5742f1f462	\N	ORD-NXCYYMRN	delivered	0.00	0.00	5.50	cod	refunded		Saved Address: MAin Street, Stocksfield, NE43 7LA	\N	2026-04-18 00:35:08.6263+05:30	1e4874c0-5df5-493a-9a15-155d90845802	2026-04-18 00:26:11.298179+05:30	2026-04-19 12:43:14.443836+05:30	f	delivery	0.50	0.00	\N	\N	2026-04-18 00:34:24.648951+05:30	2026-04-18 00:34:36.963132+05:30	2026-04-18 00:35:01.879407+05:30	\N	\N	\N	2026-04-18 00:36:11.314561+05:30	\N	\N	0.00	[]
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	da41cfe0-318f-4ae8-b99b-ce5742f1f462	\N	ORD-BV8WOTFR	placed	0.00	0.00	20.20	cod	pending		Saved Address: MAin Street, Stocksfield, NE43 7LA	\N	\N	66ea9fb4-c6e9-4a54-896a-4c87679df0bd	2026-04-13 12:53:04.140529+05:30	2026-04-13 12:53:04.217104+05:30	f	delivery	0.50	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	da41cfe0-318f-4ae8-b99b-ce5742f1f462	\N	ORD-W6ZKUIS0	ready_for_collection	0.00	0.00	8.55	cod	paid		Saved Address: MAin Street, Stocksfield, NE43 7LA	\N	2026-04-19 13:11:34.024766+05:30	9efa5463-2641-4e10-8b17-b107562e6ea0	2026-04-18 13:13:28.095798+05:30	2026-04-19 13:13:24.240189+05:30	f	delivery	0.50	0.00	\N	\N	\N	2026-04-19 13:11:30.360802+05:30	\N	\N	\N	\N	2026-04-18 13:23:28.101363+05:30	\N	\N	0.00	[]
a859fb85-b615-4a1a-a6a9-a37448e044bf	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	fb8800d1-498c-4b64-8307-07f6b6338186	da41cfe0-318f-4ae8-b99b-ce5742f1f462	\N	ORD-VOJUAI3T	cancelled	0.00	0.00	493.05	cod	pending		Saved Address: MAin Street, Stocksfield, NE43 7LA	\N	\N	a28c0714-3836-415a-8487-1dcf0fdc4233	2026-04-19 22:20:06.733428+05:30	2026-04-19 22:22:02.478273+05:30	f	delivery	0.50	0.00	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 22:30:06.746823+05:30	\N	\N	0.00	[]
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (name, slug, description, settings, logo_url, contact_email, contact_phone, address, id, created_at, updated_at, is_deleted) FROM stdin;
UK Grocery HQ	uk-grocery-hq	Main headquarters	{"currency": "GBP"}	\N	\N	\N	\N	a859fb85-b615-4a1a-a6a9-a37448e044bf	2026-04-12 11:12:30.283912+05:30	2026-04-12 11:12:30.283912+05:30	f
\.


--
-- Data for Name: platform_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_configs (organization_id, key, value, description, setting_type, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: postcode_zone_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.postcode_zone_mappings (postcode, zone_id, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (organization_id, category_id, name, description, sku, barcode, qr_code_data, cost_price, selling_price, tax_rate, unit, low_stock_threshold, image_url, id, created_at, updated_at, is_deleted, member_price, promo_price, promo_start, promo_end, is_age_restricted, age_restriction_type, allergens, nutritional_info, weight_unit, calories_per_100g, search_vector) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	8a37383a-66a0-4dec-8696-352886772655	Organic Spinach (200g)	Fresh Organic Spinach (200g) for your home.	FRESH-005	\N	\N	0.90	1.50	0.00	pack	10	https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800	d1c7fab9-acf7-4af9-a6f0-40d37b973d39	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f3dbc8a8-abd1-4a5b-b855-4e076ed8efa9	Artisan White Sliced Bread	Fresh Artisan White Sliced Bread for your home.	BAKE-001	\N	\N	0.90	1.35	0.00	loaf	10	https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800	620088bb-442c-42b7-8b7b-59cb2f7bc0ee	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f3dbc8a8-abd1-4a5b-b855-4e076ed8efa9	All-Butter Croissants (4 Pack)	Fresh All-Butter Croissants (4 Pack) for your home.	BAKE-002	\N	\N	1.50	2.50	20.00	pack	10	https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800	74d3df9c-797a-4c53-9bce-873651a81715	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f3dbc8a8-abd1-4a5b-b855-4e076ed8efa9	Fresh French Baguette	Fresh Fresh French Baguette for your home.	BAKE-003	\N	\N	0.45	0.85	0.00	pcs	10	https://images.unsplash.com/photo-1597079910443-60c43fc4f729?w=800	77974897-e4b7-4f62-8da0-7a181d462283	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f3dbc8a8-abd1-4a5b-b855-4e076ed8efa9	Chocolate Fudge Cake	Fresh Chocolate Fudge Cake for your home.	BAKE-004	\N	\N	2.00	4.50	20.00	pcs	10	https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800	cc7bf748-f246-4321-8a32-cdc0cdbe3e00	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8bdc5ff3-2e59-4e35-a225-5988e47ddf2d	Semi-Skimmed Milk (2L)	Fresh Semi-Skimmed Milk (2L) for your home.	DAIRY-001	\N	\N	1.10	1.55	0.00	pcs	10	https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=800	1094f57d-6248-464e-b3c5-e78d9b6c8991	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8bdc5ff3-2e59-4e35-a225-5988e47ddf2d	Large Free Range Eggs (12)	Fresh Large Free Range Eggs (12) for your home.	DAIRY-002	\N	\N	1.80	2.75	0.00	pack	10	https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=800	c2e778c5-c15a-42c0-9019-c931725a15f1	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8bdc5ff3-2e59-4e35-a225-5988e47ddf2d	Greek Style Yogurt (500g)	Fresh Greek Style Yogurt (500g) for your home.	DAIRY-004	\N	\N	0.70	1.20	0.00	pcs	10	https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800	f8e922be-60ff-4292-a800-c643f02aea09	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8bdc5ff3-2e59-4e35-a225-5988e47ddf2d	Salted Butter (250g)	Fresh Salted Butter (250g) for your home.	DAIRY-005	\N	\N	1.40	2.10	0.00	pcs	10	https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800	793ce057-7885-41f4-94f5-cc8012009cd8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	7403534c-fef9-42c7-8a9d-9bdba12632be	Lean Beef Mince 5% Fat (500g)	Fresh Lean Beef Mince 5% Fat (500g) for your home.	MEAT-002	\N	\N	2.80	4.20	0.00	pack	10	https://images.unsplash.com/photo-1588168333986-50d8184b2288?w=800	85695fef-2213-48a1-b330-efe5e5fcda0f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	7403534c-fef9-42c7-8a9d-9bdba12632be	Dry Cured Smoked Bacon (200g)	Fresh Dry Cured Smoked Bacon (200g) for your home.	MEAT-003	\N	\N	1.50	2.45	0.00	pack	10	https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=800	3293781f-8f65-46b5-aa3c-54fa714e2c85	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	7403534c-fef9-42c7-8a9d-9bdba12632be	Pork Sausages (8 Pack)	Fresh Pork Sausages (8 Pack) for your home.	MEAT-004	\N	\N	1.30	2.20	0.00	pack	10	https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800	a94dbf28-bbcc-456c-b178-a18287ac91f2	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	ea63ebc8-caaf-4d9e-935c-497e33772ccd	Frozen Garden Peas (1kg)	Fresh Frozen Garden Peas (1kg) for your home.	FROZ-001	\N	\N	0.60	1.10	0.00	pack	10	https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=800	0ca9f601-3ece-46ad-b3f6-3c24507c5aef	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	ea63ebc8-caaf-4d9e-935c-497e33772ccd	Pepperoni Feast Pizza	Fresh Pepperoni Feast Pizza for your home.	FROZ-002	\N	\N	1.20	3.00	20.00	pcs	10	https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800	c8e3bf87-036f-4a9a-a433-2ae5661785db	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	ea63ebc8-caaf-4d9e-935c-497e33772ccd	Premium Oven Chips (1.5kg)	Fresh Premium Oven Chips (1.5kg) for your home.	FROZ-003	\N	\N	1.40	2.50	0.00	pack	10	https://images.unsplash.com/photo-1573082891205-f495af91ad8d?w=800	dbc72f01-7c11-46b6-8a1e-63f96a3a1987	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	ea63ebc8-caaf-4d9e-935c-497e33772ccd	Vanilla Dairy Ice Cream (2L)	Fresh Vanilla Dairy Ice Cream (2L) for your home.	FROZ-004	\N	\N	1.80	3.20	20.00	pcs	10	https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800	1a741198-83f6-474c-b50c-7b2492a7c225	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	856694de-f57a-4a4b-bb22-76a04a9c36da	Basmati Rice (1kg)	Fresh Basmati Rice (1kg) for your home.	PANT-002	\N	\N	1.10	1.80	0.00	pack	10	https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800	1da2e48a-703c-435a-a44b-61d009fff020	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	856694de-f57a-4a4b-bb22-76a04a9c36da	Extra Virgin Olive Oil (500ml)	Fresh Extra Virgin Olive Oil (500ml) for your home.	PANT-003	\N	\N	2.80	4.50	0.00	pcs	10	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800	56a7ef29-f722-4d5f-8874-25ba296d280b	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	856694de-f57a-4a4b-bb22-76a04a9c36da	Chopped Tomatoes (400g)	Fresh Chopped Tomatoes (400g) for your home.	PANT-004	\N	\N	0.30	0.55	0.00	pcs	10	https://images.unsplash.com/photo-1590422502859-99ff63de0f0d?w=800	3a9c5c80-7001-4f0f-a5ca-4cfdcc553a2c	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	856694de-f57a-4a4b-bb22-76a04a9c36da	Baked Beans in Tomato Sauce	Fresh Baked Beans in Tomato Sauce for your home.	PANT-005	\N	\N	0.25	0.45	0.00	pcs	10	https://images.unsplash.com/photo-1595123550441-df232b5accc1?w=800	d8b200c7-cec6-4959-befd-5380061fde63	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f6c982bd-efe7-46be-a9de-0fd94b6b7aa3	Smooth Orange Juice (1L)	Fresh Smooth Orange Juice (1L) for your home.	BEV-001	\N	\N	0.85	1.40	0.00	pcs	10	https://images.unsplash.com/photo-1613478202669-487bc5f77a2e?w=800	651cf6a3-b0d2-4bfa-9081-c360583a570a	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	856694de-f57a-4a4b-bb22-76a04a9c36da	Penne Rigate Pasta (500g)	Fresh Penne Rigate Pasta (500g) for your home.	PANT-001	5010215239107	\N	0.40	0.75	0.00	pack	10	https://images.unsplash.com/photo-1551462147-37885acc3c41?w=800	1293b2f7-2c43-48d1-958b-7195b4152428	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:01:44.089222+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8a37383a-66a0-4dec-8696-352886772655	Fairtrade Bananas (Bunch)	Fresh Fairtrade Bananas (Bunch) for your home.	FRESH-002	5017377820259	\N	0.80	1.15	0.00	bunch	10	https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800	cf36c46a-6094-4268-aecf-aae25771442f	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:01:54.808303+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8a37383a-66a0-4dec-8696-352886772655	Loose Carrots (1kg)	Fresh Loose Carrots (1kg) for your home.	FRESH-003	5014623237526	\N	0.40	0.65	0.00	kg	10	https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800	eedfec5e-f2c7-4049-8bed-ca50681e55a2	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:02:04.092275+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8a37383a-66a0-4dec-8696-352886772655	Broccoli Crowns (350g)	Fresh Broccoli Crowns (350g) for your home.	FRESH-004	5010112204116	\N	0.50	0.80	0.00	pcs	10	https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800	2f3d5e8b-f4ae-4fb7-ae5b-1f9369db9c23	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:02:29.093535+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	7403534c-fef9-42c7-8a9d-9bdba12632be	Chicken Breast Fillets (650g)	Fresh Chicken Breast Fillets (650g) for your home.	MEAT-001	5019176280135	\N	3.50	5.50	0.00	pack	10	https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800	81cdd358-a143-4a7d-86c4-2948c3aa72bc	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:06:35.547628+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8bdc5ff3-2e59-4e35-a225-5988e47ddf2d	Mature British Cheddar (400g)	Fresh Mature British Cheddar (400g) for your home.	DAIRY-003	5012021531468	\N	2.20	3.40	0.00	pcs	10	https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=800	1a210d3d-8721-485e-b1af-193e5d08562b	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:06:48.482523+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f6c982bd-efe7-46be-a9de-0fd94b6b7aa3	Sparkling Spring Water (1.5L)	Fresh Sparkling Spring Water (1.5L) for your home.	BEV-003	\N	\N	0.35	0.65	20.00	pcs	10	https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800	bf90eac9-6a99-4cd2-9892-2cdc0f7c9435	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f6c982bd-efe7-46be-a9de-0fd94b6b7aa3	Instant Coffee Gold Roast (200g)	Fresh Instant Coffee Gold Roast (200g) for your home.	BEV-004	\N	\N	2.50	4.80	0.00	pcs	10	https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800	c45d7191-4062-4b13-acd1-0fded8f6d627	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f6c982bd-efe7-46be-a9de-0fd94b6b7aa3	Cloudy Apple Juice (1L)	Fresh Cloudy Apple Juice (1L) for your home.	BEV-005	\N	\N	0.95	1.60	0.00	pcs	10	https://images.unsplash.com/photo-1568284424968-f944ff1e11a1?w=800	0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	0e9ac16c-24c0-4f3f-bbd7-e395190e3997	Eco Washing Up Liquid (500ml)	Fresh Eco Washing Up Liquid (500ml) for your home.	HOME-001	\N	\N	0.70	1.25	20.00	pcs	10	https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800	e0a244bd-48f3-4ba6-8200-16acca3d92fd	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	0e9ac16c-24c0-4f3f-bbd7-e395190e3997	Recycled Kitchen Roll (2 Pack)	Fresh Recycled Kitchen Roll (2 Pack) for your home.	HOME-002	\N	\N	0.90	1.60	20.00	pack	10	https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800	a80d9b6f-430f-451c-b54a-eaf8ae6e234f	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	0e9ac16c-24c0-4f3f-bbd7-e395190e3997	All-Purpose Surface Cleaner	Fresh All-Purpose Surface Cleaner for your home.	HOME-003	\N	\N	1.10	1.95	20.00	pcs	10	https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800	4f265ce6-1a44-4f06-a920-8d8161a84f2a	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	0e9ac16c-24c0-4f3f-bbd7-e395190e3997	Toilet Tissue Soft White (9 Pack)	Fresh Toilet Tissue Soft White (9 Pack) for your home.	HOME-004	\N	\N	2.00	3.80	20.00	pack	10	https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800	055ea93d-5ae9-43fc-adf8-37bb72b98d1a	2026-04-13 11:42:27.17566+05:30	2026-04-13 11:42:27.17566+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	8a37383a-66a0-4dec-8696-352886772655	Gala Apples (6 Pack)	Fresh Gala Apples (6 Pack) for your home.	FRESH-001	5016111146372	\N	1.20	1.85	0.00	pack	10	https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=800	8036790a-b809-4b53-913a-9f23d7bd7ded	2026-04-13 11:42:27.17566+05:30	2026-04-19 20:58:23.523241+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	f6c982bd-efe7-46be-a9de-0fd94b6b7aa3	English Breakfast Tea (80 Bags)	Fresh English Breakfast Tea (80 Bags) for your home.	BEV-002	5017062672293	\N	1.20	2.10	0.00	pack	10	https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800	65f564f7-11e2-4ca1-8391-0dd4fdc89c54	2026-04-13 11:42:27.17566+05:30	2026-04-19 21:06:41.553015+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	1da940f4-28fa-4fd0-b53a-7810d9f46c5c	Biscuit	Its a biscuit	BISC-228886	5010907307619	product:BISC-228886	100.00	160.00	0.00	pcs	10	/uploads/products/product_9eb9887d-cadd-44c2-8186-4f16dde96fa2_d1e7d97b.jpg	9eb9887d-cadd-44c2-8186-4f16dde96fa2	2026-04-12 11:30:40.962898+05:30	2026-04-12 11:31:33.40069+05:30	f	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotions (organization_id, store_id, name, description, promotion_type, config, starts_at, ends_at, is_active, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (token_hash, user_id, customer_id, expires_at, is_revoked, revoked_at, device_info, replaced_by, id, created_at, updated_at, is_deleted) FROM stdin;
e573fb533f87b98da7506d9faeeeb1643add37d72581617b8c0a3803aadf4b28	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-18 00:43:42.873469+05:30	f	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	b408ec0b-906f-4f57-a5b4-894731765710	2026-04-18 00:43:42.875425+05:30	2026-04-18 00:43:42.875428+05:30	f
05bbd31b02c4e7b4c1d1c3b027f4422b1ee6f53b043df31ff896745f8ed72b97	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-18 13:12:04.866055+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	63828ea4-c4ec-4b40-9756-9373094233d2	2026-04-18 13:12:04.868061+05:30	2026-04-18 13:12:04.868064+05:30	f
7109b50ee147331b8afc0d3484f970af35a4186b10f7c111b49affe2f46f7e3d	\N	4a335597-2d55-4a29-aeaa-f71c7face9ac	2026-05-18 13:19:23.74874+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	4b62baa3-e6ef-4b1c-8468-b919e985608a	2026-04-18 13:19:23.751428+05:30	2026-04-18 13:19:23.751432+05:30	f
0dc4a69aa39bc77d87fdbe9303597e6435b529a1648c57780a806dcc9aff3bdd	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-18 13:23:10.947939+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	0d4a366c-43b8-4053-818a-34cd60d01f6d	2026-04-18 13:23:10.962996+05:30	2026-04-18 13:23:10.963029+05:30	f
0f602c1d781fdc93442f2cab9ed0f4c4fb80558456076ee410dc2b4e652dd595	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-18 13:40:45.910819+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	2e68f741-bbcd-427d-99fa-41837a8ba6e2	2026-04-18 13:40:45.951411+05:30	2026-04-18 13:40:45.951437+05:30	f
0cee9e4ff9dc42a55109a6e2548cd68a387a0f2efde3e29494f74f3a639c063d	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-18 13:41:43.174221+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	852620e4-b233-4264-ac96-260d7cd9057f	2026-04-18 13:41:43.17713+05:30	2026-04-18 13:41:43.177144+05:30	f
fcac5fc87457cd71a8d9310a1c71f15a25469dfe3feeb239bbb85dd59e5d705e	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-18 13:51:53.934839+05:30	f	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	67b238b9-9c26-48e9-9788-bb546d0048a7	2026-04-18 13:51:53.937458+05:30	2026-04-18 13:51:53.937462+05:30	f
678187cb6c327d6eb8f66b0b1122ec69cf35e99d8befa6e2061c34b386ade4e2	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	2026-05-19 12:42:02.841772+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	b0fd3058-9dbb-4be4-a0ad-3b6884ea7b9d	2026-04-19 12:42:02.842747+05:30	2026-04-19 12:42:02.842749+05:30	f
9dd75f892800219e28fd4d42c8dc6e14db0d9b243702462c0e709ce1affe51cc	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	\N	2026-05-19 20:56:37.195082+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	70acc88b-554a-44e4-8548-7604b43bdeaa	2026-04-19 20:56:37.196746+05:30	2026-04-19 20:56:37.196901+05:30	f
199daea16e9d13ecf0d725b946e2c6146ea9efddc7ab65484243074ead7ff3cc	\N	fb8800d1-498c-4b64-8307-07f6b6338186	2026-05-19 22:16:08.810047+05:30	f	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	\N	15032261-c9c2-4fb8-99c9-9179de24b7eb	2026-04-19 22:16:08.811666+05:30	2026-04-19 22:16:08.811668+05:30	f
\.


--
-- Data for Name: refund_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refund_items (refund_id, order_item_id, quantity, amount, reason, status, id, created_at, updated_at, is_deleted, admin_notes, requires_manual_review) FROM stdin;
6f1c9e25-423c-4c55-8661-1ab6c5d8416d	b8f66b59-2e28-4958-be75-d64a2c1d1f02	1.000	5.50	Legacy Refund Migration	approved	b0d591d6-e016-4e13-81f0-41b8b264e778	2026-04-19 22:09:10.12779+05:30	2026-04-19 22:09:10.127792+05:30	f	Auto-migrated from legacy full-order system.	t
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refunds (order_id, customer_id, status, admin_notes, processed_by, id, created_at, updated_at, is_deleted, total_amount, destination) FROM stdin;
1e4874c0-5df5-493a-9a15-155d90845802	fb8800d1-498c-4b64-8307-07f6b6338186	approved		ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	6f1c9e25-423c-4c55-8661-1ab6c5d8416d	2026-04-18 13:24:48.516734+05:30	2026-04-19 12:43:14.41862+05:30	f	5.50	wallet
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (order_id, customer_id, store_id, store_rating, delivery_rating, comment, is_published, store_response, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: reward_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reward_events (customer_id, store_id, tier_id, coupon_id, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: rewards_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rewards_tiers (organization_id, name, threshold_amount, reward_type, reward_value, expiry_days, store_id, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (product_id, store_id, from_store_id, quantity, movement_type, reference, notes, performed_by, id, created_at, updated_at, is_deleted) FROM stdin;
9eb9887d-cadd-44c2-8186-4f16dde96fa2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	100	initial	Initial stock on product creation	\N	\N	7bf62007-4d7d-4dff-a57a-64a5ed8b4a72	2026-04-12 11:30:41.079339+05:30	2026-04-12 11:30:41.079342+05:30	f
9eb9887d-cadd-44c2-8186-4f16dde96fa2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-1	order_packed	ORD-2V931VLR	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	2695b823-39c0-4111-bf79-a637062f4bc6	2026-04-12 22:30:10.967795+05:30	2026-04-12 22:30:10.967797+05:30	f
9eb9887d-cadd-44c2-8186-4f16dde96fa2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-1	order_packed	ORD-YEOFDPU1	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	1ae65dee-8e7d-48ef-ad4f-a9142b24f567	2026-04-13 00:09:45.35157+05:30	2026-04-13 00:09:45.351572+05:30	f
9eb9887d-cadd-44c2-8186-4f16dde96fa2	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-1	order_packed	ORD-L9XTLUKV	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	0bad0931-025e-4f3e-9fb7-317d18b4daff	2026-04-13 09:40:52.666627+05:30	2026-04-13 09:40:52.666629+05:30	f
1da2e48a-703c-435a-a44b-61d009fff020	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-1	order_packed	ORD-NXCYYMRN	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	f63b1682-5605-4c72-a000-e6aa2e2eda87	2026-04-18 00:34:24.656359+05:30	2026-04-18 00:34:24.65636+05:30	f
0161e8d8-2b2a-43b6-9927-9eb00a68a5a8	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-2	order_packed	ORD-NXCYYMRN	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	69c84108-7dc7-44f0-bca5-d8ed99755d0d	2026-04-18 00:34:25.164226+05:30	2026-04-18 00:34:25.164228+05:30	f
620088bb-442c-42b7-8b7b-59cb2f7bc0ee	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-2	order_packed	ORD-W6ZKUIS0	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	5f7f7a0f-c037-4d95-8f64-ba65e7c2ac35	2026-04-19 13:11:30.380008+05:30	2026-04-19 13:11:30.38001+05:30	f
cc7bf748-f246-4321-8a32-cdc0cdbe3e00	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-1	order_packed	ORD-W6ZKUIS0	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	07e54b18-b997-4931-8177-c9b12a789163	2026-04-19 13:11:30.383607+05:30	2026-04-19 13:11:30.383609+05:30	f
77974897-e4b7-4f62-8da0-7a181d462283	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	\N	-1	order_packed	ORD-W6ZKUIS0	\N	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	bcf1af1b-7577-433a-8db3-3b4e7abc5aaa	2026-04-19 13:11:30.385726+05:30	2026-04-19 13:11:30.385728+05:30	f
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stores (organization_id, name, code, address, city, state, country, phone, email, is_active, id, created_at, updated_at, is_deleted, slug, store_type, description, logo_url, banner_url, lat, lng, opening_hours, default_delivery_fee, free_delivery_threshold, min_order_value, avg_prep_time_min, is_open, temporarily_closed_reason, surge_multiplier, is_surge_active) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	Go Local	NE33 4BT	50-52 Stanhope Road	South Shields	North East	UK	+441234567	golocal@gmail.com	t	345bbcbf-0762-4572-9274-da08232bbde5	2026-04-13 09:49:32.053593+05:30	2026-04-13 11:04:22.582925+05:30	f	\N	\N	\N	\N	\N	\N	\N	null	1.99	30.00	10.00	15	t	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	Family Shopper	S20 4TA	9-10 Halfway Center	Sheffield	South Yorkshire	UK	+442546875	halfway@store.com	t	4a40ff36-86e2-4a9f-8cf6-a1616574fd06	2026-04-12 11:19:39.694844+05:30	2026-04-13 11:04:38.473166+05:30	f	\N	\N	\N	\N	\N	\N	\N	\N	1.99	30.00	10.00	15	t	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	Premier Key Korner Service Station	DN14 8DF	Low Street, Swinelfeet	Goole	East Yorkshire	UK	+44123787945	goole@store.com	t	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	2026-04-12 11:12:30.283912+05:30	2026-04-13 11:05:11.64473+05:30	f	\N	\N	\N	\N	\N	\N	\N	\N	1.99	30.00	10.00	15	t	\N	\N	\N
a859fb85-b615-4a1a-a6a9-a37448e044bf	Stocksfield Village Store	NE43 7LA	Alexandra House	Stocksfield	Northumberland	UK	+4456789512	stocksfield@store.com	t	fe50ef86-5e53-49ea-982d-f79efe505a01	2026-04-13 11:07:00.489395+05:30	2026-04-13 11:07:00.48941+05:30	f	\N	\N	\N	\N	\N	\N	\N	null	1.99	30.00	10.00	15	t	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (organization_id, store_id, email, hashed_password, full_name, role, phone, is_active, id, created_at, updated_at, is_deleted) FROM stdin;
a859fb85-b615-4a1a-a6a9-a37448e044bf	b4efdc9b-fe1d-411d-b163-8f5f2a9fb09d	admin@ukgrocery.com	$2b$12$lUiyv771q2qov2zeZZpR4uuOTAtMEHfOvu4xq32WIV.0RGe/H9Pte	Super Admin	admin	\N	t	ce428fa6-d6f3-4ad5-9f9a-9a8312794da7	2026-04-12 11:12:30.283912+05:30	2026-04-12 11:12:30.283912+05:30	f
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallet_transactions (customer_id, amount, transaction_type, source, reference_id, notes, balance_after, id, created_at, updated_at, is_deleted) FROM stdin;
fb8800d1-498c-4b64-8307-07f6b6338186	5.50	credit	refund	6f1c9e25-423c-4c55-8661-1ab6c5d8416d	Refund for order. Reason: Other: The item arrived crushed and unusable.	5.50	144be519-af7b-468f-b04a-8b80867b81ca	2026-04-19 12:43:14.436373+05:30	2026-04-19 12:43:14.436376+05:30	f
\.


--
-- Data for Name: webhook_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_deliveries (endpoint_id, event_type, payload, response_status, response_body, attempts, delivered, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Data for Name: webhook_endpoints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_endpoints (organization_id, url, secret, events, is_active, description, id, created_at, updated_at, is_deleted) FROM stdin;
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupon_redemptions coupon_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customer_monthly_spends customer_monthly_spends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_monthly_spends
    ADD CONSTRAINT customer_monthly_spends_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_zones delivery_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);


--
-- Name: driver_profiles driver_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_profiles
    ADD CONSTRAINT driver_profiles_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: platform_configs platform_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_configs
    ADD CONSTRAINT platform_configs_pkey PRIMARY KEY (id);


--
-- Name: postcode_zone_mappings postcode_zone_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postcode_zone_mappings
    ADD CONSTRAINT postcode_zone_mappings_pkey PRIMARY KEY (postcode, id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refund_items refund_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT refund_items_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reward_events reward_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_events
    ADD CONSTRAINT reward_events_pkey PRIMARY KEY (id);


--
-- Name: rewards_tiers rewards_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards_tiers
    ADD CONSTRAINT rewards_tiers_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: inventory uq_inventory_product_store; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT uq_inventory_product_store UNIQUE (product_id, store_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhook_endpoints webhook_endpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_endpoints
    ADD CONSTRAINT webhook_endpoints_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_organization_id ON public.audit_logs USING btree (organization_id);


--
-- Name: ix_audit_logs_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_store_id ON public.audit_logs USING btree (store_id);


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_banners_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_banners_organization_id ON public.banners USING btree (organization_id);


--
-- Name: ix_categories_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_categories_organization_id ON public.categories USING btree (organization_id);


--
-- Name: ix_coupons_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_coupons_code ON public.coupons USING btree (code);


--
-- Name: ix_coupons_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_coupons_organization_id ON public.coupons USING btree (organization_id);


--
-- Name: ix_customer_addresses_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_addresses_customer_id ON public.customer_addresses USING btree (customer_id);


--
-- Name: ix_customer_addresses_postcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_addresses_postcode ON public.customer_addresses USING btree (postcode);


--
-- Name: ix_customer_monthly_spends_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_monthly_spends_customer_id ON public.customer_monthly_spends USING btree (customer_id);


--
-- Name: ix_customer_monthly_spends_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_monthly_spends_store_id ON public.customer_monthly_spends USING btree (store_id);


--
-- Name: ix_customer_monthly_spends_year_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_monthly_spends_year_month ON public.customer_monthly_spends USING btree (year_month);


--
-- Name: ix_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_email ON public.customers USING btree (email);


--
-- Name: ix_customers_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customers_organization_id ON public.customers USING btree (organization_id);


--
-- Name: ix_customers_referral_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_referral_code ON public.customers USING btree (referral_code);


--
-- Name: ix_delivery_zones_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_delivery_zones_store_id ON public.delivery_zones USING btree (store_id);


--
-- Name: ix_driver_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_driver_profiles_user_id ON public.driver_profiles USING btree (user_id);


--
-- Name: ix_feature_flags_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_feature_flags_key ON public.feature_flags USING btree (key);


--
-- Name: ix_feature_flags_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_feature_flags_organization_id ON public.feature_flags USING btree (organization_id);


--
-- Name: ix_inventory_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inventory_product_id ON public.inventory USING btree (product_id);


--
-- Name: ix_inventory_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inventory_store_id ON public.inventory USING btree (store_id);


--
-- Name: ix_notifications_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_customer_id ON public.notifications USING btree (customer_id);


--
-- Name: ix_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: ix_order_status_history_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_status_history_order_id ON public.order_status_history USING btree (order_id);


--
-- Name: ix_orders_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_assigned_to ON public.orders USING btree (assigned_to);


--
-- Name: ix_orders_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: ix_orders_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: ix_orders_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_organization_id ON public.orders USING btree (organization_id);


--
-- Name: ix_orders_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_store_id ON public.orders USING btree (store_id);


--
-- Name: ix_organizations_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_organizations_slug ON public.organizations USING btree (slug);


--
-- Name: ix_platform_configs_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_platform_configs_key ON public.platform_configs USING btree (key);


--
-- Name: ix_platform_configs_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_platform_configs_organization_id ON public.platform_configs USING btree (organization_id);


--
-- Name: ix_postcode_zone_mappings_postcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_postcode_zone_mappings_postcode ON public.postcode_zone_mappings USING btree (postcode);


--
-- Name: ix_products_barcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_products_barcode ON public.products USING btree (barcode);


--
-- Name: ix_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_category_id ON public.products USING btree (category_id);


--
-- Name: ix_products_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_organization_id ON public.products USING btree (organization_id);


--
-- Name: ix_products_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_search ON public.products USING gin (search_vector);


--
-- Name: ix_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_products_sku ON public.products USING btree (sku);


--
-- Name: ix_promotions_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_promotions_organization_id ON public.promotions USING btree (organization_id);


--
-- Name: ix_promotions_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_promotions_store_id ON public.promotions USING btree (store_id);


--
-- Name: ix_refresh_tokens_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_refresh_tokens_token_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: ix_refund_items_composite_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refund_items_composite_lookup ON public.refund_items USING btree (order_item_id, status);


--
-- Name: ix_refund_items_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refund_items_order_item_id ON public.refund_items USING btree (order_item_id);


--
-- Name: ix_refund_items_pending_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_refund_items_pending_unique ON public.refund_items USING btree (order_item_id) WHERE ((status)::text = 'pending'::text);


--
-- Name: ix_refund_items_refund_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refund_items_refund_id ON public.refund_items USING btree (refund_id);


--
-- Name: ix_refunds_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refunds_customer_id ON public.refunds USING btree (customer_id);


--
-- Name: ix_refunds_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_refunds_order_id ON public.refunds USING btree (order_id);


--
-- Name: ix_reviews_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_customer_id ON public.reviews USING btree (customer_id);


--
-- Name: ix_reviews_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_order_id ON public.reviews USING btree (order_id);


--
-- Name: ix_reviews_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_store_id ON public.reviews USING btree (store_id);


--
-- Name: ix_stock_movements_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_movements_product_id ON public.stock_movements USING btree (product_id);


--
-- Name: ix_stock_movements_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_movements_store_id ON public.stock_movements USING btree (store_id);


--
-- Name: ix_stores_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stores_code ON public.stores USING btree (code);


--
-- Name: ix_stores_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stores_organization_id ON public.stores USING btree (organization_id);


--
-- Name: ix_stores_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_stores_slug ON public.stores USING btree (slug);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_organization_id ON public.users USING btree (organization_id);


--
-- Name: ix_users_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_store_id ON public.users USING btree (store_id);


--
-- Name: ix_wallet_transactions_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_wallet_transactions_customer_id ON public.wallet_transactions USING btree (customer_id);


--
-- Name: ix_webhook_deliveries_endpoint_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_webhook_deliveries_endpoint_id ON public.webhook_deliveries USING btree (endpoint_id);


--
-- Name: ix_webhook_endpoints_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_webhook_endpoints_organization_id ON public.webhook_endpoints USING btree (organization_id);


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: banners banners_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: banners banners_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: categories categories_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: coupon_redemptions coupon_redemptions_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_issued_to_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_issued_to_customer_id_fkey FOREIGN KEY (issued_to_customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_monthly_spends customer_monthly_spends_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_monthly_spends
    ADD CONSTRAINT customer_monthly_spends_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_monthly_spends customer_monthly_spends_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_monthly_spends
    ADD CONSTRAINT customer_monthly_spends_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: customers customers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: customers customers_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: delivery_zones delivery_zones_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: driver_profiles driver_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_profiles
    ADD CONSTRAINT driver_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feature_flags feature_flags_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory inventory_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_substituted_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_substituted_product_id_fkey FOREIGN KEY (substituted_product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: orders orders_delivery_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.customer_addresses(id) ON DELETE SET NULL;


--
-- Name: orders orders_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: orders orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: platform_configs platform_configs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_configs
    ADD CONSTRAINT platform_configs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: postcode_zone_mappings postcode_zone_mappings_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postcode_zone_mappings
    ADD CONSTRAINT postcode_zone_mappings_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.delivery_zones(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refund_items refund_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT refund_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE RESTRICT;


--
-- Name: refund_items refund_items_refund_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT refund_items_refund_id_fkey FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE CASCADE;


--
-- Name: refunds refunds_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: refunds refunds_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: refunds refunds_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: reward_events reward_events_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_events
    ADD CONSTRAINT reward_events_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;


--
-- Name: reward_events reward_events_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_events
    ADD CONSTRAINT reward_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: reward_events reward_events_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_events
    ADD CONSTRAINT reward_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: reward_events reward_events_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_events
    ADD CONSTRAINT reward_events_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.rewards_tiers(id) ON DELETE CASCADE;


--
-- Name: rewards_tiers rewards_tiers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards_tiers
    ADD CONSTRAINT rewards_tiers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: rewards_tiers rewards_tiers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards_tiers
    ADD CONSTRAINT rewards_tiers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_from_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_from_store_id_fkey FOREIGN KEY (from_store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: stores stores_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: users users_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lMeGPhe0ekIt5MUYzsXVjizhcOYFnhSV3bReBNXFBNKCUAg4b8n2N2BaUPLp0WC

