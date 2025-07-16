-- Delete the duplicate placeholder Shopify settings record
DELETE FROM public.shopify_settings 
WHERE id = '976aeb19-a492-4d85-9109-cb99da4183ba';

-- Add a unique constraint to prevent multiple shopify settings records
-- First, add a unique column to ensure only one record can exist
ALTER TABLE public.shopify_settings 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update the existing record to be active
UPDATE public.shopify_settings 
SET is_active = true;

-- Create a unique constraint on is_active where true
CREATE UNIQUE INDEX shopify_settings_single_active 
ON public.shopify_settings (is_active) 
WHERE is_active = true;