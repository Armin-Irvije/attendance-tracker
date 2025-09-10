-- ROLLBACK SCRIPT - Restore Original Functionality
-- This will remove all RLS policies and restore your app to working state
-- Run this in your Supabase SQL Editor

-- First, let's see what policies currently exist
SELECT 'Current policies before rollback:' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'attendance', 'users')
ORDER BY tablename, cmd, policyname;

-- ========================================
-- REMOVE ALL RLS POLICIES
-- ========================================

-- Remove all policies from clients table
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

-- Remove all policies from attendance table
DROP POLICY IF EXISTS "Users can view attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON attendance;
DROP POLICY IF EXISTS "Users can delete attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;

-- Remove all policies from users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

-- ========================================
-- DISABLE ROW LEVEL SECURITY
-- ========================================

-- Disable RLS on all tables to restore original functionality
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check that RLS is disabled
SELECT 'RLS Status after rollback:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'attendance', 'users');

-- Check that no policies remain
SELECT 'Remaining policies after rollback:' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'attendance', 'users')
ORDER BY tablename, cmd, policyname;

-- Test that you can access clients (this should work now)
SELECT 'Testing client access...' as status;
SELECT COUNT(*) as client_count FROM clients;

SELECT 'ROLLBACK COMPLETED! Your app should work normally again.' as final_status;