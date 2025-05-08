/*
  # Add CASCADE delete to trade_in_items foreign key

  1. Changes
    - Drop existing foreign key constraint
    - Re-create with ON DELETE CASCADE
    - Ensures child records are automatically deleted

  2. Purpose
    - Maintain referential integrity
    - Automatically clean up related items when a trade-in is deleted
*/

-- Drop existing foreign key if it exists
ALTER TABLE public.trade_in_items
DROP CONSTRAINT IF EXISTS trade_in_items_trade_in_id_fkey;

-- Re-create with CASCADE delete
ALTER TABLE public.trade_in_items
ADD CONSTRAINT trade_in_items_trade_in_id_fkey
FOREIGN KEY (trade_in_id)
REFERENCES public.trade_ins (id)
ON DELETE CASCADE;