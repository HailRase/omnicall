import type { AppTheme } from "@application/index.js";

/**
 * - Purpose: apply persisted color theme to the document root element.
 * - Inputs: light or dark AppTheme value.
 * - Outputs: data-theme attribute on documentElement for CSS token switching.
 */
export function applyAppTheme(theme: AppTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset["theme"] = theme;
}
