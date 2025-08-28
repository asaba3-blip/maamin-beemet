-- Fix the chronological order more carefully by handling foreign key constraints
-- First update the TopicManager to sort by created_at instead of name to maintain chronological order
-- Also fix some data issues

-- Create a new column for ordering
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update the מקרא parent topic to have proper sort order
UPDATE topics SET sort_order = 1 WHERE name = 'מקרא' AND parent_id IS NULL;

-- Now let's add proper sort orders for the existing Torah portions in chronological order
-- We'll keep the existing data but just add proper sort orders

-- Torah portions in order (based on their names)
UPDATE topics SET sort_order = 1 WHERE name = 'בראשית' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 2 WHERE name = 'נח' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 3 WHERE name = 'לך לך' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 4 WHERE name = 'וירא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 5 WHERE name = 'חיי שרה' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 6 WHERE name = 'תולדות' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 7 WHERE name = 'ויצא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 8 WHERE name = 'וישלח' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 9 WHERE name = 'וישב' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 10 WHERE name = 'מקץ' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 11 WHERE name = 'ויגש' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 12 WHERE name = 'ויחי' AND parent_id IS NOT NULL;

-- Sefer Shemot
UPDATE topics SET sort_order = 13 WHERE name = 'שמות' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 14 WHERE name = 'וארא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 15 WHERE name = 'בא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 16 WHERE name = 'בשלח' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 17 WHERE name = 'יתרו' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 18 WHERE name = 'משפטים' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 19 WHERE name = 'תרומה' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 20 WHERE name = 'תצוה' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 21 WHERE name = 'כי תשא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 22 WHERE name = 'ויקהל' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 23 WHERE name = 'פקודי' AND parent_id IS NOT NULL;

-- Sefer Vayikra
UPDATE topics SET sort_order = 24 WHERE name = 'ויקרא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 25 WHERE name = 'צו' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 26 WHERE name = 'שמיני' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 27 WHERE name = 'תזריע' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 28 WHERE name = 'מצורע' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 29 WHERE name = 'אחרי מות' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 30 WHERE name = 'קדושים' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 31 WHERE name = 'אמור' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 32 WHERE name = 'בהר' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 33 WHERE name = 'בחקותי' AND parent_id IS NOT NULL;

-- Sefer Bamidbar
UPDATE topics SET sort_order = 34 WHERE name = 'במדבר' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 35 WHERE name = 'נשא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 36 WHERE name = 'בהעלותך' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 37 WHERE name = 'שלח לך' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 38 WHERE name = 'קרח' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 39 WHERE name = 'חקת' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 40 WHERE name = 'בלק' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 41 WHERE name = 'פינחס' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 42 WHERE name = 'מטות' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 43 WHERE name = 'מסעי' AND parent_id IS NOT NULL;

-- Sefer Devarim
UPDATE topics SET sort_order = 44 WHERE name = 'דברים' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 45 WHERE name = 'ואתחנן' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 46 WHERE name = 'עקב' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 47 WHERE name = 'ראה' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 48 WHERE name = 'שופטים' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 49 WHERE name = 'כי תצא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 50 WHERE name = 'כי תבוא' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 51 WHERE name = 'נצבים' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 52 WHERE name = 'וילך' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 53 WHERE name = 'האזינו' AND parent_id IS NOT NULL;
UPDATE topics SET sort_order = 54 WHERE name = 'וזאת הברכה' AND parent_id IS NOT NULL;