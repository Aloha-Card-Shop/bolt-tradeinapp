-- Fix database security by adding RLS policies for tables with RLS enabled but no policies
-- Based on the linter findings, we need to identify and secure these tables

-- Add security definer function for search path
CREATE OR REPLACE FUNCTION public.secure_get_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;