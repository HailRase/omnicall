/**
 * - Purpose: secret-free availability view model for saved account profiles (ADR-AF-001).
 * - Inputs: profile metadata + boolean secret presence flags.
 * - Outputs: query projection never containing secret strings.
 */

import {
  hasCompleteOcpConfiguration,
  isDraftSavedAccountProfile,
  type SavedAccountProfile,
} from "@domain/index.js";

export type SavedAccountProfileAvailabilityView = Readonly<{
  profile: SavedAccountProfile;
  hasSavedSipPassword: boolean;
  hasSavedOcpApiKey: boolean;
  hasCompleteOcpConfiguration: boolean;
  isDraft: boolean;
}>;

/**
 * - Purpose: compose renderer-safe availability flags for one saved profile.
 */
export function deriveSavedAccountProfileAvailability(input: Readonly<{
  profile: SavedAccountProfile;
  hasSavedSipPassword: boolean;
  hasSavedOcpApiKey: boolean;
}>): SavedAccountProfileAvailabilityView {
  return {
    profile: input.profile,
    hasSavedSipPassword: input.hasSavedSipPassword,
    hasSavedOcpApiKey: input.hasSavedOcpApiKey,
    hasCompleteOcpConfiguration: hasCompleteOcpConfiguration({
      ocpDomain: input.profile.ocpDomain,
      hasSavedOcpApiKey: input.hasSavedOcpApiKey,
    }),
    isDraft: isDraftSavedAccountProfile(input.profile),
  };
}
