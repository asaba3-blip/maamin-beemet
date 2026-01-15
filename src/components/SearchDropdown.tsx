import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Lesson {
  id: string;
  title: string;
  summary: string;
  content?: string;
}

interface SearchDropdownProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lessons: Lesson[];
}

export function SearchDropdown({ 
  searchQuery, 
  onSearchChange, 
  lessons 
}: SearchDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter lessons based on search query
  const filteredResults = searchQuery.trim() === "" 
    ? [] 
    : lessons.filter(lesson => {
        const query = searchQuery.toLowerCase();
        const title = (lesson.title || "").toLowerCase();
        const summary = (lesson.summary || "").toLowerCase();
        const content = (lesson.content || "").toLowerCase();
        
        return title.includes(query) || 
               summary.includes(query) || 
               content.includes(query);
      }).slice(0, 8); // Limit to 8 results

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
          handleSelectLesson(filteredResults[selectedIndex].id);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearchChange("");
    navigate(`/lesson/${lessonId}`);
  };

  const handleInputChange = (value: string) => {
    onSearchChange(value);
    setIsOpen(value.trim() !== "");
    setSelectedIndex(-1);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    
    return (
      <>
        {before}
        <span className="bg-primary/20 text-primary font-medium">{match}</span>
        {after}
      </>
    );
  };

  // Get excerpt around the match
  const getExcerpt = (text: string, query: string, maxLength: number = 100) => {
    if (!text) return "";
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 70);
    
    let excerpt = text.slice(start, end);
    if (start > 0) excerpt = "..." + excerpt;
    if (end < text.length) excerpt = excerpt + "...";
    
    return excerpt;
  };

  return (
    <div className="flex-1 max-w-md relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="חיפוש שיעורים..."
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => searchQuery.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pr-10 text-right"
          dir="rtl"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {filteredResults.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson.id)}
              className={`w-full p-3 text-right flex items-start gap-3 hover:bg-accent transition-colors border-b border-border last:border-b-0 ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
              dir="rtl"
            >
              <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground line-clamp-1">
                  {highlightMatch(lesson.title, searchQuery)}
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {highlightMatch(getExcerpt(lesson.summary || lesson.content || "", searchQuery), searchQuery)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery.trim() !== "" && filteredResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground" dir="rtl">
          לא נמצאו שיעורים עבור "{searchQuery}"
        </div>
      )}
    </div>
  );
}
