import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe } from "lucide-react";
import { siteSettingsSchema } from "@/lib/validation";

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
}

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [siteTitle, setSiteTitle] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminMessageEnabled, setAdminMessageEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      setSettings(data || []);
      
      // Populate form fields with current settings
      data?.forEach(setting => {
        switch (setting.setting_key) {
          case 'site_title':
            setSiteTitle(setting.setting_value || '');
            break;
          case 'hero_title':
            setHeroTitle(setting.setting_value || '');
            break;
          case 'hero_subtitle':
            setHeroSubtitle(setting.setting_value || '');
            break;
          case 'admin_message':
            setAdminMessage(setting.setting_value || '');
            break;
          case 'admin_message_enabled':
            setAdminMessageEnabled(setting.setting_value === 'true');
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הגדרות האתר",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: value })
      .eq('setting_key', key);

    if (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate form data
      const validationResult = siteSettingsSchema.safeParse({
        site_title: siteTitle,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        admin_message: adminMessage,
        admin_message_enabled: adminMessageEnabled
      });

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => err.message).join(', ');
        toast({
          title: "שגיאת תיקוף",
          description: errorMessages,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update all settings
      await Promise.all([
        updateSetting('site_title', siteTitle),
        updateSetting('hero_title', heroTitle),
        updateSetting('hero_subtitle', heroSubtitle),
        updateSetting('admin_message', adminMessage),
        updateSetting('admin_message_enabled', adminMessageEnabled.toString()),
      ]);

      toast({
        title: "הצלחה",
        description: "הגדרות האתר נשמרו בהצלחה",
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את הגדרות האתר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            הגדרות כלליות של האתר
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteTitle">כותרת האתר הראשית</Label>
              <Input
                id="siteTitle"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="לימודי מקרא ויהדות"
                className="text-right"
                dir="rtl"
              />
              <p className="text-sm text-muted-foreground mt-1">
                מוצגת בכרטיסיית הדפדפן ובתוצאות חיפוש
              </p>
            </div>

            <div>
              <Label htmlFor="heroTitle">כותרת ראשית בדף הבית</Label>
              <Input
                id="heroTitle"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="ברוכים הבאים ללימודי תורה"
                className="text-right"
                dir="rtl"
              />
              <p className="text-sm text-muted-foreground mt-1">
                הכותרת הגדולה שמוצגת בראש דף הבית
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="heroSubtitle">תת כותרת בדף הבית</Label>
            <Textarea
              id="heroSubtitle"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="גלו את עומק החכמה הנצחית דרך שיעורי מקרא ותורה מעמיקים"
              className="text-right"
              dir="rtl"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              התיאור שמופיע מתחת לכותרת הראשית
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הודעת מנהל</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="adminMessageEnabled"
              checked={adminMessageEnabled}
              onCheckedChange={setAdminMessageEnabled}
            />
            <Label htmlFor="adminMessageEnabled">הצג הודעת מנהל בדף הבית</Label>
          </div>

          <div>
            <Label htmlFor="adminMessage">תוכן ההודעה</Label>
            <Textarea
              id="adminMessage"
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="הזן הודעה חשובה למבקרי האתר..."
              className="text-right"
              dir="rtl"
              rows={4}
              disabled={!adminMessageEnabled}
            />
            <p className="text-sm text-muted-foreground mt-1">
              הודעה שתוצג בצורה בולטת בדף הבית (אופציונלי)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "שומר..." : "שמור הגדרות"}
        </Button>
      </div>
    </div>
  );
}