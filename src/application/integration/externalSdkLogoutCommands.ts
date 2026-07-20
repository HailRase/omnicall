/**
 * Logout prepare/confirm command bodies for ExternalSdkOperatorHandler (DI-07).
 */

import type { ExternalHandlerResult } from "@ports/integration/ExternalCommandHandler.js";

import type { ExternalSdkOperatorPort } from "./ExternalSdkOperatorPort.js";
import {
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import {
  interactionRequired,
  parseConfirmLogoutPayload,
} from "./externalSdkOperatorHelpers.js";
import { mapPlatformErrorToSdkCode } from "./mapPlatformErrorToSdkCode.js";
import { filterSdkReasonsByKind } from "./mapSdkOperatorReasons.js";
import type { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

export type PendingLogout = Readonly<{
  clientId: string;
  requiresReason: boolean;
  expiresAt: number;
}>;

export type LogoutCommandDeps = Readonly<{
  operatorPort: ExternalSdkOperatorPort;
  revisionClock: SdkSessionRevisionClock;
  pendingLogouts: Map<string, PendingLogout>;
  createLogoutToken: () => string;
  nowMs: () => number;
  tokenTtlMs: number;
  requireFreshRevision: (
    payload: unknown,
  ) => ExternalHandlerResult | { readonly ok: true };
  prunePendingLogouts: () => void;
}>;

export function prepareLogoutCommand(
  deps: LogoutCommandDeps,
  payload: unknown,
  clientId: string,
): ExternalHandlerResult {
  const gate = deps.requireFreshRevision(payload);
  if (!gate.ok) {
    return gate;
  }
  deps.prunePendingLogouts();
  for (const [token, entry] of deps.pendingLogouts) {
    if (entry.clientId === clientId) {
      deps.pendingLogouts.delete(token);
    }
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
  const logoutToken = deps.createLogoutToken();
  deps.pendingLogouts.set(logoutToken, {
    clientId,
    requiresReason,
    expiresAt: deps.nowMs() + deps.tokenTtlMs,
  });

  if (requiresReason) {
    return interactionRequired(logoutToken, logoutReasons);
  }

  return sdkCallSuccess(
    { logoutToken, requiresReason: false },
    deps.revisionClock.peek(),
  );
}

export async function confirmLogoutCommand(
  deps: LogoutCommandDeps,
  payload: unknown,
  clientId: string,
): Promise<ExternalHandlerResult> {
  const gate = deps.requireFreshRevision(payload);
  if (!gate.ok) {
    return gate;
  }
  deps.prunePendingLogouts();
  const parsed = parseConfirmLogoutPayload(payload);
  if (parsed === null) {
    return sdkFail("invalid_payload");
  }
  const pending = deps.pendingLogouts.get(parsed.logoutToken);
  if (pending === undefined) {
    return sdkFail("not_found");
  }
  if (pending.clientId !== clientId) {
    return sdkFail("forbidden");
  }

  const logoutReasons = filterSdkReasonsByKind(
    deps.operatorPort.listOperatorReasons(),
    "logout",
  );
  if (pending.requiresReason && parsed.reasonId === undefined) {
    return interactionRequired(parsed.logoutToken, logoutReasons);
  }
  if (
    parsed.reasonId !== undefined &&
    pending.requiresReason &&
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
      return interactionRequired(parsed.logoutToken, logoutReasons);
    }
    return sdkFail(code);
  }

  deps.pendingLogouts.delete(parsed.logoutToken);
  return sdkCallSuccess(
    {
      loggedOut: true,
      ocpStep: result.value.ocpStep,
      operatorSnapshotMissing: result.value.operatorSnapshotMissing,
    },
    deps.revisionClock.advance(),
  );
}
