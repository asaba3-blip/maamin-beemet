import { supabase } from "@/integrations/supabase/client";

const getVisitorId = () => {
  let v = localStorage.getItem("visitor_id");
  if (!v) { v = crypto.randomUUID(); localStorage.setItem("visitor_id", v); }
  return v;
};

export const trackAudio = async (lessonId: string, event: "play" | "download") => {
  const key = `audio_${event}_${lessonId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  try {
    await supabase.functions.invoke("track-audio", {
      body: { lessonId, event },
      headers: { "x-visitor-id": getVisitorId() },
    });
  } catch (e) {
    console.error("audio tracking failed", e);
  }
};

export const downloadAudio = async (lessonId: string, url: string, title: string) => {
  trackAudio(lessonId, "download");
  const ext = (url.split("?")[0].split(".").pop() || "mp3").slice(0, 5);
  const name = `${title.replace(/[\\/:*?"<>|]/g, "").trim() || "lesson"}.${ext}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
  } catch {
    window.open(url, "_blank");
  }
};
