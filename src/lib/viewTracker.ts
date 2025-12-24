import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve a persistent visitor ID
const getVisitorId = (): string => {
  const STORAGE_KEY = "visitor_id";
  let visitorId = localStorage.getItem(STORAGE_KEY);
  
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, visitorId);
  }
  
  return visitorId;
};

// Track view for a lesson - call this once per page load
export const trackLessonView = async (lessonId: string): Promise<boolean> => {
  // Prevent tracking during SSR or if lessonId is invalid
  if (typeof window === "undefined" || !lessonId) {
    return false;
  }

  // Check session storage to prevent duplicate calls on rapid navigation
  const SESSION_KEY = `viewed_${lessonId}`;
  if (sessionStorage.getItem(SESSION_KEY)) {
    return false;
  }

  try {
    const visitorId = getVisitorId();
    
    const response = await supabase.functions.invoke("track-view", {
      body: { lessonId },
      headers: {
        "x-visitor-id": visitorId,
      },
    });

    if (response.error) {
      console.error("Error tracking view:", response.error);
      return false;
    }

    // Mark as viewed in this session to prevent duplicate calls
    sessionStorage.setItem(SESSION_KEY, "true");
    
    return response.data?.counted ?? false;
  } catch (error) {
    console.error("Error tracking view:", error);
    return false;
  }
};

// Format view count for display (e.g., 1234 -> "1.2K")
export const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toString();
};
