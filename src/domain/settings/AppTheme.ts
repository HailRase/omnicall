export const APP_THEMES = ["light", "dark"] as const;

export type AppTheme = (typeof APP_THEMES)[number];

export const DEFAULT_APP_THEME: AppTheme = "light";

/**
 * - Purpose: narrow unknown values to a supported application color theme.
 * - Inputs: unknown theme value from persistence boundary.
 * - Outputs: AppTheme when valid, otherwise null.
 */
export function parseAppTheme(value: unknown): AppTheme | null {
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}
