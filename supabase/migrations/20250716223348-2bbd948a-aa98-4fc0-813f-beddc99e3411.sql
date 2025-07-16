-- Make trade_in_item_id nullable to allow Shopify products without trade-ins
ALTER TABLE card_inventory 
ALTER COLUMN trade_in_item_id DROP NOT NULL;

-- Add import_source column to track where inventory items came from
ALTER TABLE card_inventory 
ADD COLUMN import_source text DEFAULT 'trade_in' CHECK (import_source IN ('trade_in', 'shopify'));

-- Update existing records to have the correct import_source
UPDATE card_inventory 
SET import_source = 'trade_in' 
WHERE trade_in_item_id IS NOT NULL;

-- Add index for performance on the new column
CREATE INDEX idx_card_inventory_import_source ON card_inventory(import_source);

-- Add index for shopify_variant_id to prevent duplicates
CREATE INDEX idx_card_inventory_shopify_variant_id ON card_inventory(shopify_variant_id) WHERE shopify_variant_id IS NOT NULL;