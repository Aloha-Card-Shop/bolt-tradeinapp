/*
  # Add attributes column to trade_in_items table

  1. Changes
    - Add JSONB attributes column to trade_in_items table
    - Set default value to empty JSON object
    - Make column nullable

  2. Purpose
    - Store additional card attributes like isFirstEdition and isHolo
    - Support flexible metadata storage for trade-in items
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_in_items' 
    AND column_name = 'attributes'
  ) THEN
    ALTER TABLE trade_in_items 
    ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;