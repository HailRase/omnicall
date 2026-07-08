import {
  formatSavedAccountProfileSelectorLabel,
  type SavedAccountProfile,
  type SavedAccountProfileId,
} from "@domain/index.js";

export type SavedAccountProfileSelectorOption = Readonly<{
  id: SavedAccountProfileId;
  label: string;
}>;

/**
 * - Purpose: map saved profiles to selector options with disambiguated labels.
 * - Inputs: saved account profiles from facade list.
 * - Outputs: ordered selector options without secrets.
 */
export function deriveSavedAccountProfileSelectorOptions(
  profiles: ReadonlyArray<SavedAccountProfile>,
): ReadonlyArray<SavedAccountProfileSelectorOption> {
  return profiles.map((savedProfile) => ({
    id: savedProfile.id,
    label: formatSavedAccountProfileSelectorLabel(savedProfile, profiles),
  }));
}
