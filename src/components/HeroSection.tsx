import heroImage from "@/assets/hero-study.jpg";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
}

export function HeroSection({ 
  title = "ברוכים הבאים ללימודי תורה", 
  subtitle = "מקום למחשבה עמוקה, לימוד משמעותי וחיבור אמיתי למקורות החכמה היהודית" 
}: HeroSectionProps) {
  return (
    <section className="relative h-96 md:h-[500px] overflow-hidden">
      <img 
        src={heroImage} 
        alt="לימוד תורה ויהדות - חכמת הדורות"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      
      <div className="absolute inset-0 flex items-center justify-end text-right">
        <div className="max-w-2xl px-8 md:px-16">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-foreground leading-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 font-body">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <a 
              href="/auth" 
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
            >
              התחבר ללימוד
            </a>
            <a 
              href="#lessons" 
              className="border border-border bg-background/80 text-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors text-center"
            >
              צפה בשיעורים
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}