-- RLS Performance Fix for Attendance Tracker
-- Run this in your Supabase SQL Editor

-- Drop existing RLS policies that have performance issues
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;

-- Create optimized RLS policies for users table
-- Users can view own profile (optimized)
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (id::text = (SELECT auth.uid()::text));

-- Only admins can insert users (optimized)
CREATE POLICY "Only admins can insert users" ON users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- Only admins can update users (optimized)
CREATE POLICY "Only admins can update users" ON users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- Only admins can delete users (optimized)
CREATE POLICY "Only admins can delete users" ON users 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
      AND role = 'admin'
    )
  );

-- Create optimized RLS policies for clients table
-- For now, allowing all operations but with proper auth checks
CREATE POLICY "Allow all operations on clients" ON clients 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
    )
  );

-- Create optimized RLS policies for attendance table
-- For now, allowing all operations but with proper auth checks
CREATE POLICY "Allow all operations on attendance" ON attendance 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = (SELECT auth.uid()::text)
    )
  );

-- Alternative: More restrictive policies for production
-- Uncomment these if you want more restrictive access

-- -- Clients: Only admins can manage clients
-- CREATE POLICY "Only admins can manage clients" ON clients 
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id::text = (SELECT auth.uid()::text)
--       AND role = 'admin'
--     )
--   );

-- -- Attendance: Employees can view and update attendance, admins can do everything
-- CREATE POLICY "Attendance access by role" ON attendance 
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id::text = (SELECT auth.uid()::text)
--       AND role IN ('admin', 'employee')
--     )
--   );

-- Verify the policies are created
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
ORDER BY tablename, policyname;

-- Test the performance improvement
-- This query should now be much faster
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users 
WHERE id::text = (SELECT auth.uid()::text);

-- Show current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clients', 'attendance');

SELECT 'RLS performance optimization completed successfully!' as status; 