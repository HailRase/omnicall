import { useEffect, useState } from "react";

const DEFAULT_MOBILE_BREAKPOINT = 768;

function readMatchMedia(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
}

/**
 * - Purpose: detect viewport width below a mobile breakpoint for sidebar sheet mode.
 * - Inputs: optional breakpoint in px and optional forced mobile flag for tests/stories.
 * - Outputs: boolean isMobile synchronized with matchMedia changes.
 */
export function useIsMobile(
  breakpointPx: number = DEFAULT_MOBILE_BREAKPOINT,
  forceMobile?: boolean,
): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (forceMobile !== undefined) {
      return forceMobile;
    }
    if (typeof window === "undefined") {
      return false;
    }
    return readMatchMedia(`(max-width: ${breakpointPx - 1}px)`);
  });

  useEffect(() => {
    if (forceMobile !== undefined) {
      setIsMobile(forceMobile);
      return;
    }

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);

    function handleChange(): void {
      setIsMobile(mediaQuery.matches);
    }

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [breakpointPx, forceMobile]);

  return isMobile;
}
