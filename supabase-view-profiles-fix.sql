-- Fix RLS policy for viewing all company members
-- This fixes the recursive query issue that prevents seeing other team members

-- Create helper function to get user's company (avoids recursion)
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Fix SELECT policy for user_profiles
DROP POLICY IF EXISTS "Users can view company profiles" ON user_profiles;
CREATE POLICY "Users can view company profiles" ON user_profiles
  FOR SELECT USING (
    company_id = get_my_company_id()
  );

SELECT 'Fixed! You should now see all company members.' as status;
