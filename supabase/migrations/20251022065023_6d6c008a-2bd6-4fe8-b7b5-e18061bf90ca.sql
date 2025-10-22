-- Fix security warning by replacing the function with proper search_path
CREATE OR REPLACE FUNCTION public.update_product_inspections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;