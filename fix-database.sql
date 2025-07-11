-- Add full_image column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_image TEXT;

-- Enable Row Level Security (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view own exam results" ON exam_results;
DROP POLICY IF EXISTS "Users can insert own exam results" ON exam_results;
DROP POLICY IF EXISTS "Users can update own exam results" ON exam_results;
DROP POLICY IF EXISTS "Users can delete own exam results" ON exam_results;

-- Create RLS policies for users table (allow all operations for now since we use service role)
-- In production, you might want to add more specific policies
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true);

-- Create RLS policies for chat_sessions table
CREATE POLICY "Allow all operations on chat_sessions" ON chat_sessions
  FOR ALL USING (true);

-- Create RLS policies for exam_results table
CREATE POLICY "Allow all operations on exam_results" ON exam_results
  FOR ALL USING (true); 