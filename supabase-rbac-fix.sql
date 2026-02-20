-- Fix RLS policies for new user onboarding
-- New users need to be able to create companies and profiles

-- Fix user_profiles SELECT - users must be able to check if they have a profile
DROP POLICY IF EXISTS "Users can view company profiles" ON user_profiles;
CREATE POLICY "Users can view company profiles" ON user_profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR company_id IN (SELECT up.company_id FROM user_profiles up WHERE up.user_id = auth.uid())
  );

-- Fix companies - allow any authenticated user to SELECT (needed for invite code lookup)
DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    auth.uid() IS NOT NULL  -- Any authenticated user can query companies (for invite code lookup)
  );

-- Make sure companies INSERT works
DROP POLICY IF EXISTS "Users can create company" ON companies;
CREATE POLICY "Users can create company" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

SELECT 'Fix applied successfully!' as status;
