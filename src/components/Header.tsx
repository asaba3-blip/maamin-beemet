import { BookOpen, User, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { SearchDropdown } from "@/components/SearchDropdown";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Lesson {
  id: string;
  title: string;
  summary: string;
  content?: string;
}

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lessons?: Lesson[];
  user?: UserType | null;
  isAdmin?: boolean;
  onAdminToggle?: () => void;
  onSignOut?: () => Promise<void>;
  headerTitle?: string;
  headerSubtitle?: string;
}

export function Header({ 
  searchQuery, 
  onSearchChange, 
  lessons = [],
  user, 
  isAdmin, 
  onAdminToggle, 
  onSignOut,
  headerTitle = "לימודי מקרא ויהדות",
  headerSubtitle = "מקור לחכמה ותורה"
}: HeaderProps) {
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
              <h1 className="text-xl font-bold text-primary">{headerTitle}</h1>
              <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>

          {/* Search Bar */}
          <SearchDropdown
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            lessons={lessons}
          />

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <span>דף הבית</span>
            </Button>
            <Button variant="ghost" size="sm">
              <span>אודות</span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 ml-2" />
                    <span>{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 ml-2" />
                    <span>{user.email}</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onAdminToggle}>
                        <Settings className="h-4 w-4 ml-2" />
                        <span>פאנל ניהול</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="h-4 w-4 ml-2" />
                    <span>התנתק</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 ml-2" />
                  <span>התחבר</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}