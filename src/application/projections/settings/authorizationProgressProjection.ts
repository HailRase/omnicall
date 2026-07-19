/**
 * - Purpose: unified user-facing authorization progress across SIP and OCP sign-in.
 * - Inputs: orchestration stage transitions (Application services / Facade).
 * - Outputs: serializable stage + retry flag + timed execution progress for Account UI.
 */
import {
  OCP_SIGN_IN_EXECUTION_STAGES,
  type OcpSignInExecutionStage,
} from "@domain/index.js";

export {
  OCP_SIGN_IN_EXECUTION_STAGES,
  type OcpSignInExecutionStage,
} from "@domain/index.js";

/** User-facing authorization stages (semantic keys; copy via i18n). */
export type AuthorizationProgressStage =
  | "idle"
  | "preparing"
  | "connecting_ocp"
  | "receiving_credentials"
  | "registering_phone"
  | "ready"
  | "ocp_connected_sip_failed"
  | "ocp_unavailable"
  | "sip_registration_failed"
  | "ocp_session_exist"
  | "retry_available";

/** Normalized failure kind for tooltips / recovery copy (not localized). */
export type AuthorizationProgressFailureKind =
  | "timeout"
  | "session_exist"
  | "http_failed"
  | "invalid_api_key"
  | "transport"
  | "sip_identity_mismatch"
  | "sip_authorize_failed"
  | "sip_register_failed"
  | "credentials_timeout"
  | "cancelled"
  | "operation_failed";

export type AuthorizationProgressProjection = Readonly<{
  stage: AuthorizationProgressStage;
  /** True when UI should offer a Retry for the failed stage. */
  retryAvailable: boolean;
  /** Correlation id of the in-flight or last completed attempt (observability). */
  correlationId: string | null;
  executionStage: OcpSignInExecutionStage | null;
  completedExecutionStages: ReadonlyArray<OcpSignInExecutionStage>;
  failedExecutionStage: OcpSignInExecutionStage | null;
  /**
   * Coarse failure class retained for existing tests/consumers.
   * Prefer `failureKind` for new UI.
   */
  failureReason: "timeout" | "failed" | null;
  failureKind: AuthorizationProgressFailureKind | null;
  /** Technical reason / PlatformError.message for diagnostics mapping. */
  failureCode: string | null;
  /** Wall-clock start of the active execution stage (for timed progress bars). */
  stageStartedAtMs: number | null;
}>;

export type ApplyAuthorizationExecutionFailureInput = Readonly<{
  reason: "timeout" | "failed";
  failureKind?: AuthorizationProgressFailureKind;
  failureCode?: string | null;
  failedStage?: OcpSignInExecutionStage | null;
}>;

export function initialAuthorizationProgressProjection(): AuthorizationProgressProjection {
  return {
    stage: "idle",
    retryAvailable: false,
    correlationId: null,
    executionStage: null,
    completedExecutionStages: [],
    failedExecutionStage: null,
    failureReason: null,
    failureKind: null,
    failureCode: null,
    stageStartedAtMs: null,
  };
}

export function applyAuthorizationProgressStage(
  projection: AuthorizationProgressProjection,
  stage: AuthorizationProgressStage,
  correlationId?: string | null,
): AuthorizationProgressProjection {
  const retryAvailable =
    stage === "retry_available" ||
    stage === "ocp_connected_sip_failed" ||
    stage === "ocp_unavailable" ||
    stage === "sip_registration_failed" ||
    stage === "ocp_session_exist";

  return {
    ...projection,
    stage,
    retryAvailable,
    correlationId:
      correlationId === undefined ? projection.correlationId : correlationId,
    ...(stage === "ready"
      ? {
          executionStage: null,
          completedExecutionStages: [...OCP_SIGN_IN_EXECUTION_STAGES],
          failedExecutionStage: null,
          failureReason: null,
          failureKind: null,
          failureCode: null,
          stageStartedAtMs: null,
        }
      : {}),
  };
}

export function applyAuthorizationExecutionStage(
  projection: AuthorizationProgressProjection,
  executionStage: OcpSignInExecutionStage,
  correlationId: string,
  stageStartedAtMs: number = Date.now(),
): AuthorizationProgressProjection {
  const completed =
    projection.executionStage !== null &&
    projection.executionStage !== executionStage &&
    !projection.completedExecutionStages.includes(projection.executionStage)
      ? [...projection.completedExecutionStages, projection.executionStage]
      : projection.completedExecutionStages;
  return {
    ...projection,
    stage: mapExecutionStageToLegacyStage(executionStage),
    executionStage,
    completedExecutionStages: completed,
    failedExecutionStage: null,
    failureReason: null,
    failureKind: null,
    failureCode: null,
    retryAvailable: false,
    correlationId,
    stageStartedAtMs,
  };
}

export function applyAuthorizationExecutionFailure(
  projection: AuthorizationProgressProjection,
  input: ApplyAuthorizationExecutionFailureInput | "timeout" | "failed",
): AuthorizationProgressProjection {
  const normalized: ApplyAuthorizationExecutionFailureInput =
    typeof input === "string" ? { reason: input } : input;
  const failureKind =
    normalized.failureKind ??
    (normalized.reason === "timeout" ? "timeout" : "operation_failed");
  return {
    ...projection,
    failedExecutionStage:
      normalized.failedStage !== undefined
        ? normalized.failedStage
        : projection.executionStage,
    failureReason: normalized.reason,
    failureKind,
    failureCode:
      normalized.failureCode === undefined
        ? projection.failureCode
        : normalized.failureCode,
    retryAvailable: true,
  };
}

export function clearAuthorizationProgress(): AuthorizationProgressProjection {
  return initialAuthorizationProgressProjection();
}

function mapExecutionStageToLegacyStage(
  stage: OcpSignInExecutionStage,
): AuthorizationProgressStage {
  switch (stage) {
    case "requesting_authorization_token":
    case "submitting_token_to_ocp":
      return "connecting_ocp";
    case "awaiting_authorization_data":
      return "receiving_credentials";
    case "connecting_sip_transport":
    case "authorizing_sip":
      return "registering_phone";
  }
}

/** Map PlatformError reason / message keys to a user-facing failure stage. */
export function mapAuthorizationFailureStage(
  reason: string,
): AuthorizationProgressStage {
  switch (reason) {
    case "ocp_session_exist":
      return "ocp_session_exist";
    case "ocp_auth_timeout":
    case "ocp_authenticate_session_closed":
    case "ocp_credentials_timeout":
    case "login_required":
    case "api_key_required":
    case "domain_required":
    case "ocp_unavailable":
      return "ocp_unavailable";
    case "ocp_sip_identity_mismatch":
    case "ocp_sip_authorize_failed":
      return "ocp_connected_sip_failed";
    case "ocp_sip_register_failed":
      return "sip_registration_failed";
    default:
      if (reason.startsWith("ocp_")) {
        return "ocp_unavailable";
      }
      return "sip_registration_failed";
  }
}

/** Map PlatformError message to a normalized failure kind for UI tooltips. */
export function mapAuthorizationFailureKind(
  reason: string,
): AuthorizationProgressFailureKind {
  const normalized = reason.toLowerCase();
  if (normalized.includes("timeout")) {
    return normalized.includes("credentials") ? "credentials_timeout" : "timeout";
  }
  if (
    normalized.includes("proxy_api_key") ||
    normalized.includes("invalid api key") ||
    normalized.includes("invalid_api_key")
  ) {
    return "invalid_api_key";
  }
  switch (reason) {
    case "ocp_session_exist":
      return "session_exist";
    case "ocp_sip_identity_mismatch":
      return "sip_identity_mismatch";
    case "ocp_sip_authorize_failed":
      return "sip_authorize_failed";
    case "ocp_sip_register_failed":
      return "sip_register_failed";
    case "ocp_attempt_cancelled":
    case "user_cancel":
      return "cancelled";
    case "ocp_http_auth_failed":
    case "HTTP_AUTH_FAILED":
    case "ocp_proxy_authenticate_http_failed":
      return "http_failed";
    default:
      if (
        normalized.includes("http") ||
        normalized.includes("404") ||
        normalized.includes("500") ||
        normalized.includes("401") ||
        normalized.includes("403") ||
        normalized.includes("400")
      ) {
        return "http_failed";
      }
      if (normalized.includes("transport") || normalized.includes("socket")) {
        return "transport";
      }
      return "operation_failed";
  }
}
