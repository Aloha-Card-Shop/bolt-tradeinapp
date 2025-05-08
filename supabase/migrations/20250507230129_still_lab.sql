-- Verify and recreate cascade delete constraint
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.trade_in_items
  DROP CONSTRAINT IF EXISTS trade_in_items_trade_in_id_fkey;

  -- Recreate with CASCADE and verify
  ALTER TABLE public.trade_in_items
  ADD CONSTRAINT trade_in_items_trade_in_id_fkey
  FOREIGN KEY (trade_in_id)
  REFERENCES public.trade_ins (id)
  ON DELETE CASCADE;
  
  -- Verify constraint exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.referential_constraints 
    WHERE constraint_name = 'trade_in_items_trade_in_id_fkey'
    AND delete_rule = 'CASCADE'
  ) THEN
    RAISE EXCEPTION 'Cascade delete constraint not properly created';
  END IF;
END $$;