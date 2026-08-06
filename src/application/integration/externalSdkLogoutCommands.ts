/**
 * Single-shot account:logout command body for ExternalSdkOperatorHandler.
 * CRM selects logout reason via operator:get-reasons; no prepare/confirm token.
 * Revision validate/advance owned by SdkSessionRevisionCoordinator (ADR-0027).
 */

import type { ExternalSdkOperatorPort } from "./ExternalSdkOperatorPort.js";
import { sdkFail } from "./externalSdkCallHelpers.js";
import {
  interactionRequiredLogout,
  parseLogoutPayload,
} from "./externalSdkOperatorHelpers.js";
import { mapPlatformErrorToSdkCode } from "./mapPlatformErrorToSdkCode.js";
import { filterSdkReasonsByKind } from "./mapSdkOperatorReasons.js";
import type { SdkRevisionMutationOutcome } from "./SdkSessionRevisionCoordinator.js";

export type LogoutCommandDeps = Readonly<{
  operatorPort: ExternalSdkOperatorPort;
}>;

export async function logoutAccountCommand(
  deps: LogoutCommandDeps,
  payload: unknown,
): Promise<SdkRevisionMutationOutcome> {
  const parsed = parseLogoutPayload(payload);
  if (parsed === null) {
    return sdkFail("invalid_payload");
  }

  const session = deps.operatorPort.readOcpSession();
  const logoutReasons = filterSdkReasonsByKind(
    deps.operatorPort.listOperatorReasons(),
    "logout",
  );
  const requiresReason =
    session.isAuthenticated &&
    session.hasOperatorSnapshot &&
    logoutReasons.length > 0;

  if (requiresReason && parsed.reasonId === undefined) {
    return interactionRequiredLogout(logoutReasons);
  }
  if (
    parsed.reasonId !== undefined &&
    requiresReason &&
    !logoutReasons.some((r) => r.id === parsed.reasonId)
  ) {
    return sdkFail("invalid_payload");
  }

  const result = await deps.operatorPort.logoutAccountSession(
    parsed.reasonId === undefined ? {} : { reasonId: parsed.reasonId },
  );
  if (!result.ok) {
    const code = mapPlatformErrorToSdkCode(result.error);
    if (code === "interaction_required") {
      return interactionRequiredLogout(logoutReasons);
    }
    return sdkFail(code);
  }

  return {
    ok: true,
    result: {
      loggedOut: true,
      ocpStep: result.value.ocpStep,
      operatorSnapshotMissing: result.value.operatorSnapshotMissing,
    },
  };
}
