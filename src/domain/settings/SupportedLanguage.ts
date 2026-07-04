export const SUPPORTED_LANGUAGES = ["ru", "en", "fr", "de"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_SUPPORTED_LANGUAGE: SupportedLanguage = "ru";

/**
 * - Purpose: validate UI language values at settings boundary.
 * - Inputs: unknown external value.
 * - Outputs: supported language or null.
 */
export function parseSupportedLanguage(value: unknown): SupportedLanguage | null {
  if (typeof value !== "string") {
    return null;
  }
  return (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value)
    ? (value as SupportedLanguage)
    : null;
}
