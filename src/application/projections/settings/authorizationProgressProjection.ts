/**
 * - Purpose: unified user-facing authorization progress across SIP and OCP sign-in.
 * - Inputs: orchestration stage transitions (Application services / Facade).
 * - Outputs: serializable stage + retry flag for Account / Integrations UI.
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

export type AuthorizationProgressProjection = Readonly<{
  stage: AuthorizationProgressStage;
  /** True when UI should offer a single Retry for the failed stage. */
  retryAvailable: boolean;
  /** Correlation id of the in-flight or last completed attempt (observability). */
  correlationId: string | null;
  executionStage: OcpSignInExecutionStage | null;
  completedExecutionStages: ReadonlyArray<OcpSignInExecutionStage>;
  failedExecutionStage: OcpSignInExecutionStage | null;
  failureReason: "timeout" | "failed" | null;
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
        }
      : {}),
  };
}

export function applyAuthorizationExecutionStage(
  projection: AuthorizationProgressProjection,
  executionStage: OcpSignInExecutionStage,
  correlationId: string,
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
    retryAvailable: false,
    correlationId,
  };
}

export function applyAuthorizationExecutionFailure(
  projection: AuthorizationProgressProjection,
  reason: "timeout" | "failed",
): AuthorizationProgressProjection {
  return {
    ...projection,
    failedExecutionStage: projection.executionStage,
    failureReason: reason,
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
