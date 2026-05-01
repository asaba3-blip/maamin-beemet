## Goals

1. Add a "Back to Home" button on the admin analytics dashboard (`/admin/analytics`).
2. Allow readers to add comments on lessons (limited to 50 characters), and display existing comments.
3. Make the like button actually work everywhere (toggle on/off, accurate counts, proper `isLiked` state on the home page cards).

---

## 1. Back to Home button on the dashboard

In `src/pages/AdminAnalytics.tsx`, add a `Button` with an arrow icon at the top of the page (next to the title) that navigates to `/`.

## 2. Comments (up to 50 characters)

The `comments` table and RLS policies already exist (insert: authenticated user; select: any authenticated user on published lessons; update/delete: own comment).

**LessonDetail page (`src/pages/LessonDetail.tsx`)** — add a Comments section below the article:

- Fetch comments for the lesson, joined with `profiles` (display_name, avatar_url) so each comment shows who wrote it.
- Show the list of comments (newest first) with author name, date, and content.
- For logged-in users: show a textarea + "Send" button.
  - Hard limit of 50 characters (`maxLength={50}` + a live counter `X/50`).
  - Validate with Zod before insert.
  - Disable the button while empty or > 50 chars.
- For guests: show a small CTA "התחבר כדי להגיב" linking to `/auth`.
- After insert/delete: refresh the comments list and update the lesson's `comments_count` in local state.
- Allow the comment author to delete their own comment.

**Validation (`src/lib/validation.ts`)** — change the existing `commentSchema` max from 1000 → 50 with a Hebrew message ("תגובה חייבת להיות עד 50 תווים").

**Database trigger (new migration)** — keep `lessons.comments_count` accurate automatically:

- `AFTER INSERT ON comments` → `UPDATE lessons SET comments_count = comments_count + 1 WHERE id = NEW.lesson_id`.
- `AFTER DELETE ON comments` → `UPDATE lessons SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.lesson_id`.

This keeps the counter on the cards and in the lesson header in sync with reality.

## 3. Working like button

**Home page (`src/pages/Index.tsx`)**:

- In `fetchLessons`, also fetch the current user's likes (`select lesson_id from likes where user_id = auth.uid()`) and merge `isLiked: true/false` into each lesson object so the heart icon reflects the real state.
- Rewrite `handleLike` to be a real toggle:
  - If `isLiked` → `delete from likes where lesson_id = X and user_id = me`.
  - Else → `insert into likes (lesson_id, user_id)`.
  - Optimistically update local `realLessons` state (toggle `isLiked` and adjust `likes_count` by ±1) so the UI reacts instantly without a full refetch.

**Database trigger (same migration as comments)** — keep `lessons.likes_count` accurate:

- `AFTER INSERT ON likes` → increment `lessons.likes_count`.
- `AFTER DELETE ON likes` → decrement (clamped at 0).

The LessonDetail page's like handler is already a proper toggle and will benefit from the trigger automatically.

---

## Technical notes

- New migration: two trigger functions (`public.handle_like_count_change`, `public.handle_comment_count_change`) and four triggers (insert/delete on `likes` and `comments`). Both functions are `SECURITY DEFINER`, `SET search_path = public`, and update only the `lessons` row matched by `lesson_id`.
- Optionally back-fill counts once in the migration: `UPDATE lessons SET likes_count = (SELECT count(*) FROM likes WHERE lesson_id = lessons.id), comments_count = (SELECT count(*) FROM comments WHERE lesson_id = lessons.id);` to fix any drift.
- No schema change to `comments` itself — the 50-char limit is enforced in the client (Zod + `maxLength`). RLS already prevents abuse from other users.
- All new UI text is in Hebrew, RTL-aligned, consistent with the existing design system (uses existing `Button`, `Textarea`, `Card` components — no new colors).
