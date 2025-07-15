-- Fix avatar and full_image fields to use TEXT type for large base64 data
-- This script should be run in the Supabase SQL editor

-- Alter the avatar column to TEXT type
ALTER TABLE users 
ALTER COLUMN avatar TYPE TEXT;

-- Alter the full_image column to TEXT type  
ALTER TABLE users 
ALTER COLUMN full_image TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('avatar', 'full_image'); 