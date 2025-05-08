/*
  # Fix RLS policies for trade value settings

  1. Changes
    - Drop existing RLS policies for trade_value_settings table
    - Add new RLS policies that properly check user role
    - Ensure admin users can manage trade value settings
    - Allow authenticated users to read trade value settings
  
  2. Security
    - Enable RLS on trade_value_settings table
    - Add policies for:
      - Read access for all authenticated users
      - Full CRUD access for admin users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for admins" ON trade_value_settings;
DROP POLICY IF EXISTS "Enable insert for admins" ON trade_value_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON trade_value_settings;
DROP POLICY IF EXISTS "Enable update for admins" ON trade_value_settings;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON trade_value_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admin users"
ON trade_value_settings
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Enable update for admin users"
ON trade_value_settings
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Enable delete for admin users"
ON trade_value_settings
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);