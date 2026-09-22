import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <Helmet>
        <title>הדף לא נמצא | לימודי מקרא ויהדות</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold mb-3">הדף שחיפשת לא נמצא</h1>
        <p className="text-muted-foreground mb-6">
          ייתכן שהכתובת שונתה או שהשיעור הוסר. אפשר לחזור לדף הבית ולמצוא את כל השיעורים.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">לדף הבית</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/#lessons">לכל השיעורים</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
