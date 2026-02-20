-- ================================================
-- RBAC Migration PART 4: Create new RLS policies
-- ================================================
-- Run this after Part 3 succeeds

-- Drop any existing policies on companies and user_profiles
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Users can create company" ON companies;
DROP POLICY IF EXISTS "Users can view company profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Drop any existing company-based policies on other tables
DROP POLICY IF EXISTS "Company members can view orders" ON orders;
DROP POLICY IF EXISTS "Company members can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins and owners can update orders" ON orders;
DROP POLICY IF EXISTS "Admins and owners can delete orders" ON orders;

DROP POLICY IF EXISTS "Company members can view archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Company members can insert archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Admins and owners can update archived_orders" ON archived_orders;
DROP POLICY IF EXISTS "Admins and owners can delete archived_orders" ON archived_orders;

DROP POLICY IF EXISTS "Company members can view filaments" ON filaments;
DROP POLICY IF EXISTS "Company members can insert filaments" ON filaments;
DROP POLICY IF EXISTS "Admins and owners can update filaments" ON filaments;
DROP POLICY IF EXISTS "Admins and owners can delete filaments" ON filaments;

DROP POLICY IF EXISTS "Company members can view models" ON models;
DROP POLICY IF EXISTS "Company members can insert models" ON models;
DROP POLICY IF EXISTS "Admins and owners can update models" ON models;
DROP POLICY IF EXISTS "Admins and owners can delete models" ON models;

DROP POLICY IF EXISTS "Company members can view external_parts" ON external_parts;
DROP POLICY IF EXISTS "Company members can insert external_parts" ON external_parts;
DROP POLICY IF EXISTS "Admins and owners can update external_parts" ON external_parts;
DROP POLICY IF EXISTS "Admins and owners can delete external_parts" ON external_parts;

DROP POLICY IF EXISTS "Company members can view supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Company members can insert supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Admins and owners can update supply_categories" ON supply_categories;
DROP POLICY IF EXISTS "Admins and owners can delete supply_categories" ON supply_categories;

DROP POLICY IF EXISTS "Company members can view team_members" ON team_members;
DROP POLICY IF EXISTS "Company members can insert team_members" ON team_members;
DROP POLICY IF EXISTS "Admins and owners can update team_members" ON team_members;
DROP POLICY IF EXISTS "Admins and owners can delete team_members" ON team_members;

DROP POLICY IF EXISTS "Company members can view stores" ON stores;
DROP POLICY IF EXISTS "Company members can insert stores" ON stores;
DROP POLICY IF EXISTS "Admins and owners can update stores" ON stores;
DROP POLICY IF EXISTS "Admins and owners can delete stores" ON stores;

DROP POLICY IF EXISTS "Company members can view printers" ON printers;
DROP POLICY IF EXISTS "Company members can insert printers" ON printers;
DROP POLICY IF EXISTS "Admins can update printers" ON printers;
DROP POLICY IF EXISTS "Admins can delete printers" ON printers;

DROP POLICY IF EXISTS "Company members can view purchases" ON purchases;
DROP POLICY IF EXISTS "Company members can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Admins and owners can update purchases" ON purchases;
DROP POLICY IF EXISTS "Admins and owners can delete purchases" ON purchases;

DROP POLICY IF EXISTS "Company members can view filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Company members can insert filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Admins and owners can update filament_usage_history" ON filament_usage_history;
DROP POLICY IF EXISTS "Admins and owners can delete filament_usage_history" ON filament_usage_history;

DROP POLICY IF EXISTS "Company members can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Company members can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins and owners can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins and owners can delete subscriptions" ON subscriptions;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Companies policies
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Users can create company" ON companies
  FOR INSERT WITH CHECK (true);

-- User profiles policies
CREATE POLICY "Users can view company profiles" ON user_profiles
  FOR SELECT USING (company_id = get_user_company_id() OR user_id = auth.uid());

CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update profiles" ON user_profiles
  FOR UPDATE USING (is_user_admin() OR user_id = auth.uid());

CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (is_user_admin() AND user_id != auth.uid());

-- Orders policies
CREATE POLICY "Company members can view orders" ON orders
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update orders" ON orders
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete orders" ON orders
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Archived orders policies
CREATE POLICY "Company members can view archived_orders" ON archived_orders
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert archived_orders" ON archived_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update archived_orders" ON archived_orders
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete archived_orders" ON archived_orders
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Filaments policies
CREATE POLICY "Company members can view filaments" ON filaments
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert filaments" ON filaments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update filaments" ON filaments
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete filaments" ON filaments
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Models policies
CREATE POLICY "Company members can view models" ON models
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert models" ON models
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update models" ON models
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete models" ON models
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- External parts policies
CREATE POLICY "Company members can view external_parts" ON external_parts
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert external_parts" ON external_parts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update external_parts" ON external_parts
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete external_parts" ON external_parts
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Supply categories policies
CREATE POLICY "Company members can view supply_categories" ON supply_categories
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert supply_categories" ON supply_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update supply_categories" ON supply_categories
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete supply_categories" ON supply_categories
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Team members policies
CREATE POLICY "Company members can view team_members" ON team_members
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert team_members" ON team_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update team_members" ON team_members
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete team_members" ON team_members
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Stores policies
CREATE POLICY "Company members can view stores" ON stores
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert stores" ON stores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update stores" ON stores
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete stores" ON stores
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Printers policies
CREATE POLICY "Company members can view printers" ON printers
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert printers" ON printers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update printers" ON printers
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND is_user_admin()
  );

CREATE POLICY "Admins can delete printers" ON printers
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND is_user_admin()
  );

-- Purchases policies
CREATE POLICY "Company members can view purchases" ON purchases
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert purchases" ON purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update purchases" ON purchases
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete purchases" ON purchases
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Filament usage history policies
CREATE POLICY "Company members can view filament_usage_history" ON filament_usage_history
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert filament_usage_history" ON filament_usage_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update filament_usage_history" ON filament_usage_history
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete filament_usage_history" ON filament_usage_history
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Subscriptions policies
CREATE POLICY "Company members can view subscriptions" ON subscriptions
  FOR SELECT USING (company_id = get_user_company_id() OR company_id IS NULL);

CREATE POLICY "Company members can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and owners can update subscriptions" ON subscriptions
  FOR UPDATE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Admins and owners can delete subscriptions" ON subscriptions
  FOR DELETE USING (
    (company_id = get_user_company_id() OR company_id IS NULL)
    AND (is_user_admin() OR owner_id = auth.uid() OR owner_id IS NULL)
  );

SELECT 'Part 4 completed successfully! RBAC migration complete.' as status;
