import { useState } from "react";
import { ChevronDown, ChevronLeft, Book, Scroll, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Topic {
  id: string;
  name: string;
  icon?: any;
  description?: string;
  parent_id?: string | null;
  children?: Topic[];
}

const topics: Topic[] = [
  {
    id: "torah",
    name: "פרשיות השבוע",
    icon: Scroll,
  },
  {
    id: "faith",
    name: "עקרונות האמונה",
    icon: Star,
  },
  {
    id: "wisdom",
    name: "ספרי חכמה",
    icon: Book,
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

  // Build hierarchy from flat topics array
  const buildHierarchy = (topics: any[]): Topic[] => {
    const topicsMap = new Map();
    const roots: Topic[] = [];

    // First pass: create all topic objects
    topics.forEach(topic => {
      topicsMap.set(topic.id, { ...topic, children: [] });
    });

    // Second pass: build hierarchy
    topics.forEach(topic => {
      const topicWithChildren = topicsMap.get(topic.id);
      if (topic.parent_id) {
        const parent = topicsMap.get(topic.parent_id);
        if (parent) {
          parent.children.push(topicWithChildren);
        }
      } else {
        roots.push(topicWithChildren);
      }
    });

    return roots;
  };

  const hierarchicalTopics = Array.isArray(displayTopics) ? buildHierarchy(displayTopics) : [];

  const renderTopic = (topic: Topic, level: number = 0) => {
    const hasChildren = topic.children && topic.children.length > 0;
    const isOpen = openTopics.has(topic.id);
    const paddingLeft = level * 16;

    return (
      <div key={topic.id}>
        {hasChildren ? (
          <Collapsible open={isOpen} onOpenChange={() => toggleTopic(topic.id)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-right h-auto py-2"
                style={{ paddingRight: `${paddingLeft + 12}px` }}
              >
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  <span className="text-sm">{topic.name}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {topic.children?.map(child => renderTopic(child, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant={selectedTopic === topic.name ? "secondary" : "ghost"}
            className="w-full justify-start text-right h-auto py-2"
            style={{ paddingRight: `${paddingLeft + 12}px` }}
            onClick={() => onTopicSelect(topic.name)}
          >
            <Book className="h-4 w-4 ml-2" />
            <span className="text-sm">{topic.name}</span>
          </Button>
        )}
      </div>
    );
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
        
        {hierarchicalTopics.map(topic => renderTopic(topic))}
        
      </CardContent>
    </Card>
  );
}