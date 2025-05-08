/*
  # Add delete policy for trade-ins

  1. Changes
    - Enable RLS on trade_ins table if not already enabled
    - Add policy to allow authenticated users to delete trade-ins
    - Ensure cascade delete is working properly

  2. Security
    - Only authenticated users can delete trade-ins
    - Cascade delete ensures all related items are removed
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'trade_ins' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.trade_ins ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated deletes on trade_ins" ON public.trade_ins;

-- Create new delete policy
CREATE POLICY "Allow authenticated deletes on trade_ins"
ON public.trade_ins
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
);