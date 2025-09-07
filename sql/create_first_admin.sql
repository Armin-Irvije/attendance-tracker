-- CREATE FIRST ADMIN USER
-- Run this AFTER you've created an admin user through your app's signup
-- This script will help you verify and fix the admin user if needed

-- First, let's see what users currently exist
SELECT 'Current users in auth.users:' as status;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check what's in your users table
SELECT 'Current users in public.users:' as status;
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users
ORDER BY created_at DESC;

-- If you need to manually create an admin user (use this if signup didn't work properly)
-- Replace the values below with your actual admin details
-- Uncomment and modify these lines:

/*
-- Step 1: Create the auth user (you'll need to do this through your app or Supabase dashboard)
-- The auth user creation happens through Supabase Auth, not SQL

-- Step 2: Once you have the auth user ID, insert into your users table
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual UUID from auth.users
INSERT INTO users (id, email, name, role)
VALUES (
    'YOUR_AUTH_USER_ID_HERE',  -- Get this from auth.users table
    'admin@yourcompany.com',   -- Your admin email
    'Admin User',              -- Admin name
    'admin'                    -- Admin role
);
*/

-- Function to promote an existing user to admin
-- Use this if you already have a user but need to make them admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'User not found in auth.users';
    END IF;
    
    -- Update or insert in public.users
    INSERT INTO users (id, email, name, role)
    VALUES (user_id, user_email, 'Admin User', 'admin')
    ON CONFLICT (id) 
    DO UPDATE SET 
        role = 'admin',
        updated_at = NOW();
    
    RETURN 'User promoted to admin successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the current user's permissions
SELECT 'Testing current user permissions:' as status;
SELECT 
    auth.uid() as current_user_id,
    u.email,
    u.role,
    u.name,
    CASE 
        WHEN u.role = 'admin' THEN '✅ ADMIN: Can delete clients'
        WHEN u.role = 'employee' THEN '❌ EMPLOYEE: Cannot delete clients'
        ELSE '❓ UNKNOWN ROLE'
    END as delete_permission
FROM users u
WHERE u.id = auth.uid();

-- Show all policies for verification
SELECT 'Client deletion policy:' as status;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'clients' 
AND cmd = 'DELETE';

SELECT 'Setup complete! Create your admin user through the app signup, then test the functionality.' as final_status;
