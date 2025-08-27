import { useState } from "react";
import { ChevronDown, ChevronLeft, Book, Scroll, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Topic {
  id: string;
  name: string;
  icon: any;
  subtopics?: { id: string; name: string }[];
}

const topics: Topic[] = [
  {
    id: "torah",
    name: "פרשיות השבוע",
    icon: Scroll,
    subtopics: [
      { id: "genesis", name: "בראשית" },
      { id: "exodus", name: "שמות" },
      { id: "leviticus", name: "ויקרא" },
      { id: "numbers", name: "במדבר" },
      { id: "deuteronomy", name: "דברים" }
    ]
  },
  {
    id: "faith",
    name: "עקרונות האמונה",
    icon: Star,
    subtopics: [
      { id: "principles", name: "עיקרי האמונה" },
      { id: "prayer", name: "תפילה ועבודה" },
      { id: "holidays", name: "מועדים וחגים" },
      { id: "ethics", name: "מוסר ומידות" }
    ]
  },
  {
    id: "wisdom",
    name: "ספרי חכמה",
    icon: Book,
    subtopics: [
      { id: "psalms", name: "תהילים" },
      { id: "proverbs", name: "משלי" },
      { id: "ecclesiastes", name: "קהלת" },
      { id: "job", name: "איוב" }
    ]
  }
];

interface TopicsMenuProps {
  selectedTopic: string | null;
  onTopicSelect: (topicId: string | null) => void;
}

export function TopicsMenu({ selectedTopic, onTopicSelect }: TopicsMenuProps) {
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    const newOpenTopics = new Set(openTopics);
    if (newOpenTopics.has(topicId)) {
      newOpenTopics.delete(topicId);
    } else {
      newOpenTopics.add(topicId);
    }
    setOpenTopics(newOpenTopics);
  };

  return (
    <Card className="h-fit shadow-card">
      <CardHeader>
        <CardTitle className="text-lg text-center">מפתח נושאים</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={selectedTopic === null ? "default" : "ghost"}
          className="w-full justify-start text-right"
          onClick={() => onTopicSelect(null)}
        >
          <span>כל השיעורים</span>
        </Button>
        
        {topics.map((topic) => (
          <div key={topic.id} className="space-y-1">
            <Collapsible
              open={openTopics.has(topic.id)}
              onOpenChange={() => toggleTopic(topic.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-right"
                >
                  <ChevronLeft 
                    className={`h-4 w-4 transition-transform ${
                      openTopics.has(topic.id) ? "rotate-90" : ""
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span>{topic.name}</span>
                    <topic.icon className="h-4 w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              {topic.subtopics && (
                <CollapsibleContent className="space-y-1 mr-4">
                  {topic.subtopics.map((subtopic) => (
                    <Button
                      key={subtopic.id}
                      variant={selectedTopic === subtopic.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-right"
                      onClick={() => onTopicSelect(subtopic.id)}
                    >
                      <span>{subtopic.name}</span>
                    </Button>
                  ))}
                </CollapsibleContent>
              )}
            </Collapsible>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}