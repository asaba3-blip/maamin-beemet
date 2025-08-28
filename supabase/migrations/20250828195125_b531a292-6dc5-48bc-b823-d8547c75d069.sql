-- Insert main Bible categories with subcategories
-- First insert the main "מקרא" category if it doesn't exist
INSERT INTO public.topics (name, description, parent_id) 
VALUES ('מקרא', 'חמישה חומשי תורה, נביאים וכתובים', NULL)
ON CONFLICT DO NOTHING;

-- Get the parent ID for מקרא category
DO $$
DECLARE
    mikra_id UUID;
    genesis_id UUID;
    exodus_id UUID;
    leviticus_id UUID;
    numbers_id UUID;
    deuteronomy_id UUID;
    prophets_id UUID;
    writings_id UUID;
BEGIN
    -- Get מקרא ID
    SELECT id INTO mikra_id FROM public.topics WHERE name = 'מקרא' AND parent_id IS NULL;
    
    -- Insert Torah books
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('בראשית', 'ספר בראשית - ספר ראשון בתורה', mikra_id),
    ('שמות', 'ספר שמות - ספר שני בתורה', mikra_id),
    ('ויקרא', 'ספר ויקרא - ספר שלישי בתורה', mikra_id),
    ('במדבר', 'ספר במדבר - ספר רביעי בתורה', mikra_id),
    ('דברים', 'ספר דברים - ספר חמישי בתורה', mikra_id),
    ('נביאים', 'ספרי נביאים ראשונים ואחרונים', mikra_id),
    ('כתובים', 'ספרי כתובים - חכמה ושירה', mikra_id);
    
    -- Get IDs for Torah books
    SELECT id INTO genesis_id FROM public.topics WHERE name = 'בראשית' AND parent_id = mikra_id;
    SELECT id INTO exodus_id FROM public.topics WHERE name = 'שמות' AND parent_id = mikra_id;
    SELECT id INTO leviticus_id FROM public.topics WHERE name = 'ויקרא' AND parent_id = mikra_id;
    SELECT id INTO numbers_id FROM public.topics WHERE name = 'במדבר' AND parent_id = mikra_id;
    SELECT id INTO deuteronomy_id FROM public.topics WHERE name = 'דברים' AND parent_id = mikra_id;
    SELECT id INTO prophets_id FROM public.topics WHERE name = 'נביאים' AND parent_id = mikra_id;
    SELECT id INTO writings_id FROM public.topics WHERE name = 'כתובים' AND parent_id = mikra_id;
    
    -- Insert Torah portions for Genesis
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('בראשית', 'פרשת בראשית', genesis_id),
    ('נח', 'פרשת נח', genesis_id),
    ('לך לך', 'פרשת לך לך', genesis_id),
    ('וירא', 'פרשת וירא', genesis_id),
    ('חיי שרה', 'פרשת חיי שרה', genesis_id),
    ('תולדות', 'פרשת תולדות', genesis_id),
    ('ויצא', 'פרשת ויצא', genesis_id),
    ('וישלח', 'פרשת וישלח', genesis_id),
    ('וישב', 'פרשת וישב', genesis_id),
    ('מקץ', 'פרשת מקץ', genesis_id),
    ('ויגש', 'פרשת ויגש', genesis_id),
    ('ויחי', 'פרשת ויחי', genesis_id);
    
    -- Insert Torah portions for Exodus
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('שמות', 'פרשת שמות', exodus_id),
    ('וארא', 'פרשת וארא', exodus_id),
    ('בא', 'פרשת בא', exodus_id),
    ('בשלח', 'פרשת בשלח', exodus_id),
    ('יתרו', 'פרשת יתרו', exodus_id),
    ('משפטים', 'פרשת משפטים', exodus_id),
    ('תרומה', 'פרשת תרומה', exodus_id),
    ('תצוה', 'פרשת תצוה', exodus_id),
    ('כי תשא', 'פרשת כי תשא', exodus_id),
    ('ויקהל', 'פרשת ויקהל', exodus_id),
    ('פקודי', 'פרשת פקודי', exodus_id);
    
    -- Insert Torah portions for Leviticus
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('ויקרא', 'פרשת ויקרא', leviticus_id),
    ('צו', 'פרשת צו', leviticus_id),
    ('שמיני', 'פרשת שמיני', leviticus_id),
    ('תזריע', 'פרשת תזריע', leviticus_id),
    ('מצורע', 'פרשת מצורע', leviticus_id),
    ('אחרי מות', 'פרשת אחרי מות', leviticus_id),
    ('קדושים', 'פרשת קדושים', leviticus_id),
    ('אמור', 'פרשת אמור', leviticus_id),
    ('בהר', 'פרשת בהר', leviticus_id),
    ('בחוקותי', 'פרשת בחוקותי', leviticus_id);
    
    -- Insert Torah portions for Numbers
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('במדבר', 'פרשת במדבר', numbers_id),
    ('נשא', 'פרשת נשא', numbers_id),
    ('בהעלותך', 'פרשת בהעלותך', numbers_id),
    ('שלח לך', 'פרשת שלח לך', numbers_id),
    ('קרח', 'פרשת קרח', numbers_id),
    ('חוקת', 'פרשת חוקת', numbers_id),
    ('בלק', 'פרשת בלק', numbers_id),
    ('פינחס', 'פרשת פינחס', numbers_id),
    ('מטות', 'פרשת מטות', numbers_id),
    ('מסעי', 'פרשת מסעי', numbers_id);
    
    -- Insert Torah portions for Deuteronomy
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('דברים', 'פרשת דברים', deuteronomy_id),
    ('ואתחנן', 'פרשת ואתחנן', deuteronomy_id),
    ('עקב', 'פרשת עקב', deuteronomy_id),
    ('ראה', 'פרשת ראה', deuteronomy_id),
    ('שופטים', 'פרשת שופטים', deuteronomy_id),
    ('כי תצא', 'פרשת כי תצא', deuteronomy_id),
    ('כי תבוא', 'פרשת כי תבוא', deuteronomy_id),
    ('נצבים', 'פרשת נצבים', deuteronomy_id),
    ('וילך', 'פרשת וילך', deuteronomy_id),
    ('האזינו', 'פרשת האזינו', deuteronomy_id),
    ('וזאת הברכה', 'פרשת וזאת הברכה', deuteronomy_id);
    
    -- Insert main Prophets sections
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('נביאים ראשונים', 'יהושע, שופטים, שמואל, מלכים', prophets_id),
    ('נביאים אחרונים', 'ישעיהו, ירמיהו, יחזקאל, תרי עשר', prophets_id);
    
    -- Insert main Writings sections
    INSERT INTO public.topics (name, description, parent_id) VALUES
    ('ספרי אמת', 'תהילים, משלי, איוב', writings_id),
    ('חמש מגילות', 'שיר השירים, רות, איכה, קהלת, אסתר', writings_id),
    ('ספרים אחרונים', 'דניאל, עזרא-נחמיה, דברי הימים', writings_id);
    
END $$;