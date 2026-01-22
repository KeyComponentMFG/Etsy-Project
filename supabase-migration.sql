-- Run this SQL in Supabase SQL Editor to ensure all columns exist
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this > Run

-- ORDERS TABLE
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at timestamp with time zone;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_start timestamp with time zone;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printer_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_stage text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_tax numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_replacement boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS material_cost numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS filament_used numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS model_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_extra_print boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_print_filament numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_print_minutes integer DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS additional_colors jsonb DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_plates jsonb DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS plate_colors jsonb DEFAULT '{}';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS plate_reprints jsonb DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_message text DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assignment_issue text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS used_external_part text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS override_ship_by_date date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra text;

-- ARCHIVED_ORDERS TABLE (same columns as orders plus archived_at)
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS item text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS extra text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS store_id text;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS fulfilled_at timestamp with time zone;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT now();
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS sales_tax numeric DEFAULT 0;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS material_cost numeric DEFAULT 0;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS filament_used numeric DEFAULT 0;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS additional_colors jsonb DEFAULT '[]';
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS completed_plates jsonb DEFAULT '[]';
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS plate_colors jsonb DEFAULT '{}';

-- MODELS TABLE
ALTER TABLE models ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE models ADD COLUMN IF NOT EXISTS variant_name text DEFAULT '';
ALTER TABLE models ADD COLUMN IF NOT EXISTS filament_usage numeric;
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_color text;
ALTER TABLE models ADD COLUMN IF NOT EXISTS external_parts jsonb DEFAULT '[]';
ALTER TABLE models ADD COLUMN IF NOT EXISTS store_id text;
ALTER TABLE models ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE models ADD COLUMN IF NOT EXISTS print_duration integer;
ALTER TABLE models ADD COLUMN IF NOT EXISTS printer_settings jsonb DEFAULT '[]';
ALTER TABLE models ADD COLUMN IF NOT EXISTS aliases jsonb DEFAULT '[]';
ALTER TABLE models ADD COLUMN IF NOT EXISTS file_3mf_url text DEFAULT '';
ALTER TABLE models ADD COLUMN IF NOT EXISTS folder text DEFAULT 'Uncategorized';
ALTER TABLE models ADD COLUMN IF NOT EXISTS processing_days integer DEFAULT 3;

-- FILAMENTS TABLE
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS remaining numeric DEFAULT 1000;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS member_id text;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS cost_per_gram numeric DEFAULT 0.02;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS brand text DEFAULT '';
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS reorder_at numeric DEFAULT 200;

-- PRINTERS TABLE
ALTER TABLE printers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE printers ADD COLUMN IF NOT EXISTS total_hours numeric DEFAULT 0;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS owner_id text;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS monthly_payment numeric DEFAULT 0;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS total_price numeric DEFAULT 0;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS remaining_balance numeric DEFAULT 0;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS payment_start_date timestamp with time zone;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS is_paid_off boolean DEFAULT false;

-- TEAM_MEMBERS TABLE
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS color text;

-- STORES TABLE
ALTER TABLE stores ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS platform text;

-- EXTERNAL_PARTS TABLE
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0;
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS member_id text;
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS category_id text;
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS reorder_at integer DEFAULT 5;
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS cost_per_unit numeric DEFAULT 0;

-- SUPPLY_CATEGORIES TABLE
ALTER TABLE supply_categories ADD COLUMN IF NOT EXISTS name text;

-- PURCHASES TABLE
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS total_cost numeric;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS unit_cost numeric;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS supplier text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- FILAMENT_USAGE_HISTORY TABLE
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS filament_id text;
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS timestamp timestamp with time zone DEFAULT now();
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS member_id text;
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS notes text;

-- SUBSCRIPTIONS TABLE
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cost numeric;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date date;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Success message
SELECT 'All columns added successfully!' as result;
