-- Create card_inventory table to track approved trade-in cards
CREATE TABLE public.card_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_in_item_id UUID NOT NULL REFERENCES public.trade_in_items(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id),
  trade_in_price NUMERIC NOT NULL, -- Price we paid for it
  current_selling_price NUMERIC, -- Current price we're selling it for
  market_price NUMERIC, -- Latest market price
  last_price_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_by UUID REFERENCES public.profiles(id), -- Staff member who processed it
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Shopify sync tracking
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  shopify_synced BOOLEAN DEFAULT false,
  shopify_synced_at TIMESTAMP WITH TIME ZONE,
  shopify_sync_error TEXT,
  
  -- Print tracking  
  printed BOOLEAN DEFAULT false,
  print_count INTEGER DEFAULT 0,
  last_printed_at TIMESTAMP WITH TIME ZONE,
  printed_by UUID REFERENCES public.profiles(id),
  
  -- Status tracking
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'removed')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.card_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin and managers can view inventory" 
ON public.card_inventory 
FOR SELECT 
USING (has_required_role(ARRAY['admin', 'manager']));

CREATE POLICY "Admin and managers can insert inventory" 
ON public.card_inventory 
FOR INSERT 
WITH CHECK (has_required_role(ARRAY['admin', 'manager']));

CREATE POLICY "Admin and managers can update inventory" 
ON public.card_inventory 
FOR UPDATE 
USING (has_required_role(ARRAY['admin', 'manager']));

CREATE POLICY "Admin can delete inventory" 
ON public.card_inventory 
FOR DELETE 
USING (has_required_role(ARRAY['admin']));

-- Create indexes for better performance
CREATE INDEX idx_card_inventory_trade_in_item_id ON public.card_inventory(trade_in_item_id);
CREATE INDEX idx_card_inventory_card_id ON public.card_inventory(card_id);
CREATE INDEX idx_card_inventory_status ON public.card_inventory(status);
CREATE INDEX idx_card_inventory_shopify_synced ON public.card_inventory(shopify_synced);
CREATE INDEX idx_card_inventory_printed ON public.card_inventory(printed);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_card_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_card_inventory_updated_at
  BEFORE UPDATE ON public.card_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_card_inventory_updated_at();