-- Add the current logged-in user as admin
INSERT INTO public.profiles (user_id, is_admin) 
VALUES ('225afdb3-b713-413d-9aeb-439b9f92799e', true)
ON CONFLICT (user_id) 
DO UPDATE SET is_admin = true;