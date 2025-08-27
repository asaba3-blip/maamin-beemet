import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TopicsMenu } from "@/components/TopicsMenu";
import { LessonCard } from "@/components/LessonCard";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lessons, setLessons] = useState(demoLessons);

  // Filter lessons based on search and topic
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = searchQuery === "" || 
      lesson.title.includes(searchQuery) || 
      lesson.summary.includes(searchQuery) ||
      lesson.topic.includes(searchQuery);
    
    const matchesTopic = selectedTopic === null || lesson.topic === selectedTopic;
    
    return matchesSearch && matchesTopic;
  });

  const handleLike = (lessonId: string) => {
    setLessons(lessons.map(lesson => 
      lesson.id === lessonId 
        ? { 
            ...lesson, 
            isLiked: !lesson.isLiked,
            likes: lesson.isLiked ? lesson.likes - 1 : lesson.likes + 1
          }
        : lesson
    ));
  };

  const handleReadMore = (lessonId: string) => {
    // This would navigate to a lesson detail page
    console.log("Navigate to lesson:", lessonId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <HeroSection />
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Topics Menu */}
          <div className="lg:col-span-1">
            <TopicsMenu 
              selectedTopic={selectedTopic}
              onTopicSelect={setSelectedTopic}
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
                  לא נמצאו שיעורים התואמים את החיפוש שלך
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
