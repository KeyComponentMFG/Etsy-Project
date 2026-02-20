-- ================================================
-- RBAC Migration PART 1: Create new tables only
-- ================================================
-- Run this first to create companies and user_profiles tables

-- Create Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_companies_invite_code ON companies(invite_code);

-- Create User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  display_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies that allow authenticated users to do everything (temporary)
CREATE POLICY "Allow all for authenticated" ON companies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for authenticated" ON user_profiles FOR ALL USING (auth.uid() IS NOT NULL);

SELECT 'Part 1 completed successfully!' as status;
