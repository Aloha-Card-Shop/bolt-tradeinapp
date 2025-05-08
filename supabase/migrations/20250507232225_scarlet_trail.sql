/*
  # Add trade value settings and cash/trade options

  1. New Tables
    - `trade_value_settings`
      - `id` (uuid, primary key)
      - `game` (game_type)
      - `min_value` (numeric)
      - `max_value` (numeric)
      - `cash_percentage` (numeric)
      - `trade_percentage` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `payment_type` column to trade_ins table
    - Add default trade value settings for each game type
*/

-- Create trade value settings table
CREATE TABLE IF NOT EXISTS trade_value_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game game_type NOT NULL,
  min_value numeric NOT NULL DEFAULT 0,
  max_value numeric NOT NULL DEFAULT 999999,
  cash_percentage numeric NOT NULL DEFAULT 50,
  trade_percentage numeric NOT NULL DEFAULT 65,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_percentages CHECK (
    cash_percentage >= 0 AND 
    cash_percentage <= 100 AND
    trade_percentage >= 0 AND 
    trade_percentage <= 100 AND
    trade_percentage >= cash_percentage
  ),
  CONSTRAINT valid_value_range CHECK (
    min_value >= 0 AND
    max_value > min_value
  ),
  UNIQUE(game, min_value, max_value)
);

-- Add payment type to trade_ins
ALTER TABLE trade_ins 
ADD COLUMN payment_type text NOT NULL DEFAULT 'cash'
CHECK (payment_type IN ('cash', 'trade'));

-- Enable RLS
ALTER TABLE trade_value_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON trade_value_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for admins"
ON trade_value_settings FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin')
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin');

CREATE POLICY "Enable insert for admins"
ON trade_value_settings FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin');

CREATE POLICY "Enable delete for admins"
ON trade_value_settings FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin');

-- Insert default settings
INSERT INTO trade_value_settings 
  (game, min_value, max_value, cash_percentage, trade_percentage)
VALUES
  -- Pokemon cards
  ('pokemon', 0, 1, 40, 50),
  ('pokemon', 1, 5, 45, 60),
  ('pokemon', 5, 20, 50, 65),
  ('pokemon', 20, 50, 55, 70),
  ('pokemon', 50, 999999, 60, 75),
  
  -- Japanese Pokemon cards
  ('japanese-pokemon', 0, 1, 35, 45),
  ('japanese-pokemon', 1, 5, 40, 55),
  ('japanese-pokemon', 5, 20, 45, 60),
  ('japanese-pokemon', 20, 50, 50, 65),
  ('japanese-pokemon', 50, 999999, 55, 70),
  
  -- Magic cards
  ('magic', 0, 1, 40, 50),
  ('magic', 1, 5, 45, 60),
  ('magic', 5, 20, 50, 65),
  ('magic', 20, 50, 55, 70),
  ('magic', 50, 999999, 60, 75);

-- Create function to get trade value percentage
CREATE OR REPLACE FUNCTION get_trade_value_percentage(
  p_game game_type,
  p_value numeric,
  p_payment_type text
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN p_payment_type = 'cash' THEN cash_percentage
        ELSE trade_percentage
      END
    FROM trade_value_settings
    WHERE game = p_game
      AND p_value >= min_value 
      AND p_value <= max_value
    LIMIT 1
  );
END;
$$;