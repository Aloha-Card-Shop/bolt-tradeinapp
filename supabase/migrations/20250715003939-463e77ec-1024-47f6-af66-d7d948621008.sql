-- Create shopify_collections table to store collection data
CREATE TABLE public.shopify_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_collection_id text NOT NULL UNIQUE,
  handle text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  product_count integer DEFAULT 0,
  collection_type text DEFAULT 'custom',
  published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_synced_at timestamp with time zone
);

-- Create shopify_collection_sync_settings table to track sync preferences
CREATE TABLE public.shopify_collection_sync_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.shopify_collections(id) ON DELETE CASCADE,
  sync_enabled boolean NOT NULL DEFAULT false,
  auto_add_products boolean DEFAULT true,
  auto_price_products boolean DEFAULT false,
  sync_frequency text DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Create shopify_sales_tracking table to log sales events
CREATE TABLE public.shopify_sales_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_order_id text NOT NULL,
  shopify_order_number text,
  line_item_id text NOT NULL,
  shopify_product_id text,
  shopify_variant_id text,
  sku text,
  quantity_sold integer NOT NULL,
  price numeric NOT NULL,
  total_amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  inventory_item_id uuid REFERENCES public.card_inventory(id),
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  webhook_data jsonb
);

-- Create inventory_movements table for comprehensive audit trail
CREATE TABLE public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id uuid NOT NULL REFERENCES public.card_inventory(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('sale', 'return', 'adjustment', 'trade_in', 'sync')),
  quantity_change integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  reason text,
  reference_id text,
  reference_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS on all tables
ALTER TABLE public.shopify_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_collection_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_sales_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopify_collections
CREATE POLICY "Allow admins and managers to view collections" 
ON public.shopify_collections FOR SELECT 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

CREATE POLICY "Allow admins and managers to manage collections" 
ON public.shopify_collections FOR ALL 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

-- Create RLS policies for shopify_collection_sync_settings
CREATE POLICY "Allow admins and managers to view sync settings" 
ON public.shopify_collection_sync_settings FOR SELECT 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

CREATE POLICY "Allow admins and managers to manage sync settings" 
ON public.shopify_collection_sync_settings FOR ALL 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

-- Create RLS policies for shopify_sales_tracking
CREATE POLICY "Allow admins and managers to view sales tracking" 
ON public.shopify_sales_tracking FOR SELECT 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

CREATE POLICY "Allow admins and managers to manage sales tracking" 
ON public.shopify_sales_tracking FOR ALL 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

-- Create RLS policies for inventory_movements
CREATE POLICY "Allow admins and managers to view inventory movements" 
ON public.inventory_movements FOR SELECT 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

CREATE POLICY "Allow admins and managers to manage inventory movements" 
ON public.inventory_movements FOR ALL 
USING (has_required_role('{admin,manager,shopify_manager}'::text[]));

-- Create indexes for performance
CREATE INDEX idx_shopify_collections_shopify_id ON public.shopify_collections(shopify_collection_id);
CREATE INDEX idx_shopify_collections_handle ON public.shopify_collections(handle);
CREATE INDEX idx_collection_sync_settings_collection_id ON public.shopify_collection_sync_settings(collection_id);
CREATE INDEX idx_collection_sync_settings_sync_enabled ON public.shopify_collection_sync_settings(sync_enabled);
CREATE INDEX idx_sales_tracking_order_id ON public.shopify_sales_tracking(shopify_order_id);
CREATE INDEX idx_sales_tracking_sku ON public.shopify_sales_tracking(sku);
CREATE INDEX idx_sales_tracking_processed ON public.shopify_sales_tracking(processed);
CREATE INDEX idx_inventory_movements_item_id ON public.inventory_movements(inventory_item_id);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_shopify_collections_updated_at
  BEFORE UPDATE ON public.shopify_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_sync_settings_updated_at
  BEFORE UPDATE ON public.shopify_collection_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();