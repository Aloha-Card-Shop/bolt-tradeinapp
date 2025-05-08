/*
  # Add config table for TCGPlayer API credentials

  1. New Tables
    - `config`
      - `id` (uuid, primary key)
      - `tcgplayer_public_key` (text)
      - `tcgplayer_private_key` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on config table
    - Only allow admin access
*/

CREATE TABLE IF NOT EXISTS config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tcgplayer_public_key text NOT NULL,
  tcgplayer_private_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Only allow admin users to access the config table
CREATE POLICY "Admin users can manage config"
  ON config
  USING (get_current_user_role() = 'admin');

-- Insert a placeholder row (you'll need to update this with real credentials)
INSERT INTO config (tcgplayer_public_key, tcgplayer_private_key)
VALUES ('your_public_key', 'your_private_key')
ON CONFLICT DO NOTHING;