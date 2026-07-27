/**
 * Snapshot delivery after broker get-snapshot (DI-05).
 */

import type { ProtocolErrorCode, CapabilityId, WireMessage } from "@softomnitel/omnicall-protocol";
import { validateWireMessage } from "@softomnitel/omnicall-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  buildCommandSuccessReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import {
  buildSdkSnapshotMessage,
  extractProductSectionsFromReplyResult,
} from "./sdkGatewaySnapshotMessage.js";

export type SnapshotDispatchInput = Readonly<{
  connection: SdkGatewayConnection;
  product: SdkGatewayProductSurface;
  identity: SdkGatewayIdentity;
  command: Extract<WireMessage, { kind: "command" }>;
  reply: Extract<WireMessage, { kind: "reply" }>;
  requestDedup: SdkRequestDedupCache;
  now: () => Date;
  sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  /** Live effective caps (grants ∩ Origin matrix). Defaults to connection grants. */
  grantedCapabilities?: readonly CapabilityId[];
}>;

export function deliverSdkSnapshotReply(
  input: SnapshotDispatchInput,
): void {
  const { command, reply } = input;
  if (!reply.ok) {
    input.requestDedup.complete(
      command.requestId,
      reply,
      input.now().getTime(),
    );
    input.sendJson(input.connection, reply);
    input.log("sdk_gateway_command", {
      commandType: command.type,
      requestId: command.requestId,
      result: reply.error.code,
    });
    return;
  }
  const productSections = extractProductSectionsFromReplyResult(reply.result);
  if (productSections === null) {
    cacheFailure(input, "operation_failed");
    return;
  }
  const windowState = input.product.getWindowState();
  const windowVisible = windowState.ok ? windowState.visible : false;
  const clientId = input.connection.clientId;
  if (clientId === null) {
    cacheFailure(input, "unauthenticated");
    return;
  }
  const snapshot = buildSdkSnapshotMessage({
    identity: input.identity,
    now: input.now,
    revision: reply.revision,
    clientId,
    grantedCapabilities:
      input.grantedCapabilities ?? input.connection.grantedCapabilities,
    productSections,
    windowVisible,
  });
  if (snapshot === null) {
    cacheFailure(input, "operation_failed");
    return;
  }
  const snapshotValidated = validateWireMessage(snapshot);
  if (!snapshotValidated.success) {
    cacheFailure(input, "operation_failed");
    return;
  }
  const successReply = buildCommandSuccessReply({
    requestId: command.requestId,
    commandType: command.type,
    identity: input.identity,
    now: input.now,
    revision: reply.revision,
    result: { accepted: true },
  });
  input.requestDedup.complete(
    command.requestId,
    successReply,
    input.now().getTime(),
  );
  input.sendJson(input.connection, snapshotValidated.data);
  input.sendJson(input.connection, successReply);
  input.log("sdk_gateway_command", {
    commandType: command.type,
    requestId: command.requestId,
    result: "ok",
  });
}

function cacheFailure(
  input: SnapshotDispatchInput,
  code: ProtocolErrorCode,
): void {
  const reply = buildCommandFailureReply({
    requestId: input.command.requestId,
    commandType: input.command.type,
    code,
    identity: input.identity,
    now: input.now,
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
    result: code,
  });
}
