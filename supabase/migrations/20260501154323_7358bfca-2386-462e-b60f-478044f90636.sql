-- Trigger function for likes count
CREATE OR REPLACE FUNCTION public.handle_like_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lessons SET likes_count = likes_count + 1 WHERE id = NEW.lesson_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lessons SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.lesson_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger function for comments count
CREATE OR REPLACE FUNCTION public.handle_comment_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lessons SET comments_count = comments_count + 1 WHERE id = NEW.lesson_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lessons SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.lesson_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS trg_likes_insert_count ON public.likes;
DROP TRIGGER IF EXISTS trg_likes_delete_count ON public.likes;
DROP TRIGGER IF EXISTS trg_comments_insert_count ON public.comments;
DROP TRIGGER IF EXISTS trg_comments_delete_count ON public.comments;

CREATE TRIGGER trg_likes_insert_count
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_count_change();

CREATE TRIGGER trg_likes_delete_count
AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_count_change();

CREATE TRIGGER trg_comments_insert_count
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count_change();

CREATE TRIGGER trg_comments_delete_count
AFTER DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count_change();

-- Backfill counts to fix any drift
UPDATE public.lessons l SET
  likes_count = COALESCE((SELECT COUNT(*) FROM public.likes WHERE lesson_id = l.id), 0),
  comments_count = COALESCE((SELECT COUNT(*) FROM public.comments WHERE lesson_id = l.id), 0);