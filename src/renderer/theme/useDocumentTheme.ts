import { useEffect, useState } from "react";

type DocumentTheme = "light" | "dark" | "system";

function readDocumentTheme(): DocumentTheme {
  if (typeof document === "undefined") {
    return "system";
  }

  const theme = document.documentElement.dataset["theme"];
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  return "system";
}

/**
 * - Purpose: subscribe to document root theme attribute for Sonner and UI surfaces.
 * - Inputs: none — reads `data-theme` on documentElement.
 * - Outputs: current `light`, `dark`, or `system` theme value.
 */
export function useDocumentTheme(): DocumentTheme {
  const [theme, setTheme] = useState<DocumentTheme>(readDocumentTheme);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(readDocumentTheme());
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  return theme;
}
