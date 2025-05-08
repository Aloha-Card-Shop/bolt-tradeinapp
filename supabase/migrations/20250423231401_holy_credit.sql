/*
  # Initial Schema for Aloha Card Shop Trade In System

  1. New Tables
    - `cards`
      - `id` (uuid, primary key)
      - `name` (text)
      - `set_name` (text)
      - `card_number` (text)
      - `game` (enum)
      - `image_url` (text)
      - `rarity` (text)
      - `market_price` (numeric)
      - `low_price` (numeric)
      - `mid_price` (numeric)
      - `high_price` (numeric)
      - `last_updated` (timestamptz)
      - `tcgplayer_url` (text)
      - `attributes` (jsonb)

    - `customers`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamptz)

    - `trade_ins`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `trade_in_date` (timestamptz)
      - `total_value` (numeric)
      - `notes` (text)

    - `trade_in_items`
      - `id` (uuid, primary key)
      - `trade_in_id` (uuid, references trade_ins)
      - `card_id` (uuid, references cards)
      - `quantity` (integer)
      - `price` (numeric)
      - `condition` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE game_type AS ENUM ('pokemon', 'japanese-pokemon', 'magic');
CREATE TYPE card_condition AS ENUM ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged');

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  set_name text,
  card_number text,
  game game_type NOT NULL,
  image_url text,
  rarity text,
  market_price numeric,
  low_price numeric,
  mid_price numeric,
  high_price numeric,
  last_updated timestamptz DEFAULT now(),
  tcgplayer_url text,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Create trade_ins table
CREATE TABLE IF NOT EXISTS trade_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  trade_in_date timestamptz DEFAULT now(),
  total_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create trade_in_items table
CREATE TABLE IF NOT EXISTS trade_in_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id uuid NOT NULL REFERENCES trade_ins(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  condition card_condition NOT NULL DEFAULT 'near_mint',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_set_name ON cards(set_name);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(game);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_trade_ins_customer_id ON trade_ins(customer_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_items_trade_in_id ON trade_in_items(trade_in_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_items_card_id ON trade_in_items(card_id);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_in_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON cards
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON customers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON trade_ins
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON trade_ins
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON trade_ins
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON trade_in_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON trade_in_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON trade_in_items
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);