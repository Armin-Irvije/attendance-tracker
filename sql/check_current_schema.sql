-- Check current schema and table structure
-- Run this to see what tables exist and their structure

-- Check what tables exist
SELECT 'Existing tables:' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check clients table structure
SELECT 'Clients table structure:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Check if clients_pacific_time view exists
SELECT 'Checking for clients_pacific_time view:' as status;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'clients_pacific_time';

-- Check attendance table structure
SELECT 'Attendance table structure:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'attendance'
ORDER BY ordinal_position;

-- Check if attendance_pacific_time view exists
SELECT 'Checking for attendance_pacific_time view:' as status;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'attendance_pacific_time';

-- Test basic client access
SELECT 'Testing client access:' as status;
SELECT COUNT(*) as client_count FROM clients;
