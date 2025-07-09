-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies that allow user creation
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true); -- Allow all inserts for signup

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Also allow service role to bypass RLS (for admin operations)
ALTER TABLE users FORCE ROW LEVEL SECURITY; 