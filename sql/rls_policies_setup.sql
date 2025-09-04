-- RLS Policies Setup for Role-Based Access Control
-- Run this in your Supabase SQL Editor

-- First, let's drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (id::text = (SELECT auth.uid()::text));

-- Only admins can insert new users
CREATE POLICY "Only admins can insert users" ON users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- Only admins can update users
CREATE POLICY "Only admins can update users" ON users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON users 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- ========================================
-- CLIENTS TABLE POLICIES
-- ========================================

-- Both admins and employees can view clients
CREATE POLICY "Users can view clients" ON clients 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can insert clients
CREATE POLICY "Users can insert clients" ON clients 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can update clients
CREATE POLICY "Users can update clients" ON clients 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- ONLY ADMINS can delete clients (this is the key restriction)
CREATE POLICY "Only admins can delete clients" ON clients 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- ========================================
-- ATTENDANCE TABLE POLICIES
-- ========================================

-- Both admins and employees can view attendance
CREATE POLICY "Users can view attendance" ON attendance 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can insert attendance records
CREATE POLICY "Users can insert attendance" ON attendance 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can update attendance records
CREATE POLICY "Users can update attendance" ON attendance 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can delete attendance records
CREATE POLICY "Users can delete attendance" ON attendance 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role IN ('admin', 'employee')
    )
  );

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show all created policies
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

-- Test queries to verify policies work
-- These will show what operations are allowed for the current user
SELECT 'Testing user permissions...' as test_status;

-- Test if current user can delete clients (should only work for admins)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = (SELECT auth.uid()::text)
            AND role = 'admin'
        ) THEN 'ADMIN: Can delete clients'
        ELSE 'EMPLOYEE: Cannot delete clients'
    END as client_delete_permission;

SELECT 'RLS policies setup completed successfully!' as status;
