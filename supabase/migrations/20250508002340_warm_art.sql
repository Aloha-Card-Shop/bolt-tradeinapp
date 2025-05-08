/*
  # Fix trade value settings constraint

  1. Changes
    - Drop existing valid_trade_values constraint
    - Create new constraint that enforces:
      • When fixed_value IS NOT NULL:
        - cash_percentage and trade_percentage must be 0 (not null)
        - fixed_value must be >= 0
      • When fixed_value IS NULL:
        - cash_percentage must be between 0 and 100
        - trade_percentage must be between 0 and 100
        - trade_percentage must be >= cash_percentage

  2. Purpose
    - Ensure data integrity for both fixed and percentage modes
    - Prevent null values in percentage fields
    - Maintain valid value ranges
*/

-- Drop existing constraint
ALTER TABLE trade_value_settings
DROP CONSTRAINT IF EXISTS valid_trade_values;

-- Add new constraint
ALTER TABLE trade_value_settings
ADD CONSTRAINT valid_trade_values CHECK (
  (
    -- Fixed value mode
    fixed_value IS NOT NULL AND
    fixed_value >= 0 AND
    cash_percentage = 0 AND
    trade_percentage = 0
  )
  OR
  (
    -- Percentage mode
    fixed_value IS NULL AND
    cash_percentage >= 0 AND
    cash_percentage <= 100 AND
    trade_percentage >= 0 AND
    trade_percentage <= 100 AND
    trade_percentage >= cash_percentage
  )
);