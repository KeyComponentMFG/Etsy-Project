-- ================================================
-- Role-Based Access Control Migration
-- ================================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- This adds company structure with admin/member roles
-- ================================================

-- ================================================
-- STEP 1: Create Companies Table
-- ================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_companies_invite_code ON companies(invite_code);

-- ================================================
-- STEP 2: Create User Profiles Table
-- ================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for user profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- ================================================
-- STEP 3: Add company_id and owner_id to existing tables
-- ================================================

-- ORDERS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON orders(owner_id);

-- ARCHIVED_ORDERS
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_archived_orders_company_id ON archived_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_archived_orders_owner_id ON archived_orders(owner_id);

-- FILAMENTS (Materials)
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_filaments_company_id ON filaments(company_id);
CREATE INDEX IF NOT EXISTS idx_filaments_owner_id ON filaments(owner_id);

-- MODELS
ALTER TABLE models ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE models ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_models_company_id ON models(company_id);
CREATE INDEX IF NOT EXISTS idx_models_owner_id ON models(owner_id);

-- EXTERNAL_PARTS
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_external_parts_company_id ON external_parts(company_id);
CREATE INDEX IF NOT EXISTS idx_external_parts_owner_id ON external_parts(owner_id);

-- SUPPLY_CATEGORIES
ALTER TABLE supply_categories ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE supply_categories ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_supply_categories_company_id ON supply_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_supply_categories_owner_id ON supply_categories(owner_id);

-- TEAM_MEMBERS
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);

-- STORES
ALTER TABLE stores ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_stores_company_id ON stores(company_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- PRINTERS
ALTER TABLE printers ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
-- Note: printers may already have owner_id for team member ownership
CREATE INDEX IF NOT EXISTS idx_printers_company_id ON printers(company_id);

-- PURCHASES
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_owner_id ON purchases(owner_id);

-- FILAMENT_USAGE_HISTORY
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_filament_usage_history_company_id ON filament_usage_history(company_id);
CREATE INDEX IF NOT EXISTS idx_filament_usage_history_owner_id ON filament_usage_history(owner_id);

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON subscriptions(owner_id);

-- ================================================
-- STEP 4: Enable RLS on new tables
-- ================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 5: RLS Policies for Companies
-- ================================================

DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Users can create company" ON companies;

CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create company" ON companies
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- ================================================
-- STEP 6: RLS Policies for User Profiles
-- ================================================

DROP POLICY IF EXISTS "Users can view company profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

CREATE POLICY "Users can view company profiles" ON user_profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles up WHERE up.user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update profiles" ON user_profiles
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
    AND user_id != auth.uid()
  );

-- ================================================
-- STEP 7: Drop old user_id policies and create new company-based policies
-- ================================================

-- ORDERS table policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

CREATE POLICY "Company members can view orders" ON orders
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert orders" ON orders
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update orders" ON orders
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete orders" ON orders
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- ARCHIVED_ORDERS table policies
DROP POLICY IF EXISTS "Users can view own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can insert own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can update own archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Users can delete own archived_orders" ON archived_orders;

CREATE POLICY "Company members can view archived_orders" ON archived_orders
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert archived_orders" ON archived_orders
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update archived_orders" ON archived_orders
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete archived_orders" ON archived_orders
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- FILAMENTS table policies
DROP POLICY IF EXISTS "Users can view own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can insert own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can update own filaments" ON filaments;
DROP POLICY IF EXISTS "Users can delete own filaments" ON filaments;

CREATE POLICY "Company members can view filaments" ON filaments
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert filaments" ON filaments
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update filaments" ON filaments
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete filaments" ON filaments
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- MODELS table policies
DROP POLICY IF EXISTS "Users can view own models" ON models;
DROP POLICY IF EXISTS "Users can insert own models" ON models;
DROP POLICY IF EXISTS "Users can update own models" ON models;
DROP POLICY IF EXISTS "Users can delete own models" ON models;

CREATE POLICY "Company members can view models" ON models
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert models" ON models
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update models" ON models
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete models" ON models
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- EXTERNAL_PARTS table policies
DROP POLICY IF EXISTS "Users can view own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can insert own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can update own external_parts" ON external_parts;
DROP POLICY IF EXISTS "Users can delete own external_parts" ON external_parts;

CREATE POLICY "Company members can view external_parts" ON external_parts
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert external_parts" ON external_parts
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update external_parts" ON external_parts
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete external_parts" ON external_parts
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- SUPPLY_CATEGORIES table policies
DROP POLICY IF EXISTS "Users can view own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can insert own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can update own supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Users can delete own supply_categories" ON supply_categories;

CREATE POLICY "Company members can view supply_categories" ON supply_categories
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert supply_categories" ON supply_categories
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update supply_categories" ON supply_categories
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete supply_categories" ON supply_categories
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- TEAM_MEMBERS table policies
DROP POLICY IF EXISTS "Users can view own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team_members" ON team_members;

CREATE POLICY "Company members can view team_members" ON team_members
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert team_members" ON team_members
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update team_members" ON team_members
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete team_members" ON team_members
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- STORES table policies
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

CREATE POLICY "Company members can view stores" ON stores
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert stores" ON stores
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update stores" ON stores
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete stores" ON stores
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- PRINTERS table policies
DROP POLICY IF EXISTS "Users can view own printers" ON printers;
DROP POLICY IF EXISTS "Users can insert own printers" ON printers;
DROP POLICY IF EXISTS "Users can update own printers" ON printers;
DROP POLICY IF EXISTS "Users can delete own printers" ON printers;

CREATE POLICY "Company members can view printers" ON printers
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert printers" ON printers
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update printers" ON printers
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete printers" ON printers
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- PURCHASES table policies
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can delete own purchases" ON purchases;

CREATE POLICY "Company members can view purchases" ON purchases
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert purchases" ON purchases
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update purchases" ON purchases
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete purchases" ON purchases
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- FILAMENT_USAGE_HISTORY table policies
DROP POLICY IF EXISTS "Users can view own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can insert own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can update own filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Users can delete own filament_usage_history" ON filament_usage_history;

CREATE POLICY "Company members can view filament_usage_history" ON filament_usage_history
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert filament_usage_history" ON filament_usage_history
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update filament_usage_history" ON filament_usage_history
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete filament_usage_history" ON filament_usage_history
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- SUBSCRIPTIONS table policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

CREATE POLICY "Company members can view subscriptions" ON subscriptions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can update subscriptions" ON subscriptions
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete subscriptions" ON subscriptions
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
      OR owner_id = auth.uid()
    )
  );

-- ================================================
-- OPTIONAL: Migrate existing data
-- ================================================
-- After creating your company and getting your company_id:
-- 1. Get your user_id from Supabase Auth > Users
-- 2. Get your company_id from the companies table
-- 3. Run these to migrate existing data:
--
-- UPDATE orders SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE archived_orders SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE filaments SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE models SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE external_parts SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE supply_categories SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE team_members SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE stores SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE printers SET company_id = 'YOUR-COMPANY-UUID' WHERE company_id IS NULL;
-- UPDATE purchases SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE filament_usage_history SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
-- UPDATE subscriptions SET company_id = 'YOUR-COMPANY-UUID', owner_id = user_id WHERE company_id IS NULL;
