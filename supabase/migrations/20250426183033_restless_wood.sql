-- Drop existing tables if they exist
DROP TABLE IF EXISTS trade_in_items;
DROP TABLE IF EXISTS trade_ins;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS cards;

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
  email text,
  phone text,
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON cards;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON trade_ins;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON trade_ins;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON trade_ins;
DROP POLICY IF EXISTS "Enable read access for all users" ON trade_in_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON trade_in_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON trade_in_items;

-- Create policies for cards
CREATE POLICY "Enable read access for all users" ON cards
  FOR SELECT TO authenticated
  USING (true);

-- Create policies for customers
CREATE POLICY "Enable read access for authenticated users" ON customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON customers
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON customers
  FOR DELETE TO authenticated
  USING (true);

-- Create policies for trade_ins
CREATE POLICY "Enable read access for all users" ON trade_ins
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON trade_ins
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON trade_ins
  FOR UPDATE TO authenticated
  USING (true);

-- Create policies for trade_in_items
CREATE POLICY "Enable read access for all users" ON trade_in_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON trade_in_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON trade_in_items
  FOR UPDATE TO authenticated
  USING (true);