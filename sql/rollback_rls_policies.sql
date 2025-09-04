-- Rollback Script for RLS Policies
-- Run this in your Supabase SQL Editor to undo the RLS policy changes

-- ========================================
-- DROP ALL RLS POLICIES
-- ========================================

-- Drop users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

-- Drop clients table policies
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON clients;

-- Drop attendance table policies
DROP POLICY IF EXISTS "Users can view attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON attendance;
DROP POLICY IF EXISTS "Users can delete attendance" ON attendance;

-- ========================================
-- RECREATE ORIGINAL POLICIES (if you had any)
-- ========================================

-- Option 1: Recreate the original simple policies from your schema files
-- Uncomment these if you want to restore the original policies

-- -- Users table - original policy from users_schema_setup.sql
-- CREATE POLICY "Users can view own profile" ON users 
--   FOR SELECT USING (auth.uid()::text = id::text);
-- 
-- CREATE POLICY "Only admins can insert users" ON users 
--   FOR INSERT WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id::text = auth.uid()::text 
--       AND role = 'admin'
--     )
--   );
-- 
-- CREATE POLICY "Only admins can update users" ON users 
--   FOR UPDATE USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id::text = auth.uid()::text 
--       AND role = 'admin'
--     )
--   );
-- 
-- CREATE POLICY "Only admins can delete users" ON users 
--   FOR DELETE USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id::text = auth.uid()::text 
--       AND role = 'admin'
--     )
--   );

-- -- Clients and attendance tables - original policies from complete_schema_setup.sql
-- CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true);

-- ========================================
-- ALTERNATIVE: DISABLE RLS COMPLETELY
-- ========================================

-- Option 2: If you want to disable RLS entirely (uncomment if needed)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show remaining policies (should be empty if all were dropped)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clients', 'attendance')
ORDER BY tablename, cmd, policyname;

-- Show RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clients', 'attendance');

-- Test if tables are accessible (this will show if RLS is blocking access)
SELECT 'Testing table access after rollback...' as test_status;

-- Test basic access to each table
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'clients' as table_name,
    COUNT(*) as record_count
FROM clients
UNION ALL
SELECT 
    'attendance' as table_name,
    COUNT(*) as record_count
FROM attendance;

SELECT 'RLS policies rollback completed successfully!' as status;
