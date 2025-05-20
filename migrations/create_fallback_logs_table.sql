
-- Create a table to log fallback calculation events
CREATE TABLE IF NOT EXISTS public.calculation_fallback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game TEXT NOT NULL,
  base_value NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add an index on created_at for faster queries when filtering by date
CREATE INDEX IF NOT EXISTS calculation_fallback_logs_created_at_idx ON public.calculation_fallback_logs(created_at);

-- Add comment to the table
COMMENT ON TABLE public.calculation_fallback_logs IS 'Logs of trade value calculation fallback events';
