/**
 * Local-approval gate for account:activate-profile (DI-08).
 */

import type { WireMessage } from "@axata/axatalk-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";

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
}): boolean {
  const { command } = input;
  if (command.type !== "account:activate-profile") {
    return false;
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
    const reply = buildCommandFailureReply({
      requestId: command.requestId,
      commandType: command.type,
      code: "forbidden",
      identity: input.identity,
      now: input.now,
    });
    input.requestDedup.complete(
      command.requestId,
      reply,
      input.now().getTime(),
    );
    input.sendJson(input.connection, reply);
    input.log("sdk_gateway_command", {
      commandType: command.type,
      requestId: command.requestId,
      result: "forbidden",
    });
    return true;
  }
  return false;
}
