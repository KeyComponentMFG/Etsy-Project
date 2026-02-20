-- ================================================
-- Authentication Migration for Business Manager
-- ================================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- This adds user_id columns and Row Level Security (RLS)
-- ================================================

-- ================================================
-- STEP 1: Add user_id column to all tables
-- ================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE models ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE supply_categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE printers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- ================================================
-- STEP 2: Create indexes for performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_orders_user_id ON archived_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_filaments_user_id ON filaments(user_id);
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_external_parts_user_id ON external_parts(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_categories_user_id ON supply_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_printers_user_id ON printers(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_filament_usage_history_user_id ON filament_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE filament_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 4: Create RLS Policies
-- ================================================

-- ORDERS table policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own orders" ON orders FOR DELETE USING (user_id = auth.uid());

-- ARCHIVED_ORDERS table policies
DROP POLICY IF EXISTS "Users can view own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can insert own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can update own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can delete own archived_orders" ON archived_orders;

CREATE POLICY "Users can view own archived_orders" ON archived_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own archived_orders" ON archived_orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own archived_orders" ON archived_orders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own archived_orders" ON archived_orders FOR DELETE USING (user_id = auth.uid());

-- FILAMENTS table policies
DROP POLICY IF EXISTS "Users can view own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can insert own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can update own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can delete own filaments" ON filaments;

CREATE POLICY "Users can view own filaments" ON filaments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own filaments" ON filaments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own filaments" ON filaments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own filaments" ON filaments FOR DELETE USING (user_id = auth.uid());

-- MODELS table policies
DROP POLICY IF EXISTS "Users can view own models" ON models;
DROP POLICY IF EXISTS "Users can insert own models" ON models;
DROP POLICY IF EXISTS "Users can update own models" ON models;
DROP POLICY IF EXISTS "Users can delete own models" ON models;

CREATE POLICY "Users can view own models" ON models FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own models" ON models FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own models" ON models FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own models" ON models FOR DELETE USING (user_id = auth.uid());

-- EXTERNAL_PARTS table policies
DROP POLICY IF EXISTS "Users can view own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can insert own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can update own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can delete own external_parts" ON external_parts;

CREATE POLICY "Users can view own external_parts" ON external_parts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own external_parts" ON external_parts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own external_parts" ON external_parts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own external_parts" ON external_parts FOR DELETE USING (user_id = auth.uid());

-- SUPPLY_CATEGORIES table policies
DROP POLICY IF EXISTS "Users can view own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can insert own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can update own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can delete own supply_categories" ON supply_categories;

CREATE POLICY "Users can view own supply_categories" ON supply_categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own supply_categories" ON supply_categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own supply_categories" ON supply_categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own supply_categories" ON supply_categories FOR DELETE USING (user_id = auth.uid());

-- TEAM_MEMBERS table policies
DROP POLICY IF EXISTS "Users can view own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team_members" ON team_members;

CREATE POLICY "Users can view own team_members" ON team_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own team_members" ON team_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own team_members" ON team_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own team_members" ON team_members FOR DELETE USING (user_id = auth.uid());

-- STORES table policies
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

CREATE POLICY "Users can view own stores" ON stores FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own stores" ON stores FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own stores" ON stores FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own stores" ON stores FOR DELETE USING (user_id = auth.uid());

-- PRINTERS table policies
DROP POLICY IF EXISTS "Users can view own printers" ON printers;
DROP POLICY IF EXISTS "Users can insert own printers" ON printers;
DROP POLICY IF EXISTS "Users can update own printers" ON printers;
DROP POLICY IF EXISTS "Users can delete own printers" ON printers;

CREATE POLICY "Users can view own printers" ON printers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own printers" ON printers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own printers" ON printers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own printers" ON printers FOR DELETE USING (user_id = auth.uid());

-- PURCHASES table policies
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can delete own purchases" ON purchases;

CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own purchases" ON purchases FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own purchases" ON purchases FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own purchases" ON purchases FOR DELETE USING (user_id = auth.uid());

-- FILAMENT_USAGE_HISTORY table policies
DROP POLICY IF EXISTS "Users can view own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can insert own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can update own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can delete own filament_usage_history" ON filament_usage_history;

CREATE POLICY "Users can view own filament_usage_history" ON filament_usage_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own filament_usage_history" ON filament_usage_history FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own filament_usage_history" ON filament_usage_history FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own filament_usage_history" ON filament_usage_history FOR DELETE USING (user_id = auth.uid());

-- SUBSCRIPTIONS table policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (user_id = auth.uid());

-- ================================================
-- OPTIONAL: Migrate existing data to a specific user
-- ================================================
-- After creating your first account, get your user ID from:
-- Supabase Dashboard > Authentication > Users
-- Then run this to assign existing data to your account:
--
-- UPDATE orders SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE archived_orders SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE filaments SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE models SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE external_parts SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE supply_categories SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE team_members SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE stores SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE printers SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE purchases SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE filament_usage_history SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE subscriptions SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
