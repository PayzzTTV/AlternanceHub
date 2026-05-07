-- Add user ownership to applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the open policy
DROP POLICY IF EXISTS "public_all_applications" ON applications;

-- Users can only see and modify their own applications
CREATE POLICY "users_own_applications"
  ON applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
