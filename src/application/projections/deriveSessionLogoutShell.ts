import type { AuthUiState } from "./accountBootstrapProjection.js";
import type { IncomingCallProjection } from "./incomingCallProjection.js";
import type { MultiCallProjection } from "./multiCallProjection.js";
import type { MultiLineCallProjection } from "./multiLineCallProjection.js";
import type { TransferProjection } from "./transferProjection.js";

export type SessionLogoutShellInput = Readonly<{
  isOcpMode: boolean;
  authUiState: AuthUiState;
  multiCallProjection: MultiCallProjection;
  incomingCallProjection: IncomingCallProjection;
  transferProjection: TransferProjection;
  multiLineCallProjection: MultiLineCallProjection;
  logoutInProgress: boolean;
  logoutError: string | null;
}>;

export type SessionLogoutProjectionInput = Omit<
  SessionLogoutShellInput,
  "logoutInProgress" | "logoutError"
>;

/**
 * - Purpose: pick projection fields required for session logout shell derivation.
 * - Inputs: bootstrap and telephony read models from store.
 * - Outputs: projection input without ephemeral logout UI state.
 */
export function pickSessionLogoutProjectionInput(
  input: SessionLogoutProjectionInput,
): SessionLogoutProjectionInput {
  return input;
}

export type SessionLogoutShellView = Readonly<{
  showEndSessionControl: boolean;
  endSessionDisabledReason: string | null;
  logoutConfirmationRequired: boolean;
  logoutInProgress: boolean;
  showLogoutErrorBanner: boolean;
  logoutErrorMessage: string | null;
}>;

/**
 * - Purpose: derive SIP-only session logout shell flags from read models (LF-079).
 * - Inputs: bootstrap and telephony projections plus local logout UI state.
 * - Outputs: end-session control visibility, confirmation requirement, disabled reasons.
 */
export function deriveSessionLogoutShell(
  input: SessionLogoutShellInput,
): SessionLogoutShellView {
  const logoutConfirmationRequired = deriveLogoutConfirmationRequired(input);
  const showEndSessionControl =
    !input.isOcpMode && input.authUiState === "sip_registered";

  const endSessionDisabledReason = deriveEndSessionDisabledReason(input);

  return {
    showEndSessionControl,
    endSessionDisabledReason,
    logoutConfirmationRequired,
    logoutInProgress: input.logoutInProgress,
    showLogoutErrorBanner: input.logoutError !== null,
    logoutErrorMessage: input.logoutError,
  };
}

function deriveLogoutConfirmationRequired(input: SessionLogoutShellInput): boolean {
  const {
    multiCallProjection,
    incomingCallProjection,
    transferProjection,
    multiLineCallProjection,
  } = input;

  if (multiCallProjection.hasEstablishedCall || multiCallProjection.hasConnectingCall) {
    return true;
  }

  if (
    incomingCallProjection.ringingIndicator === "ringing" ||
    incomingCallProjection.uiState === "incomingRinging" ||
    incomingCallProjection.uiState === "answering" ||
    incomingCallProjection.uiState === "rejecting"
  ) {
    return true;
  }

  if (transferProjection.transferModeActive || isTransferInProgress(transferProjection.phase)) {
    return true;
  }

  if (multiLineCallProjection.attendedPhase !== "idle") {
    return true;
  }

  return false;
}

function deriveEndSessionDisabledReason(input: SessionLogoutShellInput): string | null {
  if (input.logoutInProgress) {
    return "Logout in progress";
  }

  if (input.authUiState === "sip_registering") {
    return "Registration in progress";
  }

  return null;
}

function isTransferInProgress(phase: TransferProjection["phase"]): boolean {
  return (
    phase === "transfer_requested" ||
    phase === "transferring" ||
    phase === "consultation_dialing" ||
    phase === "consultation_active" ||
    phase === "attended_transfer_in_progress"
  );
}
