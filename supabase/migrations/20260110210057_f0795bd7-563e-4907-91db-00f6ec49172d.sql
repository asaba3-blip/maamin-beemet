-- Add new site settings for header title and subtitle
INSERT INTO public.site_settings (setting_key, setting_value, description) VALUES
('header_title', 'לימודי מקרא ויהדות', 'כותרת האתר שמוצגת בחלק העליון (Header)'),
('header_subtitle', 'מקור לחכמה ותורה', 'תת כותרת האתר שמוצגת בחלק העליון (Header)')
ON CONFLICT (setting_key) DO NOTHING;