import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User } from "@supabase/supabase-js";
import { Upload, FileText, Edit, Trash2, Eye, Image, Settings, BookOpen } from "lucide-react";
import mammoth from "mammoth";
import ReactQuill from "react-quill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicManager } from "./TopicManager";

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface Lesson {
  id: string;
  title: string;
  summary: string;
  content: string;
  topic_id: string | null;
  image_url: string | null;
  published: boolean;
  created_at: string;
  topics?: Topic;
}

interface AdminPanelProps {
  user: User;
}

export function AdminPanel({ user }: AdminPanelProps) {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState("");
  const [published, setPublished] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchTopics();
    fetchLessons();
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הנושאים",
        variant: "destructive",
      });
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
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את השיעורים",
        variant: "destructive",
      });
    } else {
      setLessons(data || []);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes("document") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        setSelectedFile(file);
        toast({
          title: "קובץ נבחר",
          description: `נבחר: ${file.name}`,
        });
      } else {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ Word (.doc או .docx)",
          variant: "destructive",
        });
      }
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        toast({
          title: "תמונה נבחרה",
          description: `נבחרה: ${file.name}`,
        });
      } else {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ תמונה",
          variant: "destructive",
        });
      }
    }
  };

  const processWordFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Extract HTML instead of raw text to preserve formatting
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error("Error processing Word file:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעבד את קובץ ה-Word",
        variant: "destructive",
      });
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Form submission started", { 
      title, 
      summary, 
      topicId, 
      published, 
      imageFile: !!imageFile,
      selectedFile: !!selectedFile 
    });

    try {
      let finalContent = content;

      // Process Word file if uploaded
      if (selectedFile) {
        finalContent = await processWordFile(selectedFile);
        setContent(finalContent);
        toast({
          title: "קובץ Word עובד",
          description: "התוכן הועתק מקובץ ה-Word אוטומטית",
        });
      }

      let uploadedImageUrl = imageUrl;

      // Upload image if selected
      if (imageFile) {
        console.log("Starting image upload", { fileName: imageFile.name, size: imageFile.size });
        const fileName = `lesson-${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lesson-images')
          .upload(fileName, imageFile);

        console.log("Image upload result", { uploadData, uploadError });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast({
            title: "שגיאה",
            description: "לא ניתן להעלות את התמונה",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('lesson-images')
            .getPublicUrl(fileName);
          uploadedImageUrl = publicUrl;
          console.log("Image uploaded successfully", { publicUrl });
        }
      }

      const lessonData = {
        title,
        summary,
        content: finalContent,
        topic_id: topicId || null,
        image_url: uploadedImageUrl,
        published
      };

      console.log("Saving lesson data", lessonData);

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", editingLesson.id);
        
        console.log("Update lesson result", { error });
        
        if (error) {
          console.error("Error updating lesson:", error);
          throw error;
        }

        toast({
          title: "השיעור עודכן",
          description: "השיעור עודכן בהצלחה",
        });
      } else {
        const { error } = await supabase
          .from("lessons")
          .insert([lessonData]);
        
        console.log("Insert lesson result", { error });
        
        if (error) {
          console.error("Error creating lesson:", error);
          throw error;
        }

        toast({
          title: "השיעור נוצר",
          description: "השיעור נוצר בהצלחה",
        });
      }

      // Reset form
      setTitle("");
      setSummary("");
      setContent("");
      setTopicId("");
      setPublished(false);
      setSelectedFile(null);
      setImageFile(null);
      setImageUrl("");
      setEditingLesson(null);
      
      console.log("Form cleared, refreshing lessons");
      // Refresh lessons
      fetchLessons();
      console.log("Lessons refresh called");
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת השיעור",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("Form submission finished, loading:", false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    console.log("Editing lesson:", lesson);
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setSummary(lesson.summary);
    setContent(lesson.content);
    setTopicId(lesson.topic_id || "");
    setPublished(lesson.published);
    setImageUrl(lesson.image_url || "");
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את השיעור?")) return;

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את השיעור",
        variant: "destructive",
      });
    } else {
      toast({
        title: "השיעור נמחק",
        description: "השיעור נמחק בהצלחה",
      });
      fetchLessons();
    }
  };

  const togglePublished = async (lesson: Lesson) => {
    const { error } = await supabase
      .from("lessons")
      .update({ published: !lesson.published })
      .eq("id", lesson.id);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את סטטוס הפרסום",
        variant: "destructive",
      });
    } else {
      toast({
        title: "עודכן",
        description: lesson.published ? "השיעור הוסר מהפרסום" : "השיעור פורסם",
      });
      fetchLessons();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            ← חזרה לדף הבית
          </Button>
          <h1 className="text-3xl font-bold">פאנל ניהול</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          מחובר כמנהל: {user.email}
        </div>
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            ניהול שיעורים
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            ניהול קטגוריות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">

      {/* Form for creating/editing lessons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editingLesson ? "עריכת שיעור" : "יצירת שיעור חדש"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">כותרת השיעור</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="הכנס כותרת לשיעור"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">נושא</Label>
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נושא" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">תקציר השיעור</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="הכנס תקציר קצר לשיעור"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">תמונה לשיעור</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="flex-1"
                  />
                  <Image className="h-5 w-5 text-muted-foreground" />
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={imageUrl} 
                      alt="תצוגה מקדימה" 
                      className="h-32 w-auto rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">העלאת קובץ Word (אוטומטי)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    קובץ נבחר: {selectedFile.name} - התוכן יועתק אוטומטית
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">תוכן השיעור</Label>
              <div className="text-sm text-muted-foreground mb-2">
                ניתן להעתיק טקסט מקובץ Word עם שמירה על עיצוב (מודגש, קו תחתון וכו')
              </div>
              <div className="border rounded-md" dir="rtl">
                <ReactQuill
                  value={content}
                  onChange={setContent}
                  placeholder="הכנס את תוכן השיעור או העתק מקובץ Word עם שמירה על עיצוב"
                  style={{ minHeight: '400px', direction: 'rtl' }}
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'align': [] }],
                      ['blockquote', 'code-block'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
              />
              <Label htmlFor="published">פרסם מיד</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "שומר..." : editingLesson ? "עדכן שיעור" : "צור שיעור"}
              </Button>
              {editingLesson && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingLesson(null);
                    setTitle("");
                    setSummary("");
                    setContent("");
                    setTopicId("");
                    setPublished(false);
                    setSelectedFile(null);
                    setImageFile(null);
                    setImageUrl("");
                  }}
                >
                  ביטול
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lessons list */}
      <Card>
        <CardHeader>
          <CardTitle>שיעורים קיימים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lesson.topics?.name || "ללא נושא"} • {" "}
                    {lesson.published ? "פורסם" : "טיוטה"} • {" "}
                    {new Date(lesson.created_at).toLocaleDateString("he-IL")}
                  </p>
                  <p className="text-sm mt-1">{lesson.summary}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublished(lesson)}
                  >
                    <Eye className="h-4 w-4" />
                    {lesson.published ? "הסתר" : "פרסם"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(lesson)}
                  >
                    <Edit className="h-4 w-4" />
                    ערוך
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(lesson.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק
                  </Button>
                </div>
              </div>
            ))}
            {lessons.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                עדיין לא נוצרו שיעורים
              </p>
            )}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="topics">
          <TopicManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}