/**
 * - Purpose: draft vs successful saved-profile lifecycle (ADR-AF-001).
 * - Inputs: SavedAccountProfile records and non-secret OCP availability flags.
 * - Outputs: lifecycle helpers; never infers success from secret presence.
 */

import type { SavedAccountProfile } from "./SavedAccountProfile.js";

export type SavedAccountProfileLifecycleStatus = "draft" | "successful";

/**
 * - Purpose: treat missing legacy marker as successful (backward compatible).
 * - Inputs: optional persisted lifecycle status.
 * - Outputs: normalized draft | successful.
 */
export function resolveSavedAccountProfileLifecycleStatus(
  status: SavedAccountProfileLifecycleStatus | undefined,
): SavedAccountProfileLifecycleStatus {
  return status ?? "successful";
}

/**
 * - Purpose: detect draft profiles that must not auto-login or act as active session.
 */
export function isDraftSavedAccountProfile(profile: SavedAccountProfile): boolean {
  return resolveSavedAccountProfileLifecycleStatus(profile.lifecycleStatus) === "draft";
}

/**
 * - Purpose: detect successfully authorized profiles.
 */
export function isSuccessfulSavedAccountProfile(profile: SavedAccountProfile): boolean {
  return resolveSavedAccountProfileLifecycleStatus(profile.lifecycleStatus) === "successful";
}

/**
 * - Purpose: preserve the strongest lifecycle state while draft artifacts are edited.
 * - Inputs: current persisted state and requested incoming state.
 * - Outputs: monotonic lifecycle where successful can never be demoted to draft.
 */
export function mergeSavedAccountProfileLifecycleStatus(
  current: SavedAccountProfileLifecycleStatus | undefined,
  requested: SavedAccountProfileLifecycleStatus | undefined,
): SavedAccountProfileLifecycleStatus {
  const normalizedCurrent = resolveSavedAccountProfileLifecycleStatus(current);
  const normalizedRequested = requested ?? normalizedCurrent;
  return normalizedCurrent === "successful" ? "successful" : normalizedRequested;
}

/**
 * - Purpose: promote a draft (or legacy) profile to successful after SIP-ready.
 * - Inputs: profile + ISO timestamp.
 * - Outputs: new profile record with successful marker.
 */
export function markSavedAccountProfileSuccessful(
  profile: SavedAccountProfile,
  successfulUseAt: string,
): SavedAccountProfile {
  return {
    ...profile,
    lifecycleStatus: "successful",
    successfulUseAt,
    lastUsedAt: successfulUseAt,
  };
}

/**
 * - Purpose: OCP configuration completeness from non-secret metadata + key presence boolean.
 * - Inputs: optional ocpDomain and hasSavedOcpApiKey flag (never the key string).
 * - Outputs: true when domain and API key are both available.
 */
export function hasCompleteOcpConfiguration(input: Readonly<{
  ocpDomain: string | undefined;
  hasSavedOcpApiKey: boolean;
}>): boolean {
  const domain = input.ocpDomain?.trim() ?? "";
  return domain.length > 0 && input.hasSavedOcpApiKey;
}
