-- Rollback Script for RLS Policy Changes
-- Run this in your Supabase SQL Editor to undo the RLS performance fixes

-- Drop the optimized policies we created
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;

-- Recreate the original policies (with performance issues, but as they were)
-- Users can view own profile (original version)
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid()::text = id::text);

-- Only admins can insert users (original version)
CREATE POLICY "Only admins can insert users" ON users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Only admins can update users (original version)
CREATE POLICY "Only admins can update users" ON users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Only admins can delete users (original version)
CREATE POLICY "Only admins can delete users" ON users 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Recreate original policies for clients and attendance
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true);

-- Verify the rollback
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

SELECT 'RLS policies rolled back to original state!' as status;
