/**
 * - Purpose: map non-blocking OCP authFeedback projection to toast descriptor keys.
 * - Inputs: OcpAuthFeedbackReason from session projection.
 * - Outputs: translation key for toast message (UI resolves via i18n).
 */

import type { OcpAuthFeedbackReason } from "@application/projections/integration/ocpSessionProjection.js";
import type { TranslationKey } from "../../i18n/messages.js";

export function mapOcpAuthFeedbackToMessageKey(
  reason: OcpAuthFeedbackReason,
): TranslationKey {
  switch (reason) {
    case "SESSION_EXIST":
      return "ocp.authFeedback.sessionExist";
    case "INVALID_TOKEN":
      return "ocp.authFeedback.invalidToken";
    case "AUTH_TIMEOUT":
      return "ocp.authFeedback.authTimeout";
    case "HTTP_AUTH_FAILED":
      return "ocp.authFeedback.httpFailed";
    case "LOGIN_REQUIRED":
      return "ocp.authFeedback.loginRequired";
    case "API_KEY_REQUIRED":
      return "ocp.authFeedback.apiKeyRequired";
  }
}
