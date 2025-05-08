/*
  # Update trade value settings constraints

  1. Changes
    - Drop existing valid_trade_values constraint
    - Add new constraint that properly handles independent fixed values
    - Ensure fixed values can be different while maintaining business rules

  2. Rules
    - In fixed mode:
      • Both fixed_cash_value and fixed_trade_value must be set
      • fixed_cash_value must be >= 0
      • fixed_trade_value must be >= fixed_cash_value
      • cash_percentage and trade_percentage must be 0
    - In percentage mode:
      • Both fixed values must be NULL
      • Percentages must be between 0 and 100
      • trade_percentage must be >= cash_percentage
*/

-- Drop existing constraint
ALTER TABLE trade_value_settings
DROP CONSTRAINT IF EXISTS valid_trade_values;

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