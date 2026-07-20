/**
 * Handshake + command dispatch helpers for LocalWsSessionRegistry (DI-04/DI-05).
 */

import type { ClientHello, ProtocolErrorCode, WireMessage } from "@axatalk/protocol";

import { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  buildCommandSuccessReply,
  buildServerHello,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import { dispatchSdkProductRoute } from "./sdkGatewayProductDispatch.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import { routeSdkInbound } from "./sdkGatewayRouteInbound.js";
import {
  handleAuthProof,
  handlePairingRequest,
  type SdkSessionAuthDeps,
} from "./sdkGatewaySessionAuth.js";
import type { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import { syncAccountActivateCapabilityForConnection } from "./sdkAccountActivateSession.js";

export type SdkCommandRoute =
  | {
      readonly action: "command_deny";
      readonly requestId: string;
      readonly commandType: Extract<WireMessage, { kind: "command" }>["type"];
      readonly code: ProtocolErrorCode;
    }
  | {
      readonly action: "command_not_ready";
      readonly requestId: string;
      readonly commandType: Extract<WireMessage, { kind: "command" }>["type"];
    }
  | { readonly action: "command_ping"; readonly requestId: string };

export async function completeSdkHandshake(input: {
  readonly connection: SdkGatewayConnection;
  readonly hello: ClientHello;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly pairingStore: SdkGatewayPairingStore;
  readonly challenges: SdkAuthChallengeCache;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly startHeartbeat: (connection: SdkGatewayConnection) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly connectionCount: number;
}): Promise<void> {
  const identity = input.getIdentity();
  if (identity === null) {
    input.closeConnection(input.connection, "not_ready");
    return;
  }
  if (input.connection.handshakeTimer !== null) {
    clearTimeout(input.connection.handshakeTimer);
    input.connection.handshakeTimer = null;
  }
  input.connection.handshakeComplete = true;
  let pairingRequired = true;
  let authChallenge = undefined;
  if (input.hello.clientId !== undefined) {
    const paired = await input.pairingStore.findActive(
      input.hello.clientId,
      input.connection.origin,
      input.now().getTime(),
    );
    if (paired !== null) {
      pairingRequired = false;
      authChallenge = input.challenges.issue({
        clientId: input.hello.clientId,
        origin: input.connection.origin,
        now: input.now,
      });
      input.connection.authState = "authenticating";
      input.connection.clientId = input.hello.clientId;
    }
  }
  input.sendJson(
    input.connection,
    buildServerHello({
      identity,
      now: input.now,
      pairingRequired,
      ...(authChallenge !== undefined ? { authChallenge } : {}),
    }),
  );
  input.startHeartbeat(input.connection);
  input.log("sdk_gateway_handshake_ok", {
    connectionCount: input.connectionCount,
    pairingRequired,
  });
}

export function handleSdkCommandRoute(input: {
  readonly connection: SdkGatewayConnection;
  readonly route: SdkCommandRoute;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly requestDedup: SdkRequestDedupCache;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}): void {
  const identity = input.getIdentity();
  if (identity === null) {
    input.closeConnection(input.connection, "not_ready");
    return;
  }
  const requestId = input.route.requestId;
  const commandType =
    input.route.action === "command_ping" ? "sdk:ping" : input.route.commandType;
  const nowMs = input.now().getTime();
  const dedup = input.requestDedup.begin(requestId, nowMs);
  if (dedup.action === "replay") {
    input.sendJson(input.connection, dedup.reply);
    return;
  }
  if (dedup.action === "await") {
    void dedup.promise.then((reply) => {
      input.sendJson(input.connection, reply);
    });
    return;
  }
  if (input.route.action === "command_ping") {
    const reply = buildCommandSuccessReply({
      requestId,
      commandType: "sdk:ping",
      identity,
      now: input.now,
    });
    input.requestDedup.complete(requestId, reply, input.now().getTime());
    input.sendJson(input.connection, reply);
    input.log("sdk_gateway_command", {
      commandType: "sdk:ping",
      requestId,
      result: "ok",
    });
    return;
  }
  const code =
    input.route.action === "command_deny" ? input.route.code : "not_ready";
  const reply = buildCommandFailureReply({
    requestId,
    commandType,
    code,
    identity,
    now: input.now,
  });
  input.requestDedup.complete(requestId, reply, input.now().getTime());
  input.sendJson(input.connection, reply);
  input.log("sdk_gateway_command", {
    commandType,
    requestId,
    result: code,
  });
}

export async function dispatchSdkValidatedMessage(input: {
  readonly connection: SdkGatewayConnection;
  readonly message: WireMessage;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly pairingStore: SdkGatewayPairingStore;
  readonly pairingApprover: SdkPairingApprover;
  readonly challenges: SdkAuthChallengeCache;
  readonly requestDedup: SdkRequestDedupCache;
  readonly now: () => Date;
  readonly connectionCount: number;
  readonly heartbeatSeconds: number;
  readonly activateGrantStore: SdkAccountActivateGrantStore;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly startHeartbeat: (connection: SdkGatewayConnection) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly isSessionExpired: (connection: SdkGatewayConnection) => boolean;
  readonly productSurface: SdkGatewayProductSurface | null;
}): Promise<void> {
  if (input.isSessionExpired(input.connection)) {
    input.closeConnection(input.connection, "unauthenticated");
    return;
  }
  // DI-08: drop stale account.activate before capability routing (grant TTL).
  syncAccountActivateCapabilityForConnection(
    input.connection,
    input.activateGrantStore,
    input.now().getTime(),
  );
  const route = routeSdkInbound(input.message, {
    handshakeComplete: input.connection.handshakeComplete,
    authState: input.connection.authState,
    grantedCapabilities: input.connection.grantedCapabilities,
  });
  if (
    route.action === "server_hello" &&
    input.message.kind === "handshake" &&
    input.message.type === "sdk:client-hello"
  ) {
    await completeSdkHandshake({
      connection: input.connection,
      hello: input.message,
      getIdentity: input.getIdentity,
      pairingStore: input.pairingStore,
      challenges: input.challenges,
      now: input.now,
      sendJson: input.sendJson,
      closeConnection: input.closeConnection,
      startHeartbeat: input.startHeartbeat,
      log: input.log,
      connectionCount: input.connectionCount,
    });
    return;
  }
  const authDeps: SdkSessionAuthDeps = {
    pairingStore: input.pairingStore,
    pairingApprover: input.pairingApprover,
    challenges: input.challenges,
    now: input.now,
    getIdentity: input.getIdentity,
    sendJson: input.sendJson,
    closeConnection: input.closeConnection,
    audit: input.log,
    activateGrantStore: input.activateGrantStore,
  };
  if (route.action === "pairing_request") {
    await handlePairingRequest(authDeps, input.connection, route.message);
    return;
  }
  if (route.action === "auth_proof") {
    await handleAuthProof(authDeps, input.connection, route.message);
    return;
  }
  if (
    route.action === "command_deny" ||
    route.action === "command_not_ready" ||
    route.action === "command_ping"
  ) {
    handleSdkCommandRoute({
      connection: input.connection,
      route,
      getIdentity: input.getIdentity,
      requestDedup: input.requestDedup,
      now: input.now,
      sendJson: input.sendJson,
      closeConnection: input.closeConnection,
      log: input.log,
    });
    return;
  }
  if (route.action === "command_broker" || route.action === "command_window") {
    await dispatchSdkProductRoute({
      route,
      productSurface: input.productSurface,
      context: {
        connection: input.connection,
        getIdentity: input.getIdentity,
        requestDedup: input.requestDedup,
        now: input.now,
        sendJson: input.sendJson,
        closeConnection: input.closeConnection,
        log: input.log,
        activateGrantStore: input.activateGrantStore,
      },
      onNotReady: (productRoute) => {
        handleSdkCommandRoute({
          connection: input.connection,
          route: {
            action: "command_not_ready",
            requestId: productRoute.requestId,
            commandType: productRoute.commandType,
          },
          getIdentity: input.getIdentity,
          requestDedup: input.requestDedup,
          now: input.now,
          sendJson: input.sendJson,
          closeConnection: input.closeConnection,
          log: input.log,
        });
      },
    });
    return;
  }
  if (route.action === "close") {
    input.closeConnection(input.connection, route.code);
    return;
  }
  input.closeConnection(input.connection, "invalid_message");
}
