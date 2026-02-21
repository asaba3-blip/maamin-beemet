import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://maamin-beemet.lovable.app";

export function useCanonical(path?: string) {
  const location = useLocation();
  
  useEffect(() => {
    const canonicalPath = path ?? location.pathname;
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);
    
    return () => {
      // Reset on unmount so next page sets its own
    };
  }, [path, location.pathname]);
}
