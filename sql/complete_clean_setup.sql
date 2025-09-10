-- COMPLETE CLEAN SETUP - Attendance Tracker with Role-Based Access Control
-- Run this in your Supabase SQL Editor to set up everything from scratch

-- ========================================
-- STEP 1: CREATE USERS TABLE
-- ========================================

-- Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ========================================
-- STEP 2: CREATE CLIENTS TABLE
-- ========================================

-- Drop and recreate clients table
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  email TEXT,
  parent_email TEXT,
  phone TEXT,
  image TEXT,
  location TEXT,
  schedule JSONB DEFAULT '{"monday": false, "tuesday": false, "wednesday": false, "thursday": false, "friday": false}',
  payment_status JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_location ON clients(location);

-- ========================================
-- STEP 3: CREATE ATTENDANCE TABLE
-- ========================================

-- Drop and recreate attendance table
DROP TABLE IF EXISTS attendance CASCADE;

CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unexcused' CHECK (status IN ('present', 'excused', 'unexcused')),
  hours DECIMAL(4,2) DEFAULT 0,
  excused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_client_id ON attendance(client_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ========================================
-- STEP 4: CREATE UPDATED_AT TRIGGER FUNCTION
-- ========================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- STEP 5: CREATE TRIGGERS
-- ========================================

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 7: CREATE RLS POLICIES
-- ========================================

-- USERS TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (id = auth.uid());

-- Only admins can insert new users
CREATE POLICY "Only admins can insert users" ON users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Only admins can update users
CREATE POLICY "Only admins can update users" ON users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON users 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- CLIENTS TABLE POLICIES
-- Both admins and employees can view clients
CREATE POLICY "Users can view clients" ON clients 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can insert clients
CREATE POLICY "Users can insert clients" ON clients 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can update clients
CREATE POLICY "Users can update clients" ON clients 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- ONLY ADMINS can delete clients (this is the key restriction)
CREATE POLICY "Only admins can delete clients" ON clients 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ATTENDANCE TABLE POLICIES
-- Both admins and employees can view attendance
CREATE POLICY "Users can view attendance" ON attendance 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can insert attendance
CREATE POLICY "Users can insert attendance" ON attendance 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can update attendance
CREATE POLICY "Users can update attendance" ON attendance 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- Both admins and employees can delete attendance
CREATE POLICY "Users can delete attendance" ON attendance 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- ========================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to create a user in the users table after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 9: VERIFICATION
-- ========================================

-- Show all created tables
SELECT 'Created tables:' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'clients', 'attendance')
ORDER BY table_name;

-- Show RLS status
SELECT 'RLS Status:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clients', 'attendance');

-- Show all policies
SELECT 'Created policies:' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'DELETE' AND tablename = 'clients' THEN '🔒 ADMIN ONLY'
        WHEN cmd = 'DELETE' AND tablename = 'users' THEN '🔒 ADMIN ONLY'
        ELSE '✅ ALL USERS'
    END as access_level
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clients', 'attendance')
ORDER BY tablename, cmd, policyname;

SELECT '🎉 COMPLETE SETUP FINISHED! Ready to create your first admin user.' as final_status;
