/**
 * Origin-matrix gate for account:activate-profile (DI-08/DI-11 / ADR-0018).
 * Temporary Settings grant removed — matrix + consent modal are the gates.
 */

import type { WireMessage } from "@softomnitel/omnicall-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type {
  SdkDedupPrincipal,
  SdkRequestDedupCache,
} from "./sdkGatewayRequestDedup.js";

function sendActivateForbidden(input: {
  readonly connection: SdkGatewayConnection;
  readonly requestDedup: SdkRequestDedupCache;
  readonly dedupPrincipal: SdkDedupPrincipal;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly identity: SdkGatewayIdentity;
  readonly command: Extract<WireMessage, { kind: "command" }>;
  readonly detailKey: "permission_denied" | "activate_denied_for_origin";
}): void {
  const reply = buildCommandFailureReply({
    requestId: input.command.requestId,
    commandType: input.command.type,
    code: "forbidden",
    identity: input.identity,
    now: input.now,
    details: { [input.detailKey]: true },
  });
  input.requestDedup.complete(
    input.dedupPrincipal,
    reply,
    input.now().getTime(),
  );
  input.sendJson(input.connection, reply);
  input.log("sdk_gateway_command", {
    commandType: input.command.type,
    requestId: input.command.requestId,
    result: "forbidden",
  });
}

/**
 * Returns true when the command was denied (reply already sent).
 * Fail closed when Origin matrix does not allow account.activate.
 */
export function denyActivateWhenOriginPolicyForbids(input: {
  readonly connection: SdkGatewayConnection;
  readonly requestDedup: SdkRequestDedupCache;
  readonly dedupPrincipal: SdkDedupPrincipal;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly identity: SdkGatewayIdentity;
  readonly command: Extract<WireMessage, { kind: "command" }>;
  readonly isOriginActivateAllowed: (origin: string) => boolean;
}): boolean {
  const { command } = input;
  if (command.type !== "account:activate-profile") {
    return false;
  }

  if (!input.isOriginActivateAllowed(input.connection.origin)) {
    sendActivateForbidden({
      ...input,
      detailKey: "permission_denied",
    });
    return true;
  }
  return false;
}

/** @deprecated Use denyActivateWhenOriginPolicyForbids */
export const denyActivateWithoutLocalApproval = denyActivateWhenOriginPolicyForbids;
