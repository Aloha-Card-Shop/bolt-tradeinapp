-- Fix Function Search Path Mutable issues by setting secure search_path

-- Fix public.update_card_number_trigger function
CREATE OR REPLACE FUNCTION public.update_card_number_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    NEW.card_number = public.extract_card_number(NEW.attributes);
    RETURN NEW;
END;
$function$;

-- Fix public.extract_card_number function
CREATE OR REPLACE FUNCTION public.extract_card_number(attrs jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  card_number text;
BEGIN
  -- Try to extract card number from different possible paths in the JSON structure
  -- First check Number path (most common)
  IF attrs ? 'Number' THEN
    -- If Number is an object with displayName or value
    IF jsonb_typeof(attrs->'Number') = 'object' THEN
      IF attrs->'Number' ? 'displayName' THEN
        card_number := attrs->'Number'->>'displayName';
        -- Fix for when displayName is literally "Card Number"
        IF card_number = 'Card Number' AND attrs->'Number' ? 'value' THEN
          card_number := attrs->'Number'->>'value';
        END IF;
      ELSIF attrs->'Number' ? 'value' THEN
        card_number := attrs->'Number'->>'value';
      END IF;
    -- If Number is a direct string or number value  
    ELSE
      card_number := attrs->>'Number';
    END IF;
  -- Then check number (lowercase) path
  ELSIF attrs ? 'number' THEN
    -- If number is an object with displayName or value
    IF jsonb_typeof(attrs->'number') = 'object' THEN
      IF attrs->'number' ? 'displayName' THEN
        card_number := attrs->'number'->>'displayName';
        -- Fix for when displayName is literally "Card Number"
        IF card_number = 'Card Number' AND attrs->'number' ? 'value' THEN
          card_number := attrs->'number'->>'value';
        END IF;
      ELSIF attrs->'number' ? 'value' THEN
        card_number := attrs->'number'->>'value';
      END IF;
    -- If number is a direct string or number value
    ELSE
      card_number := attrs->>'number';
    END IF;
  -- Then check card_number path  
  ELSIF attrs ? 'card_number' THEN
    -- If card_number is an object
    IF jsonb_typeof(attrs->'card_number') = 'object' THEN
      IF attrs->'card_number' ? 'displayName' THEN
        card_number := attrs->'card_number'->>'displayName';
        -- Fix for when displayName is literally "Card Number"
        IF card_number = 'Card Number' AND attrs->'card_number' ? 'value' THEN
          card_number := attrs->'card_number'->>'value';
        END IF;
      ELSIF attrs->'card_number' ? 'value' THEN
        card_number := attrs->'card_number'->>'value';
      END IF;
    -- If card_number is a direct value
    ELSE
      card_number := attrs->>'card_number';
    END IF;
  -- Check properties object which might contain a number field  
  ELSIF attrs ? 'properties' THEN
    IF jsonb_typeof(attrs->'properties') = 'object' THEN
      IF attrs->'properties' ? 'number' THEN
        IF jsonb_typeof(attrs->'properties'->'number') = 'object' THEN
          IF attrs->'properties'->'number' ? 'displayName' THEN
            card_number := attrs->'properties'->'number'->>'displayName';
            -- Fix for when displayName is literally "Card Number"
            IF card_number = 'Card Number' AND attrs->'properties'->'number' ? 'value' THEN
              card_number := attrs->'properties'->'number'->>'value';
            END IF;
          ELSIF attrs->'properties'->'number' ? 'value' THEN
            card_number := attrs->'properties'->'number'->>'value';
          END IF;
        ELSE
          card_number := attrs->'properties'->>'number';
        END IF;
      END IF;
    END IF;
  END IF;

  -- Trim whitespace and return
  RETURN trim(card_number);
END;
$function$;

-- Fix public.update_event_attendee_count function
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET current_attendees = current_attendees + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET current_attendees = GREATEST(current_attendees - 1, 0) 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Enable RLS on shop_category_mappings table
ALTER TABLE public.shop_category_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shop_category_mappings
CREATE POLICY "Admins can manage shop category mappings" 
ON public.shop_category_mappings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view shop category mappings" 
ON public.shop_category_mappings
FOR SELECT
USING (true);