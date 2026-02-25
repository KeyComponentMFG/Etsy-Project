-- Fix RLS policy for user_profiles UPDATE
-- Allow users to update their own profile without recursive query issues

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create simple policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Create helper function for admin check (SECURITY DEFINER avoids recursion)
CREATE OR REPLACE FUNCTION is_admin_of_company(check_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy for admins to update other profiles in their company
CREATE POLICY "Admins can update company profiles" ON user_profiles
  FOR UPDATE USING (
    is_admin_of_company(company_id)
  );

SELECT 'Profile UPDATE policy fixed!' as status;
