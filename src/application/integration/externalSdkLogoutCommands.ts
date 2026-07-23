/**
 * Single-shot account:logout command body for ExternalSdkOperatorHandler.
 * CRM selects logout reason via operator:get-reasons; no prepare/confirm token.
 */

import type { ExternalHandlerResult } from "@ports/integration/ExternalCommandHandler.js";

import type { ExternalSdkOperatorPort } from "./ExternalSdkOperatorPort.js";
import {
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import {
  interactionRequiredLogout,
  parseLogoutPayload,
} from "./externalSdkOperatorHelpers.js";
import { mapPlatformErrorToSdkCode } from "./mapPlatformErrorToSdkCode.js";
import { filterSdkReasonsByKind } from "./mapSdkOperatorReasons.js";
import type { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

export type LogoutCommandDeps = Readonly<{
  operatorPort: ExternalSdkOperatorPort;
  revisionClock: SdkSessionRevisionClock;
  requireFreshRevision: (
    payload: unknown,
  ) => ExternalHandlerResult | { readonly ok: true };
}>;

export async function logoutAccountCommand(
  deps: LogoutCommandDeps,
  payload: unknown,
): Promise<ExternalHandlerResult> {
  const gate = deps.requireFreshRevision(payload);
  if (!gate.ok) {
    return gate;
  }
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

  return sdkCallSuccess(
    {
      loggedOut: true,
      ocpStep: result.value.ocpStep,
      operatorSnapshotMissing: result.value.operatorSnapshotMissing,
    },
    deps.revisionClock.advance(),
  );
}
