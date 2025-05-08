/*
  # Add TCGPlayer Product ID to unified products

  1. Changes
    - Add `tcgplayer_product_id` column to `unified_products` table
    - Update existing records to use the product_id as tcgplayer_product_id temporarily
    - Add index for faster lookups

  2. Notes
    - The tcgplayer_product_id will be populated with actual TCGPlayer IDs through a separate data update process
    - Temporarily using internal product_id as a placeholder
*/

-- Add tcgplayer_product_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'unified_products' 
    AND column_name = 'tcgplayer_product_id'
  ) THEN
    ALTER TABLE unified_products 
    ADD COLUMN tcgplayer_product_id text;
  END IF;
END $$;

-- Create index for tcgplayer_product_id
CREATE INDEX IF NOT EXISTS idx_unified_products_tcgplayer_id 
ON unified_products(tcgplayer_product_id);

-- Update existing records to use product_id as temporary tcgplayer_product_id
UPDATE unified_products 
SET tcgplayer_product_id = product_id::text 
WHERE tcgplayer_product_id IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN unified_products.tcgplayer_product_id IS 'TCGPlayer product identifier for price lookups';