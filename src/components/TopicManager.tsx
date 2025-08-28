import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, Plus, ChevronDown, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Topic {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  sort_order?: number;
  children?: Topic[];
}

export function TopicManager() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [parentTopic, setParentTopic] = useState<string>("");
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הנושאים",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicName.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם נושא",
        variant: "destructive",
      });
      return;
    }

    try {
      const topicData = {
        name: topicName.trim(),
        description: topicDescription.trim() || null,
        parent_id: parentTopic || null,
      };

      if (editingTopic) {
        const { error } = await supabase
          .from('topics')
          .update(topicData)
          .eq('id', editingTopic.id);
        
        if (error) throw error;
        
        toast({
          title: "הצלחה",
          description: "הנושא עודכן בהצלחה",
        });
      } else {
        const { error } = await supabase
          .from('topics')
          .insert([topicData]);
        
        if (error) throw error;
        
        toast({
          title: "הצלחה",
          description: "הנושא נוסף בהצלחה",
        });
      }

      setTopicName("");
      setTopicDescription("");
      setParentTopic("");
      setEditingTopic(null);
      fetchTopics();
    } catch (error) {
      console.error('Error saving topic:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את הנושא",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicDescription(topic.description || "");
    setParentTopic(topic.parent_id || "");
  };

  const handleDelete = async (topic: Topic) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הנושא "${topic.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topic.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הנושא נמחק בהצלחה",
      });
      
      fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את הנושא",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingTopic(null);
    setTopicName("");
    setTopicDescription("");
    setParentTopic("");
  };

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
  const buildHierarchy = (topics: Topic[]): Topic[] => {
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

  const hierarchicalTopics = buildHierarchy(topics);

  const renderTopicItem = (topic: Topic, level: number = 0) => {
    const hasChildren = topic.children && topic.children.length > 0;
    const isOpen = openTopics.has(topic.id);
    const paddingRight = level * 24;

    return (
      <div key={topic.id}>
        <div 
          className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
          style={{ paddingRight: `${paddingRight + 12}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleTopic(topic.id)}
                className="p-1 h-6 w-6"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            )}
            <div className="flex-1 text-right">
              <div className="font-medium">{topic.name}</div>
              {topic.description && (
                <div className="text-sm text-muted-foreground">{topic.description}</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(topic)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(topic)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {hasChildren && isOpen && (
          <div className="mt-2 space-y-2">
            {topic.children?.map(child => renderTopicItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get flat list of topics for parent selection
  const getFlatTopics = (topics: Topic[], level: number = 0): Array<{ topic: Topic, level: number }> => {
    const result: Array<{ topic: Topic, level: number }> = [];
    
    topics.forEach(topic => {
      result.push({ topic, level });
      if (topic.children && topic.children.length > 0) {
        result.push(...getFlatTopics(topic.children, level + 1));
      }
    });
    
    return result;
  };

  const flatTopicsForSelect = getFlatTopics(hierarchicalTopics);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingTopic ? `עריכת נושא: ${editingTopic.name}` : "הוספת נושא חדש"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="topicName">שם הנושא</Label>
              <Input
                id="topicName"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="הזן שם נושא"
                required
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="topicDescription">תיאור (אופציונלי)</Label>
              <Textarea
                id="topicDescription"
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                placeholder="הזן תיאור לנושא"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="parentTopic">נושא אב (אופציונלי)</Label>
              <Select value={parentTopic} onValueChange={setParentTopic}>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="בחר נושא אב" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ללא נושא אב</SelectItem>
                  {flatTopicsForSelect
                    .filter(({ topic }) => !editingTopic || topic.id !== editingTopic.id)
                    .map(({ topic, level }) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        <span style={{ paddingRight: `${level * 16}px` }}>
                          {topic.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingTopic ? "עדכן נושא" : "הוסף נושא"}
              </Button>
              {editingTopic && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  ביטול
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>רשימת נושאים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hierarchicalTopics.length > 0 ? (
              hierarchicalTopics.map(topic => renderTopicItem(topic))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                אין נושאים עדיין
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}