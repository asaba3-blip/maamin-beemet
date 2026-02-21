import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCanonical } from "@/hooks/useCanonical";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TopicsMenu } from "@/components/TopicsMenu";
import { LessonCard } from "@/components/LessonCard";
import { AdminPanel } from "@/components/AdminPanel";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import lesson1Image from "@/assets/lesson1.jpg";
import lesson2Image from "@/assets/lesson2.jpg";
import lesson3Image from "@/assets/lesson3.jpg";

// Demo data for lessons
const demoLessons = [
  {
    id: "1",
    title: "פרשת בראשית - בריאת העולם ומשמעותה",
    summary: "שיעור מעמיק על סיפור הבריאה במקרא ומשמעותו הרוחנית והפילוסופית. נבחן את השאלות הגדולות על מקומו של האדם ביקום ותפקידו בעולם.",
    image: lesson1Image,
    topic: "פרשיות השבוע",
    date: "25 באוג׳ 2024",
    readTime: "15 דקות",
    likes: 23,
    comments: 8,
    isLiked: false
  },
  {
    id: "2", 
    title: "עקרונות האמונה - יסודות הדת היהודית",
    summary: "מבוא לעקרונות היסוד של האמונה היהודית על פי הרמב״ם. נלמד על שלושה עשר עיקרי האמונה ומשמעותם בחיינו היומיומיים.",
    image: lesson2Image,
    topic: "עקרונות האמונה",
    date: "20 באוג׳ 2024", 
    readTime: "12 דקות",
    likes: 18,
    comments: 5,
    isLiked: true
  },
  {
    id: "3",
    title: "תהילים - שירי התפילה של דוד המלך",
    summary: "עיון בספר תהילים ובמזמורים הנפוצים בתפילה. נבין את הרקע ההיסטורי, המשמעות הרוחנית והשפעתם על היהדות לדורותיה.",
    image: lesson3Image,
    topic: "ספרי חכמה",
    date: "15 באוג׳ 2024",
    readTime: "20 דקות", 
    likes: 31,
    comments: 12,
    isLiked: false
  }
];

const Index = () => {
  useCanonical("/");
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lessons, setLessons] = useState(demoLessons);
  const [topics, setTopics] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>({});

  useEffect(() => {
    fetchSiteSettings();
    fetchTopics();
    fetchLessons(); // Always fetch lessons, regardless of user status
  }, []);


  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {}) || {};

      setSiteSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching topics:", error);
    } else {
      setTopics(data || []);
    }
  };

  const fetchLessons = async () => {
    let query = supabase
      .from("lessons")
      .select("*");
    
    // Only filter by published for non-admin users
    if (!isAdmin) {
      query = query.eq("published", true);
    }
    
    const { data: lessonsData, error: lessonsError } = await query.order("created_at", { ascending: false });

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      setRealLessons([]);
      return;
    }

    // Fetch lesson topics mapping
    const { data: lessonTopicsData } = await supabase
      .from("lesson_topics")
      .select("lesson_id, topic_id");

    // Fetch all topics
    const { data: topicsData } = await supabase
      .from("topics")
      .select("id, name");

    // Map topics to lessons
    const lessonsWithTopics = lessonsData?.map(lesson => {
      const topicIds = lessonTopicsData?.filter(lt => lt.lesson_id === lesson.id).map(lt => lt.topic_id) || [];
      const lessonTopics = topicsData?.filter(t => topicIds.includes(t.id)) || [];
      
      return {
        ...lesson,
        lesson_topics: lessonTopics.map(topic => ({ topics: topic }))
      };
    }) || [];

    setRealLessons(lessonsWithTopics);
  };

  // Always use real lessons from database
  const displayLessons = realLessons.length > 0 ? realLessons : lessons;

  // Filter lessons based on search and topic
  const filteredLessons = displayLessons.filter((lesson) => {
    const lessonTitle = lesson.title || "";
    const lessonSummary = lesson.summary || "";
    
    const matchesSearch = searchQuery === "" || 
      lessonTitle.includes(searchQuery) || 
      lessonSummary.includes(searchQuery);
    
    // Get lesson topics from the lesson_topics relationship
    const lessonTopics = lesson.lesson_topics?.map((lt: any) => lt.topics?.name).filter(Boolean) || [];
    
    const matchesTopic = selectedTopic === null || lessonTopics.includes(selectedTopic);
    
    return matchesSearch && matchesTopic;
  });

  const handleLike = async (lessonId: string) => {
    if (!user) {
      toast({
        title: "נדרשת התחברות",
        description: "יש להתחבר כדי לאהוב שיעורים",
        variant: "destructive",
      });
      return;
    }

    console.log("Liking lesson:", lessonId);
    
    // Handle real likes for logged-in users
    const { error } = await supabase
      .from("likes")
      .upsert({ 
        lesson_id: lessonId, 
        user_id: user.id 
      }, { 
        onConflict: "lesson_id,user_id" 
      });

    if (error) {
      console.error("Error liking lesson:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לסמן את השיעור במועדפים",
        variant: "destructive",
      });
    } else {
      fetchLessons(); // Refresh lessons
    }
  };

  const handleReadMore = (lessonId: string) => {
    window.location.href = `/lesson/${lessonId}`;
  };

  // Update document title with dynamic site title
  useEffect(() => {
    if (siteSettings.site_title) {
      document.title = siteSettings.site_title;
    }
  }, [siteSettings.site_title]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Show admin panel if user is admin and showAdmin is true
  if (isAdmin && showAdmin) {
    return <AdminPanel user={user!} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lessons={displayLessons}
        user={user}
        isAdmin={isAdmin}
        onAdminToggle={() => setShowAdmin(!showAdmin)}
        onSignOut={async () => {
          const { signOut } = useAuth();
          await signOut();
        }}
        headerTitle={siteSettings.header_title || "לימודי מקרא ויהדות"}
        headerSubtitle={siteSettings.header_subtitle || "מקור לחכמה ותורה"}
      />
      
      <HeroSection 
        title={siteSettings.hero_title || "ברוכים הבאים ללימודי תורה"}
        subtitle={siteSettings.hero_subtitle || "מקום למחשבה עמוקה, לימוד משמעותי וחיבור אמיתי למקורות החכמה היהודית"}
      />

      {/* Admin Message */}
      {siteSettings.admin_message_enabled === 'true' && siteSettings.admin_message && (
        <div className="container mx-auto px-4 py-6">
          <Alert className="bg-primary/10 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-right" dir="rtl">
              {siteSettings.admin_message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Topics Sidebar */}
          <div className="lg:col-span-1">
            <TopicsMenu 
              selectedTopic={selectedTopic}
              onTopicSelect={setSelectedTopic}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h2 id="lessons" className="text-3xl font-bold mb-4 text-center">שיעורים אחרונים</h2>
              <p className="text-muted-foreground text-center mb-8">
                {filteredLessons.length} שיעורים זמינים
              </p>
            </div>

            {filteredLessons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedTopic ? "לא נמצאו שיעורים התואמים את החיפוש" : "עדיין לא הועלו שיעורים"}
                </p>
                {!user && (
                  <Link 
                    to="/auth" 
                    className="text-primary hover:underline"
                  >
                    התחבר כדי לראות שיעורים נוספים
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onLike={handleLike}
                    onReadMore={handleReadMore}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;