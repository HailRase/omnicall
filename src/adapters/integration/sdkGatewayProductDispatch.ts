/**
 * DI-05 product command execution: snapshot via broker, window via main handler.
 */

import type {
  CommandType,
  ProtocolErrorCode,
  WireMessage,
} from "@axatalk/protocol";
import { validateWireMessage } from "@axatalk/protocol";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  buildCommandSuccessReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import {
  buildSdkSnapshotMessage,
  buildWindowVisibilityEvent,
  extractProductSectionsFromReplyResult,
} from "./sdkGatewaySnapshotMessage.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";

export type SdkProductCommandRoute =
  | {
      readonly action: "command_broker";
      readonly requestId: string;
      readonly commandType: CommandType;
      readonly message: Extract<WireMessage, { kind: "command" }>;
    }
  | {
      readonly action: "command_window";
      readonly requestId: string;
      readonly commandType: "window:show" | "window:get-state";
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
}>;

/** Run product route or fall back to not_ready when surface is absent. */
export async function dispatchSdkProductRoute(input: {
  readonly route: SdkProductCommandRoute;
  readonly productSurface: SdkGatewayProductSurface | null;
  readonly context: SdkProductDispatchContext;
  readonly onNotReady: (route: SdkProductCommandRoute) => void;
}): Promise<void> {
  if (input.productSurface === null) {
    input.onNotReady(input.route);
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
}): Promise<void> {
  const identity = input.getIdentity();
  if (identity === null) {
    input.closeConnection(input.connection, "not_ready");
    return;
  }
  const { requestId, commandType } = input.route;
  if (!input.requestDedup.accept(requestId, input.now().getTime())) {
    sendFailure(input, identity, requestId, commandType, "conflict");
    return;
  }
  if (!input.product.isProductReady()) {
    sendFailure(input, identity, requestId, commandType, "not_ready");
    return;
  }
  if (input.route.action === "command_window") {
    handleWindowCommand(input, identity, input.route.commandType);
    return;
  }
  await handleBrokerSnapshot(input, identity, input.route.message);
}

function handleWindowCommand(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  commandType: "window:show" | "window:get-state",
): void {
  if (commandType === "window:get-state") {
    const state = input.product.getWindowState();
    if (!state.ok) {
      sendFailure(input, identity, input.route.requestId, commandType, state.code);
      return;
    }
    input.sendJson(
      input.connection,
      buildCommandSuccessReply({
        requestId: input.route.requestId,
        commandType,
        identity,
        now: input.now,
        revision: state.revision,
        result: { visible: state.visible },
      }),
    );
    input.log("sdk_gateway_command", {
      commandType,
      requestId: input.route.requestId,
      result: "ok",
    });
    return;
  }

  const shown = input.product.showWindow();
  if (!shown.ok) {
    sendFailure(input, identity, input.route.requestId, commandType, shown.code);
    return;
  }
  input.sendJson(
    input.connection,
    buildCommandSuccessReply({
      requestId: input.route.requestId,
      commandType,
      identity,
      now: input.now,
      revision: shown.revision,
      result: { visible: true },
    }),
  );
  input.connection.eventSequence += 1;
  input.emitToConnection(
    input.connection,
    buildWindowVisibilityEvent({
      identity,
      now: input.now,
      sequence: input.connection.eventSequence,
      revision: shown.revision,
      visible: true,
    }),
  );
  input.log("sdk_gateway_command", {
    commandType,
    requestId: input.route.requestId,
    result: "ok",
  });
}

async function handleBrokerSnapshot(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  command: Extract<WireMessage, { kind: "command" }>,
): Promise<void> {
  const brokerResult = await input.product.requestProductCommand(command);
  if (!brokerResult.ok) {
    sendFailure(
      input,
      identity,
      command.requestId,
      command.type,
      brokerResult.code,
    );
    return;
  }
  const reply = brokerResult.reply;
  if (!reply.ok) {
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
    sendFailure(
      input,
      identity,
      command.requestId,
      command.type,
      "operation_failed",
    );
    return;
  }
  const windowState = input.product.getWindowState();
  const windowVisible = windowState.ok ? windowState.visible : false;
  const clientId = input.connection.clientId;
  if (clientId === null) {
    sendFailure(input, identity, command.requestId, command.type, "unauthenticated");
    return;
  }
  const snapshot = buildSdkSnapshotMessage({
    identity,
    now: input.now,
    revision: reply.revision,
    clientId,
    grantedCapabilities: input.connection.grantedCapabilities,
    productSections,
    windowVisible,
  });
  if (snapshot === null) {
    sendFailure(
      input,
      identity,
      command.requestId,
      command.type,
      "operation_failed",
    );
    return;
  }
  const snapshotValidated = validateWireMessage(snapshot);
  if (!snapshotValidated.success) {
    sendFailure(
      input,
      identity,
      command.requestId,
      command.type,
      "operation_failed",
    );
    return;
  }
  input.sendJson(input.connection, snapshotValidated.data);
  input.sendJson(
    input.connection,
    buildCommandSuccessReply({
      requestId: command.requestId,
      commandType: command.type,
      identity,
      now: input.now,
      revision: reply.revision,
      result: { accepted: true },
    }),
  );
  input.log("sdk_gateway_command", {
    commandType: command.type,
    requestId: command.requestId,
    result: "ok",
  });
}

function sendFailure(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  requestId: string,
  commandType: CommandType,
  code: ProtocolErrorCode,
): void {
  input.sendJson(
    input.connection,
    buildCommandFailureReply({
      requestId,
      commandType,
      code,
      identity,
      now: input.now,
    }),
  );
  input.log("sdk_gateway_command", {
    commandType,
    requestId,
    result: code,
  });
}
