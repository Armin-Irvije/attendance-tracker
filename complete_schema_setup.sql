-- Complete Schema Setup for Attendance Tracker
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful with this in production!)
-- DROP TABLE IF EXISTS attendance;
-- DROP TABLE IF EXISTS clients;

-- Create clients table with all required fields
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  parent_name TEXT,
  parent_email TEXT,
  phone TEXT,
  image TEXT,
  location TEXT,
  schedule JSONB NOT NULL DEFAULT '{}',
  payment_status JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table with proper structure
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unexcused' CHECK (status IN ('present', 'absent', 'excused', 'unexcused')),
  hours DECIMAL(4,2) DEFAULT 0,
  excused BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_client_date ON attendance(client_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_clients_location ON clients(location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- For now, allowing all operations - you can restrict this later
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true);

-- Insert some sample data for testing (optional)
-- INSERT INTO clients (name, initials, parent_name, parent_email, phone, location, schedule) VALUES
-- ('John Doe', 'JD', 'Jane Doe', 'jane@example.com', '555-1234', 'Main Office', '{"monday": true, "tuesday": false, "wednesday": true, "thursday": false, "friday": true}'),
-- ('Jane Smith', 'JS', 'John Smith', 'john@example.com', '555-5678', 'Branch Office', '{"monday": false, "tuesday": true, "wednesday": false, "thursday": true, "friday": false}');

-- Verify the setup
SELECT 'Schema setup completed successfully!' as status; 