
-- Enable Row Level Security on the api_keys table if not already enabled
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow service role to access all API keys
CREATE POLICY IF NOT EXISTS "Service Role can access all API keys" 
ON public.api_keys
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a policy to allow admins to access all API keys
CREATE POLICY IF NOT EXISTS "Admins can access all API keys" 
ON public.api_keys
FOR ALL
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Also add regular users access to the API keys they need
CREATE POLICY IF NOT EXISTS "Authenticated users can read active API keys" 
ON public.api_keys
FOR SELECT
USING (is_active = true);
