/**
 * Local-approval + Origin matrix gate for account:activate-profile (DI-08/DI-11).
 */

import type { WireMessage } from "@axata/axatalk-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";

function sendActivateForbidden(input: {
  readonly connection: SdkGatewayConnection;
  readonly requestDedup: SdkRequestDedupCache;
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
    input.command.requestId,
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
 */
export function denyActivateWithoutLocalApproval(input: {
  readonly connection: SdkGatewayConnection;
  readonly requestDedup: SdkRequestDedupCache;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly activateGrantStore: SdkAccountActivateGrantStore;
  readonly identity: SdkGatewayIdentity;
  readonly command: Extract<WireMessage, { kind: "command" }>;
  /**
   * Origin matrix allows account.activate (ADR-0018).
   * Omit for DI-08 unit paths that only exercise the grant gate; when provided,
   * empty/missing matrix must fail closed (caller returns false).
   */
  readonly isOriginActivateAllowed?: (origin: string) => boolean;
}): boolean {
  const { command } = input;
  if (command.type !== "account:activate-profile") {
    return false;
  }

  if (
    input.isOriginActivateAllowed !== undefined &&
    !input.isOriginActivateAllowed(input.connection.origin)
  ) {
    sendActivateForbidden({
      ...input,
      detailKey: "permission_denied",
    });
    return true;
  }

  const clientId = input.connection.clientId;
  const profileRef =
    typeof command.payload === "object" &&
    command.payload !== null &&
    "profileRef" in command.payload &&
    typeof command.payload.profileRef === "string"
      ? command.payload.profileRef
      : null;
  if (
    clientId === null ||
    profileRef === null ||
    !input.activateGrantStore.hasValidGrant(
      clientId,
      profileRef,
      input.now().getTime(),
    )
  ) {
    sendActivateForbidden({
      ...input,
      detailKey: "permission_denied",
    });
    return true;
  }
  return false;
}
