import { useEffect } from "react";
import type { AppTheme } from "@application/index.js";
import { applyAppTheme } from "../theme/applyAppTheme.js";

/**
 * - Purpose: sync persisted theme preference to document CSS tokens.
 * - Inputs: current AppTheme from user settings projection.
 * - Outputs: side effect on documentElement data-theme attribute.
 */
export function useAppTheme(theme: AppTheme): void {
  useEffect(() => {
    applyAppTheme(theme);
  }, [theme]);
}
