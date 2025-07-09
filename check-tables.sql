-- Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- Check if other tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_sessions', 'exam_results'); 