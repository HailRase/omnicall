/**
 * DI-05/DI-06 product command execution: snapshot/call via broker, window via main.
 */

import type { CommandType, WireMessage } from "@axata/axatalk-protocol";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  buildCommandSuccessReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import { buildWindowVisibilityEvent } from "./sdkGatewaySnapshotMessage.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import { deliverSdkSnapshotReply } from "./sdkGatewaySnapshotDispatch.js";
import type { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import { denyActivateWithoutLocalApproval } from "./sdkGatewayActivateApproval.js";

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
  readonly activateGrantStore: SdkAccountActivateGrantStore;
  /** ADR-0018: Origin matrix account.activate flag. */
  readonly isOriginActivateAllowed?: (origin: string) => boolean;
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
  readonly activateGrantStore: SdkAccountActivateGrantStore;
  readonly emitToConnection: (
    connection: SdkGatewayConnection,
    message: WireMessage,
  ) => void;
  readonly isOriginActivateAllowed?: (origin: string) => boolean;
}): Promise<void> {
  const identity = input.getIdentity();
  if (identity === null) {
    input.closeConnection(input.connection, "not_ready");
    return;
  }
  const { requestId, commandType } = input.route;
  const dedup = input.requestDedup.begin(requestId, input.now().getTime());
  if (dedup.action === "replay") {
    input.sendJson(input.connection, dedup.reply);
    return;
  }
  if (dedup.action === "await") {
    const reply = await dedup.promise;
    input.sendJson(input.connection, reply);
    return;
  }

  if (!input.product.isProductReady()) {
    const reply = buildCommandFailureReply({
      requestId,
      commandType,
      code: "not_ready",
      identity,
      now: input.now,
    });
    input.requestDedup.complete(requestId, reply, input.now().getTime());
    input.sendJson(input.connection, reply);
    input.log("sdk_gateway_command", {
      commandType,
      requestId,
      result: "not_ready",
    });
    return;
  }

  if (input.route.action === "command_window") {
    const windowResult = executeWindowCommand(
      input,
      identity,
      input.route.commandType,
    );
    input.requestDedup.complete(
      requestId,
      windowResult.reply,
      input.now().getTime(),
    );
    // Reply before visibility event (DI-05 ordering contract).
    input.sendJson(input.connection, windowResult.reply);
    if (windowResult.shownRevision !== undefined) {
      input.connection.eventSequence += 1;
      input.emitToConnection(
        input.connection,
        buildWindowVisibilityEvent({
          identity,
          now: input.now,
          sequence: input.connection.eventSequence,
          revision: windowResult.shownRevision,
          visible: true,
        }),
      );
    }
    return;
  }

  if (
    input.route.action === "command_broker" &&
    denyActivateWithoutLocalApproval({
      connection: input.connection,
      requestDedup: input.requestDedup,
      now: input.now,
      sendJson: input.sendJson,
      log: input.log,
      activateGrantStore: input.activateGrantStore,
      identity,
      command: input.route.message,
      ...(input.isOriginActivateAllowed !== undefined
        ? { isOriginActivateAllowed: input.isOriginActivateAllowed }
        : {}),
    })
  ) {
    return;
  }

  await handleBrokerCommand(input, identity, input.route.message);
}

function executeWindowCommand(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  commandType: "window:show" | "window:get-state",
): { readonly reply: WireMessage; readonly shownRevision?: number } {
  if (commandType === "window:get-state") {
    const state = input.product.getWindowState();
    if (!state.ok) {
      input.log("sdk_gateway_command", {
        commandType,
        requestId: input.route.requestId,
        result: state.code,
      });
      return {
        reply: buildCommandFailureReply({
          requestId: input.route.requestId,
          commandType,
          code: state.code,
          identity,
          now: input.now,
        }),
      };
    }
    input.log("sdk_gateway_command", {
      commandType,
      requestId: input.route.requestId,
      result: "ok",
    });
    return {
      reply: buildCommandSuccessReply({
        requestId: input.route.requestId,
        commandType,
        identity,
        now: input.now,
        revision: state.revision,
        result: { visible: state.visible },
      }),
    };
  }

  const shown = input.product.showWindow();
  if (!shown.ok) {
    input.log("sdk_gateway_command", {
      commandType,
      requestId: input.route.requestId,
      result: shown.code,
    });
    return {
      reply: buildCommandFailureReply({
        requestId: input.route.requestId,
        commandType,
        code: shown.code,
        identity,
        now: input.now,
      }),
    };
  }
  input.log("sdk_gateway_command", {
    commandType,
    requestId: input.route.requestId,
    result: "ok",
  });
  return {
    reply: buildCommandSuccessReply({
      requestId: input.route.requestId,
      commandType,
      identity,
      now: input.now,
      revision: shown.revision,
      result: { visible: true },
    }),
    shownRevision: shown.revision,
  };
}

async function handleBrokerCommand(
  input: Parameters<typeof handleSdkProductCommand>[0],
  identity: SdkGatewayIdentity,
  command: Extract<WireMessage, { kind: "command" }>,
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
    input.requestDedup.complete(
      command.requestId,
      reply,
      input.now().getTime(),
    );
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
      now: input.now,
      sendJson: input.sendJson,
      log: input.log,
    });
    return;
  }

  input.requestDedup.complete(
    command.requestId,
    reply,
    input.now().getTime(),
  );
  input.sendJson(input.connection, reply);
  input.log("sdk_gateway_command", {
    commandType: command.type,
    requestId: command.requestId,
    result: reply.ok ? "ok" : reply.error.code,
  });
}
