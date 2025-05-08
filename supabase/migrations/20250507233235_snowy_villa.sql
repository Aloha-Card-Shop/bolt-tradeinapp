/*
  # Add fixed value option to trade value settings

  1. Changes
    - Add fixed_value column to trade_value_settings table
    - Update constraints to handle fixed value option
    - Add check constraint to ensure either percentages or fixed value is used
*/

-- Add fixed value column
ALTER TABLE trade_value_settings
ADD COLUMN fixed_value numeric DEFAULT NULL;

-- Update constraints
ALTER TABLE trade_value_settings
DROP CONSTRAINT IF EXISTS valid_percentages;

ALTER TABLE trade_value_settings
ADD CONSTRAINT valid_trade_values CHECK (
  -- Either use percentages
  (
    fixed_value IS NULL AND
    cash_percentage >= 0 AND 
    cash_percentage <= 100 AND
    trade_percentage >= 0 AND 
    trade_percentage <= 100 AND
    trade_percentage >= cash_percentage
  )
  -- Or use fixed value
  OR (
    fixed_value IS NOT NULL AND
    fixed_value >= 0 AND
    cash_percentage IS NULL AND
    trade_percentage IS NULL
  )
);