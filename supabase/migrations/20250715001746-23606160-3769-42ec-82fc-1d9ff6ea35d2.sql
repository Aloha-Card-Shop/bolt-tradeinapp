-- Add SKU column to card_inventory table
ALTER TABLE public.card_inventory 
ADD COLUMN sku TEXT;

-- Create index on SKU for efficient lookups
CREATE INDEX idx_card_inventory_sku ON public.card_inventory(sku);

-- Add comment explaining the SKU format
COMMENT ON COLUMN public.card_inventory.sku IS 'SKU format: PSA-{certNumber}-{grade}-{condition} for graded cards, {tcgplayerId}-{editionHoloCode}{conditionCode} for ungraded cards';