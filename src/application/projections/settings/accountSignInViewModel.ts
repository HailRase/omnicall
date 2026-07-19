/**
 * - Purpose: renderer-safe Account sign-in view model (ADR-AF-003 / WU-03).
 * - Inputs: SIP registration flag, profile availability rows, OCP dual-FSM snapshot.
 * - Outputs: typed options, secret booleans only, login disabled reason, recovery keys.
 */

import type { OcpAuthorizationState } from "@domain/integration/ocp/OcpAuthorizationState.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import type { OcpRecoveryAction } from "@domain/integration/ocp/ocpDualFsm.js";
import {
  resolveAllowedOcpRecoveryAction,
  selectPrimaryOcpRecoveryAction,
  type OcpDualFsmSnapshot,
} from "@domain/integration/ocp/ocpDualFsm.js";
import type { SavedAccountProfileId } from "@domain/index.js";
import {
  deriveSavedAccountProfileSelectorOptions,
  type SavedAccountProfileSelectorOption,
} from "./deriveSavedAccountProfileSelectorOptions.js";
import type { SavedAccountProfileAvailabilityView } from "./deriveSavedAccountProfileAvailability.js";
import {
  initialAuthorizationProgressProjection,
  type AuthorizationProgressProjection,
} from "./authorizationProgressProjection.js";

export type AccountSignInLoginDisabledReasonKey =
  "account.signIn.disabled.logoutFirst";

export type AccountSignInSelectedProfileView = Readonly<{
  profileId: SavedAccountProfileId;
  username: string;
  domain: string;
  server: string;
  ocpDomain: string | undefined;
  hasSavedSipPassword: boolean;
  hasSavedOcpApiKey: boolean;
  hasCompleteOcpConfiguration: boolean;
  isDraft: boolean;
}>;

export type AccountSignInViewModel = Readonly<{
  isSipRegistered: boolean;
  /** Local account session active — Login lock (ADR-AF-005). */
  hasActiveAccountSession: boolean;
  loginDisabledReason: AccountSignInLoginDisabledReasonKey | null;
  sipProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
  /** Profiles with complete OCP configuration only (OCP mode picker). */
  ocpProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
  selectedProfile: AccountSignInSelectedProfileView | null;
  serverState: OcpServerState;
  authorizationState: OcpAuthorizationState;
  authorizationProgress: AuthorizationProgressProjection;
  primaryRecoveryAction: OcpRecoveryAction | null;
  allowedRecoveryActions: ReadonlyArray<OcpRecoveryAction>;
}>;

const ALL_RECOVERY_ACTIONS: ReadonlyArray<OcpRecoveryAction> = [
  "retry_server",
  "retry_authorization",
  "reconnect",
];

/**
 * - Purpose: map availability rows to a secret-free selected-profile slice.
 */
export function toAccountSignInSelectedProfileView(
  availability: SavedAccountProfileAvailabilityView | null,
): AccountSignInSelectedProfileView | null {
  if (availability === null) {
    return null;
  }
  return {
    profileId: availability.profile.id,
    username: availability.profile.username,
    domain: availability.profile.domain,
    server: availability.profile.server,
    ocpDomain: availability.profile.ocpDomain,
    hasSavedSipPassword: availability.hasSavedSipPassword,
    hasSavedOcpApiKey: availability.hasSavedOcpApiKey,
    hasCompleteOcpConfiguration: availability.hasCompleteOcpConfiguration,
    isDraft: availability.isDraft,
  };
}

/**
 * - Purpose: filter OCP-ready profiles for the OCP mode profile picker.
 */
export function deriveAccountOcpProfileOptions(
  availabilities: ReadonlyArray<SavedAccountProfileAvailabilityView>,
): ReadonlyArray<SavedAccountProfileSelectorOption> {
  const complete = availabilities
    .filter((row) => row.hasCompleteOcpConfiguration)
    .map((row) => row.profile);
  return deriveSavedAccountProfileSelectorOptions(complete);
}

/**
 * - Purpose: list recovery action keys allowed by the dual FSM (no localization).
 * - Inputs: dual-FSM snapshot + whether the selected profile owns the live account session.
 * - `reconnect` is live-session recovery — only when the selected profile matches the
 *   active account (never on other saved profiles).
 */
export function deriveAllowedAccountRecoveryActions(
  snapshot: OcpDualFsmSnapshot,
  options: Readonly<{
    selectedProfileOwnsActiveSession?: boolean;
  }> = {},
): ReadonlyArray<OcpRecoveryAction> {
  const selectedOwnsSession = options.selectedProfileOwnsActiveSession === true;
  return ALL_RECOVERY_ACTIONS.filter((action) => {
    if (resolveAllowedOcpRecoveryAction(snapshot, action) === null) {
      return false;
    }
    if (action === "reconnect" && !selectedOwnsSession) {
      return false;
    }
    return true;
  });
}

/**
 * - Purpose: compose Account sign-in read model for shell/hooks (WU-03).
 */
export function deriveAccountSignInViewModel(input: Readonly<{
  isSipRegistered: boolean;
  hasActiveAccountSession: boolean;
  availabilities: ReadonlyArray<SavedAccountProfileAvailabilityView>;
  selectedProfileId: SavedAccountProfileId | null;
  /** Active account key for the current local session (null when logged out). */
  activeSessionProfileId?: SavedAccountProfileId | null;
  dualFsm: OcpDualFsmSnapshot;
  authorizationProgress?: AuthorizationProgressProjection;
}>): AccountSignInViewModel {
  const profiles = input.availabilities.map((row) => row.profile);
  const selectedAvailability =
    input.selectedProfileId === null
      ? null
      : (input.availabilities.find(
          (row) => row.profile.id === input.selectedProfileId,
        ) ?? null);
  const activeSessionProfileId = input.activeSessionProfileId ?? null;
  const selectedProfileOwnsActiveSession =
    input.hasActiveAccountSession &&
    input.selectedProfileId !== null &&
    activeSessionProfileId !== null &&
    input.selectedProfileId === activeSessionProfileId;

  return {
    isSipRegistered: input.isSipRegistered,
    hasActiveAccountSession: input.hasActiveAccountSession,
    loginDisabledReason: input.hasActiveAccountSession
      ? "account.signIn.disabled.logoutFirst"
      : null,
    sipProfileOptions: deriveSavedAccountProfileSelectorOptions(profiles),
    ocpProfileOptions: deriveAccountOcpProfileOptions(input.availabilities),
    selectedProfile: toAccountSignInSelectedProfileView(selectedAvailability),
    serverState: input.dualFsm.serverState,
    authorizationState: input.dualFsm.authorizationState,
    authorizationProgress:
      input.authorizationProgress ?? initialAuthorizationProgressProjection(),
    primaryRecoveryAction: selectPrimaryOcpRecoveryAction(input.dualFsm),
    allowedRecoveryActions: deriveAllowedAccountRecoveryActions(input.dualFsm, {
      selectedProfileOwnsActiveSession,
    }),
  };
}
