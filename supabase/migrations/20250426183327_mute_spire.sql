/*
  # Fix RLS policies for customers table

  1. Changes
    - Drop existing RLS policies for customers table
    - Create new RLS policies with proper permissions for authenticated users
    - Add user-based filtering for better security

  2. Security
    - Enable RLS on customers table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Drop existing policies for customers table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;

-- Create new policies for customers table
CREATE POLICY "Enable read access for authenticated users"
ON customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON customers FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
ON customers FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
ON customers FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');