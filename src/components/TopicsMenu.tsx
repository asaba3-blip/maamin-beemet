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
  topics?: any[];
}

export function TopicsMenu({ selectedTopic, onTopicSelect, topics: realTopics }: TopicsMenuProps) {
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  
  // Use real topics if provided, otherwise fall back to demo topics
  const displayTopics = realTopics && realTopics.length > 0 ? realTopics : topics;

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
        
        {displayTopics.map((topic) => (
          <Button
            key={topic.id}
            variant={selectedTopic === topic.name ? "secondary" : "ghost"}
            className="w-full justify-start text-right"
            onClick={() => onTopicSelect(topic.name)}
          >
            <Book className="h-4 w-4 ml-2" />
            <span>{topic.name}</span>
          </Button>
        ))}
        
      </CardContent>
    </Card>
  );
}