import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TopicsMenu } from "@/components/TopicsMenu";
import { LessonCard } from "@/components/LessonCard";
import { AdminPanel } from "@/components/AdminPanel";
import { useToast } from "@/hooks/use-toast";
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
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lessons, setLessons] = useState(demoLessons);
  const [topics, setTopics] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLessons();
      fetchTopics();
    }
  }, [user]);

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
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        *,
        topics (
          id,
          name,
          description
        )
      `)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lessons:", error);
    } else {
      setRealLessons(data || []);
    }
  };

  // Use real lessons from database if user is logged in, otherwise use demo data
  const displayLessons = user ? realLessons : lessons;

  // Filter lessons based on search and topic
  const filteredLessons = displayLessons.filter((lesson) => {
    const lessonTitle = lesson.title || "";
    const lessonSummary = lesson.summary || "";
    const lessonTopic = user ? lesson.topics?.name || "" : lesson.topic || "";
    
    const matchesSearch = searchQuery === "" || 
      lessonTitle.includes(searchQuery) || 
      lessonSummary.includes(searchQuery) ||
      lessonTopic.includes(searchQuery);
    
    const matchesTopic = selectedTopic === null || lessonTopic === selectedTopic;
    
    return matchesSearch && matchesTopic;
  });

  const handleLike = async (lessonId: string) => {
    if (!user) {
      toast({
        title: "נדרשת התחברות",
        description: "אנא התחבר כדי לסמן שיעורים במועדפים",
        variant: "destructive",
      });
      return;
    }

    if (user) {
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
    } else {
      // Handle demo likes for non-logged-in users
      setLessons(lessons.map(lesson => 
        lesson.id === lessonId 
          ? { 
              ...lesson, 
              isLiked: !lesson.isLiked,
              likes: lesson.isLiked ? lesson.likes - 1 : lesson.likes + 1
            }
          : lesson
      ));
    }
  };

  const handleReadMore = (lessonId: string) => {
    // This would navigate to a lesson detail page
    console.log("Navigate to lesson:", lessonId);
  };

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
        user={user}
        isAdmin={isAdmin}
        onAdminToggle={() => setShowAdmin(!showAdmin)}
        onSignOut={async () => {
          // This will be handled by the useAuth hook
        }}
      />
      
      {!user && <HeroSection />}
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {user && isAdmin && (
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowAdmin(true)}
              className="text-primary hover:underline"
            >
              עבור לפאנל הניהול
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Topics Menu */}
          <div className="lg:col-span-1">
            <TopicsMenu 
              selectedTopic={selectedTopic}
              onTopicSelect={setSelectedTopic}
              topics={user ? topics : undefined}
            />
          </div>
          
          {/* Lessons Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-right mb-2">
                {selectedTopic ? `שיעורים בנושא: ${selectedTopic}` : "כל השיעורים"}
              </h2>
              <p className="text-muted-foreground text-right">
                {filteredLessons.length} שיעורים נמצאו
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onLike={handleLike}
                  onReadMore={handleReadMore}
                />
              ))}
            </div>
            
            {filteredLessons.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {displayLessons.length === 0 
                    ? "עדיין לא נוספו שיעורים" 
                    : "לא נמצאו שיעורים התואמים את החיפוש שלך"
                  }
                </p>
                {!user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <a href="/auth" className="text-primary hover:underline">
                      התחבר
                    </a> כדי לראות את כל השיעורים
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
