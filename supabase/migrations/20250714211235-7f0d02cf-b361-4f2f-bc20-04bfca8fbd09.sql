-- Fix Function Search Path Mutable issue for update_card_inventory_updated_at
CREATE OR REPLACE FUNCTION public.update_card_inventory_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;