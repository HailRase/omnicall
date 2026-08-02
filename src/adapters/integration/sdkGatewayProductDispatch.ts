/**
 * DI-05/DI-06 product command execution via broker (WU-02: window joins broker).
 * Native BrowserWindow still runs in main through Application→IPC after revision validate.
 */

import type { CommandType, CapabilityId, WireMessage } from "@softomnitel/omnicall-protocol";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import { buildWindowVisibilityEvent } from "./sdkGatewaySnapshotMessage.js";
import { gateSdkCommandDedup } from "./sdkGatewayDedupGate.js";
import type {
  SdkDedupPrincipal,
  SdkRequestDedupCache,
} from "./sdkGatewayRequestDedup.js";
import { deliverSdkSnapshotReply } from "./sdkGatewaySnapshotDispatch.js";
import { denyActivateWhenOriginPolicyForbids } from "./sdkGatewayActivateApproval.js";

export type SdkProductCommandRoute = {
  readonly action: "command_broker";
  readonly requestId: string;
  readonly commandType: CommandType;
  readonly message: Extract<WireMessage, { kind: "command" }>;
};

export type SdkProductDispatchContext = Readonly<{
  readonly connection: SdkGatewayConnection;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly requestDedup: SdkRequestDedupCache;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  /** ADR-0018: Origin matrix account.activate flag. */
  readonly isOriginActivateAllowed: (origin: string) => boolean;
  /** Live grants ∩ Origin matrix for snapshot honesty. */
  readonly effectiveCapabilities?: readonly CapabilityId[];
}>;

/** Run product route or fall back to not_ready when surface is absent. */
export async function dispatchSdkProductRoute(input: {
  readonly route: SdkProductCommandRoute;
  readonly productSurface: SdkGatewayProductSurface | null;
  readonly context: SdkProductDispatchContext;
  readonly onNotReady: (route: SdkProductCommandRoute) => void | Promise<void>;
}): Promise<void> {
  if (input.productSurface === null) {
    await input.onNotReady(input.route);
    return;
  }
  await handleSdkProductCommand({
    ...input.context,
    route: input.route,
    product: input.productSurface,
    emitToConnection: input.context.sendJson,
  });
}

export async function handleSdkProductCommand(input: {
  readonly connection: SdkGatewayConnection;
  readonly route: SdkProductCommandRoute;
  readonly product: SdkGatewayProductSurface;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly requestDedup: SdkRequestDedupCache;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly emitToConnection: (
    connection: SdkGatewayConnection,
    message: WireMessage,
  ) => void;
  readonly isOriginActivateAllowed: (origin: string) => boolean;
  readonly effectiveCapabilities?: readonly CapabilityId[];
}): Promise<void> {
  const identity = input.getIdentity();
  if (identity === null) {
    input.closeConnection(input.connection, "not_ready");
    return;
  }
  const { requestId, commandType } = input.route;
  const gate = await gateSdkCommandDedup({
    connection: input.connection,
    requestDedup: input.requestDedup,
    requestId,
    commandType,
    identity,
    now: input.now,
    sendJson: input.sendJson,
    log: input.log,
  });
  if (gate.action === "terminal") {
    return;
  }
  const { principal } = gate;

  try {
    if (!input.product.isProductReady()) {
      const reply = buildCommandFailureReply({
        requestId,
        commandType,
        code: "not_ready",
        identity,
        now: input.now,
      });
      input.requestDedup.complete(principal, reply, input.now().getTime());
      input.sendJson(input.connection, reply);
      input.log("sdk_gateway_command", {
        commandType,
        requestId,
        result: "not_ready",
      });
      return;
    }

    if (
      denyActivateWhenOriginPolicyForbids({
        connection: input.connection,
        requestDedup: input.requestDedup,
        dedupPrincipal: principal,
        now: input.now,
        sendJson: input.sendJson,
        log: input.log,
        identity,
        command: input.route.message,
        isOriginActivateAllowed: input.isOriginActivateAllowed,
      })
    ) {
      return;
    }

    await handleBrokerCommand(input, identity, input.route.message, principal);
  } catch (error: unknown) {
    input.requestDedup.abandon(principal, "failed");
    throw error;
  }
}

async function handleBrokerCommand(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  command: Extract<WireMessage, { kind: "command" }>,
  principal: SdkDedupPrincipal,
): Promise<void> {
  const clientId = input.connection.clientId;
  const brokerResult = await input.product.requestProductCommand(command, {
    ...(clientId !== null ? { clientId } : {}),
    origin: input.connection.origin,
  });
  if (!brokerResult.ok) {
    const reply = buildCommandFailureReply({
      requestId: command.requestId,
      commandType: command.type,
      code: brokerResult.code,
      identity,
      now: input.now,
      ...(brokerResult.currentRevision !== undefined
        ? { currentRevision: brokerResult.currentRevision }
        : {}),
      ...(brokerResult.details !== undefined
        ? { details: brokerResult.details }
        : {}),
    });
    input.requestDedup.complete(principal, reply, input.now().getTime());
    input.sendJson(input.connection, reply);
    input.log("sdk_gateway_command", {
      commandType: command.type,
      requestId: command.requestId,
      result: brokerResult.code,
    });
    return;
  }

  const reply = brokerResult.reply;
  if (command.type === "sdk:get-snapshot") {
    deliverSdkSnapshotReply({
      connection: input.connection,
      product: input.product,
      identity,
      command,
      reply,
      requestDedup: input.requestDedup,
      dedupPrincipal: principal,
      now: input.now,
      sendJson: input.sendJson,
      log: input.log,
      grantedCapabilities:
        input.effectiveCapabilities ?? input.connection.grantedCapabilities,
    });
    return;
  }

  input.requestDedup.complete(principal, reply, input.now().getTime());
  // Reply before visibility event (DI-05 ordering contract).
  input.sendJson(input.connection, reply);
  maybeEmitWindowVisibilityEvent(input, identity, command, reply);
  input.log("sdk_gateway_command", {
    commandType: command.type,
    requestId: command.requestId,
    result: reply.ok ? "ok" : reply.error.code,
  });
}

function maybeEmitWindowVisibilityEvent(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  command: Extract<WireMessage, { kind: "command" }>,
  reply: Extract<WireMessage, { kind: "reply" }>,
): void {
  if (
    !reply.ok ||
    (command.type !== "window:show" && command.type !== "window:hide")
  ) {
    return;
  }
  const visible =
    typeof reply.result === "object" &&
    reply.result !== null &&
    "visible" in reply.result &&
    typeof reply.result["visible"] === "boolean"
      ? reply.result["visible"]
      : command.type === "window:show";
  input.connection.eventSequence += 1;
  input.emitToConnection(
    input.connection,
    buildWindowVisibilityEvent({
      identity,
      now: input.now,
      sequence: input.connection.eventSequence,
      revision: reply.revision,
      visible,
    }),
  );
}
