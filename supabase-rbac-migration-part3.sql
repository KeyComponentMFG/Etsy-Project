-- ================================================
-- RBAC Migration PART 3: Update RLS policies
-- ================================================
-- Run this after Part 2 succeeds

-- First, drop old policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

DROP POLICY IF EXISTS "Users can view own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can insert own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can update own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can delete own archived_orders" ON archived_orders;

DROP POLICY IF EXISTS "Users can view own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can insert own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can update own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can delete own filaments" ON filaments;

DROP POLICY IF EXISTS "Users can view own models" ON models;
DROP POLICY IF EXISTS "Users can insert own models" ON models;
DROP POLICY IF EXISTS "Users can update own models" ON models;
DROP POLICY IF EXISTS "Users can delete own models" ON models;

DROP POLICY IF EXISTS "Users can view own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can insert own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can update own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can delete own external_parts" ON external_parts;

DROP POLICY IF EXISTS "Users can view own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can insert own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can update own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can delete own supply_categories" ON supply_categories;

DROP POLICY IF EXISTS "Users can view own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team_members" ON team_members;

DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

DROP POLICY IF EXISTS "Users can view own printers" ON printers;
DROP POLICY IF EXISTS "Users can insert own printers" ON printers;
DROP POLICY IF EXISTS "Users can update own printers" ON printers;
DROP POLICY IF EXISTS "Users can delete own printers" ON printers;

DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can delete own purchases" ON purchases;

DROP POLICY IF EXISTS "Users can view own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can insert own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can update own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can delete own filament_usage_history" ON filament_usage_history;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

-- Drop temporary policies from Part 1
DROP POLICY IF EXISTS "Allow all for authenticated" ON companies;
DROP POLICY IF EXISTS "Allow all for authenticated" ON user_profiles;

SELECT 'Part 3 (drop policies) completed successfully!' as status;
