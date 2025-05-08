/*
  # Update trade value settings to support independent fixed values

  1. Changes
    - Add separate fixed value columns for cash and trade
    - Drop old fixed_value column
    - Update constraint to handle independent fixed values

  2. Purpose
    - Allow different fixed values for cash vs trade options
    - Maintain data integrity with updated constraints
*/

-- Add new columns
ALTER TABLE trade_value_settings
ADD COLUMN fixed_cash_value numeric DEFAULT NULL,
ADD COLUMN fixed_trade_value numeric DEFAULT NULL;

-- Drop old column and constraint
ALTER TABLE trade_value_settings
DROP CONSTRAINT IF EXISTS valid_trade_values;

ALTER TABLE trade_value_settings
DROP COLUMN IF EXISTS fixed_value;

-- Add new constraint
ALTER TABLE trade_value_settings
ADD CONSTRAINT valid_trade_values CHECK (
  (
    -- Fixed value mode
    fixed_cash_value IS NOT NULL AND
    fixed_trade_value IS NOT NULL AND
    fixed_cash_value >= 0 AND
    fixed_trade_value >= fixed_cash_value AND
    cash_percentage = 0 AND
    trade_percentage = 0
  )
  OR
  (
    -- Percentage mode
    fixed_cash_value IS NULL AND
    fixed_trade_value IS NULL AND
    cash_percentage >= 0 AND
    cash_percentage <= 100 AND
    trade_percentage >= 0 AND
    trade_percentage <= 100 AND
    trade_percentage >= cash_percentage
  )
);