import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-visitor-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const WINDOW_HOURS = 12;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { lessonId, event } = await req.json();
    if (typeof lessonId !== "string" || !UUID.test(lessonId) || !["play", "download"].includes(event)) {
      return json({ error: "invalid input" }, 400);
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const vid = req.headers.get("x-visitor-id") || "";
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}:${ua}:${vid}`));
    const visitorHash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const url = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const authClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
        const { data } = await authClient.auth.getClaims(auth.replace("Bearer ", ""));
        const uid = data?.claims?.sub;
        if (uid) {
          const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
          if (isAdmin === true) return json({ counted: false, reason: "admin" });
        }
      } catch (_) { /* treat as anonymous */ }
    }

    const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();
    const { data: existing } = await supabase
      .from("audio_events").select("id")
      .eq("lesson_id", lessonId).eq("event_type", event).eq("visitor_hash", visitorHash)
      .gte("created_at", since).limit(1).maybeSingle();
    if (existing) return json({ counted: false });

    const { error } = await supabase.from("audio_events").insert({ lesson_id: lessonId, event_type: event, visitor_hash: visitorHash });
    if (error) { console.error(error); return json({ error: "failed" }, 500); }
    return json({ counted: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal server error" }, 500);
  }
});
