-- Add profile fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text;

-- Update the user_profiles when a user joins to also create a team_member entry
-- This function will be called after a profile is created
CREATE OR REPLACE FUNCTION sync_profile_to_team_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if team_member already exists for this user
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE company_id = NEW.company_id
    AND name = NEW.display_name
  ) THEN
    INSERT INTO team_members (company_id, name, owner_id)
    VALUES (NEW.company_id, NEW.display_name, NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync on profile creation
DROP TRIGGER IF EXISTS sync_profile_to_team_member_trigger ON user_profiles;
CREATE TRIGGER sync_profile_to_team_member_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_team_member();

SELECT 'Profile fields added and sync trigger created!' as status;
