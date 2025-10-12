import { z } from 'zod';

// Lesson validation schema
export const lessonSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "כותרת השיעור נדרשת" })
    .max(200, { message: "כותרת השיעור חייבת להיות עד 200 תווים" }),
  summary: z.string()
    .trim()
    .min(1, { message: "תקציר השיעור נדרש" })
    .max(500, { message: "תקציר השיעור חייב להיות עד 500 תווים" }),
  content: z.string()
    .trim()
    .min(1, { message: "תוכן השיעור נדרש" }),
  topic_ids: z.array(z.string().uuid({ message: "מזהה נושא לא תקין" }))
    .min(1, { message: "יש לבחור לפחות נושא אחד" })
    .max(10, { message: "ניתן לבחור עד 10 נושאים" }),
  related_lessons: z.array(z.string().uuid({ message: "מזהה שיעור לא תקין" }))
    .max(4, { message: "ניתן לבחור עד 4 שיעורים קשורים" }),
  image_url: z.string()
    .url({ message: "כתובת URL לא תקינה" })
    .optional()
    .or(z.literal('')),
  published: z.boolean()
});

export type LessonFormData = z.infer<typeof lessonSchema>;

// Topic validation schema
export const topicSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "שם הנושא נדרש" })
    .max(100, { message: "שם הנושא חייב להיות עד 100 תווים" }),
  description: z.string()
    .trim()
    .max(500, { message: "תיאור הנושא חייב להיות עד 500 תווים" })
    .optional()
    .or(z.literal('')),
  parent_id: z.string().uuid({ message: "מזהה נושא אב לא תקין" }).nullable(),
  sort_order: z.number()
    .int({ message: "סדר המיון חייב להיות מספר שלם" })
    .min(0, { message: "סדר המיון חייב להיות 0 או יותר" })
});

export type TopicFormData = z.infer<typeof topicSchema>;

// Authentication validation schemas
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "כתובת אימייל לא תקינה" })
    .max(255, { message: "כתובת אימייל חייבת להיות עד 255 תווים" }),
  password: z.string()
    .min(8, { message: "הסיסמה חייבת להכיל לפחות 8 תווים" })
    .max(100, { message: "הסיסמה חייבת להיות עד 100 תווים" })
    .regex(/[A-Z]/, { message: "הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית" })
    .regex(/[a-z]/, { message: "הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית" })
    .regex(/[0-9]/, { message: "הסיסמה חייבת להכיל לפחות ספרה אחת" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "כתובת אימייל לא תקינה" })
    .max(255, { message: "כתובת אימייל חייבת להיות עד 255 תווים" }),
  password: z.string()
    .min(1, { message: "הסיסמה נדרשת" })
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;

// Site settings validation schema
export const siteSettingsSchema = z.object({
  site_title: z.string()
    .trim()
    .min(1, { message: "כותרת האתר נדרשת" })
    .max(100, { message: "כותרת האתר חייבת להיות עד 100 תווים" }),
  hero_title: z.string()
    .trim()
    .min(1, { message: "כותרת ראשית נדרשת" })
    .max(200, { message: "כותרת ראשית חייבת להיות עד 200 תווים" }),
  hero_subtitle: z.string()
    .trim()
    .max(500, { message: "תת כותרת חייבת להיות עד 500 תווים" })
    .optional()
    .or(z.literal('')),
  admin_message: z.string()
    .trim()
    .max(1000, { message: "הודעת מנהל חייבת להיות עד 1,000 תווים" })
    .optional()
    .or(z.literal('')),
  admin_message_enabled: z.boolean()
});

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;

// Comment validation schema
export const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "תוכן התגובה נדרש" })
    .max(1000, { message: "תגובה חייבת להיות עד 1,000 תווים" }),
  lesson_id: z.string().uuid({ message: "מזהה שיעור לא תקין" })
});

export type CommentFormData = z.infer<typeof commentSchema>;

// File upload validation
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "סוג הקובץ לא נתמך. אנא בחר קובץ JPG, PNG או WEBP" };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: "גודל הקובץ חורג מ-5MB" };
  }
  
  return { valid: true };
};

export const validateDocumentFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
    return { valid: false, error: "אנא בחר קובץ Word (.doc או .docx)" };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: "גודל הקובץ חורג מ-10MB" };
  }
  
  return { valid: true };
};
