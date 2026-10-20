REVOKE EXECUTE ON FUNCTION public.get_audio_analytics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_audio_daily(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_audio_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audio_daily(integer) TO authenticated;