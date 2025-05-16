
-- Create a table for Shopify debug logs
CREATE TABLE IF NOT EXISTS public.shopify_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_in_id UUID REFERENCES public.trade_ins(id),
  item_id UUID REFERENCES public.trade_in_items(id) NULL,
  level TEXT NOT NULL DEFAULT 'info',
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_shopify_debug_logs_trade_in_id ON public.shopify_debug_logs(trade_in_id);
CREATE INDEX IF NOT EXISTS idx_shopify_debug_logs_created_at ON public.shopify_debug_logs(created_at);

-- Add RLS policies
ALTER TABLE public.shopify_debug_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins, managers, and staff to view logs
CREATE POLICY "Allow admins to view logs" 
  ON public.shopify_debug_logs 
  FOR SELECT 
  USING (has_required_role('{admin,manager,staff,shopify_manager}'));

-- Allow admins to insert logs
CREATE POLICY "Allow admins to insert logs" 
  ON public.shopify_debug_logs 
  FOR INSERT 
  WITH CHECK (has_required_role('{admin,manager,staff,shopify_manager}'));
