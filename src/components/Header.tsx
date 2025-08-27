import { Search, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">לימודי מקרא ויהדות</h1>
              <p className="text-sm text-muted-foreground">מקור לחכמה ותורה</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="חיפוש שיעורים..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-10 text-right"
                dir="rtl"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <span>דף הבית</span>
            </Button>
            <Button variant="ghost" size="sm">
              <span>אודות</span>
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 ml-2" />
              <span>התחבר</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}