-- Fix function search path
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public, auth
AS $$
  SELECT is_admin FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;