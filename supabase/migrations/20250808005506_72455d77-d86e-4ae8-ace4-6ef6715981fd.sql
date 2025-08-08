-- Create new TCG data schema
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  set_id TEXT NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sets_game_id ON public.sets(game_id);
CREATE INDEX IF NOT EXISTS idx_products_set_id ON public.products(set_id);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Public read access for sets" ON public.sets FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON public.products FOR SELECT USING (true);

-- Admin policies for data management
CREATE POLICY "Admin can manage games" ON public.games FOR ALL USING (has_required_role(ARRAY['admin']));
CREATE POLICY "Admin can manage sets" ON public.sets FOR ALL USING (has_required_role(ARRAY['admin']));
CREATE POLICY "Admin can manage products" ON public.products FOR ALL USING (has_required_role(ARRAY['admin']));

-- Service role can manage all data (for edge functions)
CREATE POLICY "Service role can manage games" ON public.games FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Service role can manage sets" ON public.sets FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Service role can manage products" ON public.products FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Create a table for scraper logs
CREATE TABLE IF NOT EXISTS public.tcg_scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  error_details JSONB,
  total_games INTEGER,
  total_sets INTEGER,
  total_products INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for scraper logs
ALTER TABLE public.tcg_scraper_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view scraper logs
CREATE POLICY "Admin can view scraper logs" ON public.tcg_scraper_logs FOR SELECT USING (has_required_role(ARRAY['admin']));
CREATE POLICY "Service role can manage scraper logs" ON public.tcg_scraper_logs FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');