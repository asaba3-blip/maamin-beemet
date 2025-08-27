import heroImage from "@/assets/hero-torah.jpg";

export function HeroSection() {
  return (
    <section className="relative h-80 overflow-hidden">
      <img 
        src={heroImage} 
        alt="תורה ולימוד יהדות"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-primary/80 via-primary/60 to-primary/40" />
      
      <div className="absolute inset-0 flex items-center justify-center text-center">
        <div className="text-primary-foreground max-w-2xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            ברוכים הבאים ללימודי מקרא ויהדות
          </h1>
          <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
            מקום למחשבה עמוקה, לימוד משמעותי וחיבור אמיתי למקורות היהדות
          </p>
        </div>
      </div>
    </section>
  );
}