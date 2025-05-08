/*
  # Enable RLS and add insert policy for cards table

  1. Changes
    - Enable row level security on cards table
    - Add policy to allow authenticated users to insert cards
    - Ensure auth.uid() is not null for inserts

  2. Security
    - Only authenticated users can insert new cards
    - Maintains existing read access policy
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'cards' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated inserts on cards" ON public.cards;

-- Create new insert policy
CREATE POLICY "Allow authenticated inserts on cards"
ON public.cards
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);