
# תכנית: תיקוני SEO לאתר הנוכחי (`maamin-beemet.lovable.app`)

מטרה: לסדר את כל התגים והקבצים שמשפיעים על האינדוקס, כך שגוגל יוכל לסרוק ולאנדקס נכון את האתר עוד לפני המעבר לדומיין החדש.

---

## 1. `index.html` — תיקון Open Graph, Twitter ו-Structured Data

**הבעיה:** תגים רבים עדיין מצביעים על `https://yourdomain.com` (placeholder), מה שגורם לגוגל ולרשתות חברתיות לקבל מידע שגוי.

**השינויים:**
- `og:url` → `https://maamin-beemet.lovable.app`
- `og:image` → `https://maamin-beemet.lovable.app/placeholder.svg` (תמונה קיימת באתר)
- `twitter:url` → `https://maamin-beemet.lovable.app`
- `twitter:image` → `https://maamin-beemet.lovable.app/placeholder.svg`
- בתוך ה-JSON-LD (Structured Data):
  - `"url": "https://yourdomain.com"` → `"https://maamin-beemet.lovable.app"`
  - `"logo": "https://yourdomain.com/logo.png"` → `"https://maamin-beemet.lovable.app/placeholder.svg"`

> ה-canonical הראשי (שורה 16) כבר תקין — אין שינוי שם.

---

## 2. `public/schema.json` — סנכרון לאותן כתובות

עדכון אותם שדות (`url`, `logo`, `provider.url` אם קיים) לכתובת `https://maamin-beemet.lovable.app`. הסרת ה-`sameAs` עם כתובות פייסבוק/טוויטר placeholder אם אין חשבונות אמיתיים.

---

## 3. מחיקת `public/sitemap.xml` הסטטי

**הבעיה:** הקובץ הסטטי מכיל רק 2 דפים (מ-ינואר 2025) וסותר את ה-sitemap הדינמי שמיוצר ע"י ה-Edge Function `generate-sitemap`. ה-`_redirects` כבר מפנה את `/sitemap.xml` ל-Edge Function, אבל ייתכן שהקובץ הסטטי בפועל נטען לפני ההפניה במקרים מסוימים.

**הפתרון:** מחיקת `public/sitemap.xml` כך שההפניה ב-`_redirects` תעבוד באופן מלא ותחזיר תמיד את ה-sitemap הדינמי המעודכן עם כל השיעורים.

---

## 4. אימות ה-Edge Function `generate-sitemap`

נוודא שה-`baseUrl` בתוך `supabase/functions/generate-sitemap/index.ts` עדיין `https://maamin-beemet.lovable.app` (כך זה כבר). אין שינוי קוד נדרש כאן עכשיו, אך זה יהיה הקובץ הראשון לעדכן בעת מעבר לדומיין חדש.

---

## 5. הנחיה לאחר ההטמעה (פעולה ידנית של המשתמש)

לאחר שהשינויים יפורסמו (Publish), לבצע ב-Google Search Console:
1. **Sitemaps** → להגיש מחדש את `https://maamin-beemet.lovable.app/sitemap.xml`
2. **URL Inspection** → לבקש Indexing לדף הבית ול-3-5 דפי שיעור מרכזיים
3. לבדוק תוך 1-3 ימים שדפים נכנסים לאינדקס

---

## קבצים שישונו

| קובץ | סוג שינוי |
|---|---|
| `index.html` | עדכון תגי OG/Twitter/JSON-LD |
| `public/schema.json` | עדכון URLs |
| `public/sitemap.xml` | מחיקה (לטובת ה-sitemap הדינמי) |

לא נדרשים שינויים ב: `useCanonical.ts`, `robots.txt`, `_redirects`, או ה-Edge Function — הם כבר מוגדרים נכון לדומיין הנוכחי.

---

לאחר אישור — אעבור למצב הטמעה ואבצע את כל השינויים בבת אחת, ואז תוכל לבצע את שלב 5 ב-Search Console.
