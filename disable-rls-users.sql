-- Disable RLS for users table to allow service role key to work
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all user policies since RLS is disabled
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users; 