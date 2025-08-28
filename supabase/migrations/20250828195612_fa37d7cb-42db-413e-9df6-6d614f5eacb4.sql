-- Create site settings table
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site settings
CREATE POLICY "Anyone can read site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (get_current_user_admin_status() = true);

CREATE POLICY "Admin can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (get_current_user_admin_status() = true);

CREATE POLICY "Admin can delete site settings" 
ON public.site_settings 
FOR DELETE 
USING (get_current_user_admin_status() = true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, description) VALUES
('site_title', 'לימודי מקרא ויהדות', 'כותרת ראשית של האתר'),
('hero_title', 'ברוכים הבאים ללימודי תורה', 'כותרת בסקשן הגיבור'),
('hero_subtitle', 'גלו את עומק החכמה הנצחית דרך שיעורי מקרא ותורה מעמיקים', 'תת כותרת בסקשן הגיבור'),
('admin_message', '', 'הודעת מנהל שמוצגת בדף הבית'),
('admin_message_enabled', 'false', 'האם להציג את הודעת המנהל');