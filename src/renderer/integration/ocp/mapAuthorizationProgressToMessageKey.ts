/**
 * - Purpose: map unified authorization progress stage to i18n message keys.
 * - Inputs: AuthorizationProgressStage from OCP session projection.
 * - Outputs: TranslationKey or null when idle (nothing to show).
 */

import type { AuthorizationProgressStage } from "@application/projections/settings/authorizationProgressProjection.js";
import type { TranslationKey } from "../../i18n/messages.js";

export function mapAuthorizationProgressToMessageKey(
  stage: AuthorizationProgressStage,
): TranslationKey | null {
  switch (stage) {
    case "idle":
      return null;
    case "preparing":
      return "account.authProgress.preparing";
    case "connecting_ocp":
      return "account.authProgress.connectingOcp";
    case "receiving_credentials":
      return "account.authProgress.receivingCredentials";
    case "registering_phone":
      return "account.authProgress.registeringPhone";
    case "ready":
      return "account.authProgress.ready";
    case "ocp_connected_sip_failed":
      return "account.authProgress.ocpConnectedSipFailed";
    case "ocp_unavailable":
      return "account.authProgress.ocpUnavailable";
    case "sip_registration_failed":
      return "account.authProgress.sipRegistrationFailed";
    case "ocp_session_exist":
      return "account.authProgress.ocpSessionExist";
    case "retry_available":
      return "account.authProgress.retryAvailable";
  }
}
