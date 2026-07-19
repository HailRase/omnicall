/**
 * - Purpose: preserve last authorization attempt for a single explicit Retry action.
 * - Inputs: attempt kind + non-secret configuration captured at sign-in time.
 * - Outputs: retry strategy derived from failure stage without exposing protocol details.
 */

import type {
  OcpSignInExecutionStage,
  SavedAccountProfileId,
  SettingsAccountKey,
  SipCredentialIdentity,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { AuthorizationProgressStage } from "./authorizationProgressProjection.js";

export type AuthorizationAttemptKind =
  | "manual_sip"
  | "saved_profile_sip"
  | "saved_profile_ocp"
  | "ocp_integrations_connect";

export type AuthorizationAttemptContext = Readonly<{
  kind: AuthorizationAttemptKind;
  correlationId: CorrelationId;
  profileId?: SavedAccountProfileId;
  accountKey?: SettingsAccountKey;
  login?: string;
  sipIdentity?: SipCredentialIdentity;
  saveProfile?: boolean;
  rememberPassword?: boolean;
  usedRememberedPassword?: boolean;
}>;

/**
 * Internal retry routing — not shown in UI copy.
 * OCP dual-FSM actions (ADR-AF-002): retry_server / retry_authorization / reconnect
 * map onto Facade recovery; legacy names kept for SIP-only paths.
 */
export type AuthorizationRetryStrategy =
  | "repeat_ocp_sign_in"
  | "retry_ocp_server"
  | "retry_ocp_authorization"
  | "reconnect_ocp"
  | "repeat_sip_authorize"
  | "repeat_sip_register_only";

const RETRYABLE_STAGES: ReadonlySet<AuthorizationProgressStage> = new Set([
  "ocp_unavailable",
  "ocp_session_exist",
  "sip_registration_failed",
  "ocp_connected_sip_failed",
  "retry_available",
]);

export function isAuthorizationRetryableStage(
  stage: AuthorizationProgressStage,
  retryAvailable: boolean,
): boolean {
  return retryAvailable && RETRYABLE_STAGES.has(stage);
}

export function resolveAuthorizationRetryStrategy(
  stage: AuthorizationProgressStage,
  context: AuthorizationAttemptContext | null,
  options: Readonly<{
    isOcpSessionLive: boolean;
    /** Dual-FSM preferred recovery from session projection (WU-02). */
    primaryOcpRecoveryAction?:
      | "retry_server"
      | "retry_authorization"
      | "reconnect"
      | null;
  }>,
): AuthorizationRetryStrategy | null {
  if (context === null || !RETRYABLE_STAGES.has(stage)) {
    return null;
  }

  const isOcpAttempt =
    context.kind === "saved_profile_ocp" || context.kind === "ocp_integrations_connect";

  if (isOcpAttempt && options.primaryOcpRecoveryAction !== undefined) {
    switch (options.primaryOcpRecoveryAction) {
      case "retry_server":
        return "retry_ocp_server";
      case "retry_authorization":
        return "retry_ocp_authorization";
      case "reconnect":
        return "reconnect_ocp";
      default:
        break;
    }
  }

  switch (stage) {
    case "ocp_unavailable":
      return isOcpAttempt ? "retry_ocp_server" : null;
    case "ocp_session_exist":
      // SESSION_EXIST must never resend into a stale socket.
      return isOcpAttempt ? "retry_ocp_server" : null;
    case "sip_registration_failed":
      if (isOcpAttempt) {
        return options.isOcpSessionLive
          ? "repeat_sip_register_only"
          : "retry_ocp_server";
      }
      return "repeat_sip_authorize";
    case "ocp_connected_sip_failed":
      if (isOcpAttempt) {
        return options.isOcpSessionLive
          ? "repeat_sip_register_only"
          : "retry_ocp_server";
      }
      return "repeat_sip_authorize";
    case "retry_available":
      return isOcpAttempt ? "retry_ocp_server" : "repeat_sip_authorize";
    default:
      return null;
  }
}

/**
 * First visible modal execution stage for a recovery strategy (immediate progress).
 * Full OCP restarts begin at HTTP token; same-socket auth and SIP-only paths skip earlier bars.
 */
export function resolveOcpRecoveryFirstVisibleStage(
  strategy: AuthorizationRetryStrategy,
): OcpSignInExecutionStage {
  switch (strategy) {
    case "retry_ocp_authorization":
      return "awaiting_authorization_data";
    case "repeat_sip_register_only":
      return "authorizing_sip";
    case "repeat_sip_authorize":
      return "connecting_sip_transport";
    case "repeat_ocp_sign_in":
    case "retry_ocp_server":
    case "reconnect_ocp":
      return "requesting_authorization_token";
    default: {
      const _exhaustive: never = strategy;
      return _exhaustive;
    }
  }
}

/** True when recovery should clear prior completed stage bars (full OCP restart). */
export function shouldResetOcpRecoveryCompletedStages(
  strategy: AuthorizationRetryStrategy,
): boolean {
  return (
    strategy === "repeat_ocp_sign_in" ||
    strategy === "retry_ocp_server" ||
    strategy === "reconnect_ocp"
  );
}
