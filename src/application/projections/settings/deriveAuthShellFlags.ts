import type { AccountBootstrapProjection } from "./accountBootstrapProjection.js";
import type { AuthUiState } from "./accountBootstrapProjection.js";

export type AuthShellFlags = Readonly<{
  showAccountPanel: boolean;
  blockingAuthState: boolean;
  isSipRegistered: boolean;
  /** Local account session active — Settings gate + Login lock (ADR-AF-005). */
  hasActiveAccountSession: boolean;
}>;

const BLOCKING_AUTH_STATES: ReadonlyArray<AuthUiState> = [
  "booting",
  "sip_registering",
];

const ACCOUNT_PANEL_STATES: ReadonlyArray<AuthUiState> = [
  "sip_only_ready",
  "sip_registration_failed",
  "sip_registered",
  "access_denied",
];

/**
 * - Purpose: derive auth-related shell visibility flags from bootstrap projection.
 * - Inputs: account bootstrap projection.
 * - Outputs: panel visibility, SIP-ready, and account-session gate flags.
 */
export function deriveAuthShellFlags(
  projection: AccountBootstrapProjection,
): AuthShellFlags {
  const blockingAuthState = BLOCKING_AUTH_STATES.includes(projection.authUiState);

  return {
    showAccountPanel: ACCOUNT_PANEL_STATES.includes(projection.authUiState),
    blockingAuthState,
    isSipRegistered: !blockingAuthState && projection.authUiState === "sip_registered",
    hasActiveAccountSession: projection.hasActiveAccountSession,
  };
}
