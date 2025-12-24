import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-visitor-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Time window in hours to prevent duplicate counting
const VIEW_WINDOW_HOURS = 12;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { lessonId } = await req.json();

    if (!lessonId) {
      return new Response(JSON.stringify({ error: "lessonId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate visitor hash from IP + User-Agent + custom visitor ID
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const visitorId = req.headers.get("x-visitor-id") || "";
    
    // Create a hash of the visitor identity
    const encoder = new TextEncoder();
    const data = encoder.encode(`${ip}:${userAgent}:${visitorId}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const visitorHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Initialize Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this visitor already viewed this lesson within the time window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - VIEW_WINDOW_HOURS);

    const { data: existingView } = await supabase
      .from("lesson_views")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("visitor_hash", visitorHash)
      .gte("created_at", windowStart.toISOString())
      .maybeSingle();

    if (existingView) {
      // Already counted this view recently
      return new Response(
        JSON.stringify({ success: true, counted: false, message: "View already counted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new view record
    const { error: insertError } = await supabase
      .from("lesson_views")
      .insert({
        lesson_id: lessonId,
        visitor_hash: visitorHash,
      });

    if (insertError) {
      console.error("Error inserting view:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record view" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment the views_count on the lesson
    const { error: rpcError } = await supabase.rpc("increment_lesson_views", {
      p_lesson_id: lessonId,
    });

    if (rpcError) {
      console.error("Error incrementing view count:", rpcError);
      // View was still recorded, just count wasn't incremented
    }

    return new Response(
      JSON.stringify({ success: true, counted: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in track-view:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
