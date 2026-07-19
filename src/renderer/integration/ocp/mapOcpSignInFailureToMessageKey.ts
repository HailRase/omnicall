/**
 * - Purpose: map OCP sign-in failure kind/code to localized tooltip text.
 * - Inputs: failureKind + optional technical failureCode from progress projection.
 * - Outputs: TranslationKey and/or composed tooltip with real server detail.
 */

import type { AuthorizationProgressFailureKind } from "@application/projections/settings/authorizationProgressProjection.js";
import type { TranslationKey } from "../../i18n/messages.js";

const TECHNICAL_KEYS = new Set<string>([
  "ocp_proxy_authenticate_http_failed",
  "ocp_proxy_authenticate_http_timeout",
  "ocp_proxy_authenticate_invalid_body",
  "ocp_http_token_timeout",
  "ocp_auth_timeout",
  "ocp_credentials_timeout",
  "ocp_session_exist",
  "ocp_sip_identity_mismatch",
  "ocp_sip_authorize_failed",
  "ocp_sip_register_failed",
  "ocp_attempt_cancelled",
  "ocp_attempt_superseded",
  "user_cancel",
]);

export function mapOcpSignInFailureToMessageKey(
  failureKind: AuthorizationProgressFailureKind | null,
  failureCode: string | null,
): TranslationKey {
  if (failureCode !== null) {
    const code = failureCode.toLowerCase();
    if (code.includes("404") || failureCode.endsWith("_404")) {
      return "account.authProgress.failure.http404";
    }
    if (code.includes("500") || failureCode.endsWith("_500")) {
      return "account.authProgress.failure.http500";
    }
    if (
      code.includes("401") ||
      code.includes("403") ||
      failureCode.endsWith("_401") ||
      failureCode.endsWith("_403")
    ) {
      return "account.authProgress.failure.httpAuth";
    }
    if (
      code.includes("proxy_api_key") ||
      code.includes("invalid api key") ||
      failureKind === "invalid_api_key"
    ) {
      return "account.authProgress.failure.invalidApiKey";
    }
  }

  switch (failureKind) {
    case "timeout":
      return "account.authProgress.failure.timeout";
    case "credentials_timeout":
      return "account.authProgress.failure.credentialsTimeout";
    case "session_exist":
      return "account.authProgress.failure.sessionExist";
    case "invalid_api_key":
      return "account.authProgress.failure.invalidApiKey";
    case "http_failed":
      return "account.authProgress.failure.httpFailed";
    case "transport":
      return "account.authProgress.failure.transport";
    case "sip_identity_mismatch":
      return "account.authProgress.failure.sipIdentityMismatch";
    case "sip_authorize_failed":
      return "account.authProgress.failure.sipAuthorizeFailed";
    case "sip_register_failed":
      return "account.authProgress.failure.sipRegisterFailed";
    case "cancelled":
      return "account.authProgress.failure.cancelled";
    case "operation_failed":
    case null:
      return "account.authProgress.failure.operationFailed";
  }
}

/**
 * Compose operator-facing copy with the real technical detail for support/devtools.
 */
export function formatOcpSignInFailureTooltip(
  localizedMessage: string,
  failureCode: string | null,
): string {
  if (failureCode === null || failureCode.trim().length === 0) {
    return localizedMessage;
  }
  if (TECHNICAL_KEYS.has(failureCode) || failureCode.startsWith("ocp_proxy_authenticate_http_")) {
    return `${localizedMessage} [${failureCode}]`;
  }
  return `${localizedMessage} [${failureCode}]`;
}
