/**
 * Handshake + command dispatch helpers for LocalWsSessionRegistry (DI-04/DI-05).
 */

import type {
  CapabilityId,
  ClientHello,
  ProtocolErrorCode,
  WireMessage,
} from "@softomnitel/omnicall-protocol";
import type { SdkOriginTrustState } from "@domain/index.js";

import { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";
import {
  intersectCapabilitiesWithOriginPolicy,
  isRequiredCapabilityBlockedByOriginPolicy,
  requiredCapabilityForCommand,
} from "./sdkGatewayCapabilities.js";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  buildCommandSuccessReply,
  buildServerHello,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import { releasesSdkInboundQueueWhilePending } from "@shared/integration/sdkActivateTimeouts.js";
import { dispatchSdkProductRoute } from "./sdkGatewayProductDispatch.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import { gateSdkCommandDedup } from "./sdkGatewayDedupGate.js";
import {
  createSdkDedupPrincipal,
  SdkRequestDedupCache,
} from "./sdkGatewayRequestDedup.js";
import { routeSdkInbound } from "./sdkGatewayRouteInbound.js";
import {
  handleAuthProof,
  handlePairingRequest,
  type SdkSessionAuthDeps,
} from "./sdkGatewaySessionAuth.js";
import { syncAccountActivateCapabilityFromOriginPolicy } from "./sdkAccountActivateSession.js";
import type {
  SdkOriginTrustApprover,
  SdkOriginTrustDecision,
} from "./sdkGatewayOriginTrustApprover.js";
import {
  applySdkOriginTrustFailure,
  ensureSdkOriginTrusted,
  type SdkOriginTrustSessionContext,
} from "./sdkGatewayOriginTrustSession.js";

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
  readonly getOriginTrustState: (origin: string) => SdkOriginTrustState;
  readonly originTrustApprover: SdkOriginTrustApprover;
  readonly onOriginTrustDecision: (
    decision: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
  ) => void;
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

  if (input.getOriginTrustState(input.connection.origin) === "unknown") {
    const originCtx = buildOriginTrustSessionContext(input);
    const trust = await ensureSdkOriginTrusted(originCtx);
    if (!trust.allowed) {
      applySdkOriginTrustFailure(originCtx, trust);
    }
  }
}

function buildOriginTrustSessionContext(input: {
  readonly connection: SdkGatewayConnection;
  readonly getOriginTrustState: (origin: string) => SdkOriginTrustState;
  readonly originTrustApprover: SdkOriginTrustApprover;
  readonly onOriginTrustDecision: (
    decision: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
  ) => void;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly now: () => Date;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}): SdkOriginTrustSessionContext {
  return {
    connection: input.connection,
    getOriginTrustState: input.getOriginTrustState,
    originTrustApprover: input.originTrustApprover,
    onOriginTrustDecision: input.onOriginTrustDecision,
    getIdentity: input.getIdentity,
    sendJson: input.sendJson,
    closeConnection: input.closeConnection,
    now: input.now,
    log: input.log,
  };
}

export async function handleSdkCommandRoute(input: {
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
  /** ADR-0018: matrix deny while grant still present. */
  readonly denyDetails?: Readonly<Record<string, boolean | string | number>>;
}): Promise<void> {
  const identity = input.getIdentity();
  if (identity === null) {
    input.closeConnection(input.connection, "not_ready");
    return;
  }
  const requestId = input.route.requestId;
  const commandType =
    input.route.action === "command_ping" ? "sdk:ping" : input.route.commandType;
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
  if (input.route.action === "command_ping") {
    const reply = buildCommandSuccessReply({
      requestId,
      commandType: "sdk:ping",
      identity,
      now: input.now,
    });
    input.requestDedup.complete(principal, reply, input.now().getTime());
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
    ...(input.denyDetails !== undefined ? { details: input.denyDetails } : {}),
  });
  input.requestDedup.complete(principal, reply, input.now().getTime());
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
  readonly getOriginTrustState: (origin: string) => SdkOriginTrustState;
  readonly originTrustApprover: SdkOriginTrustApprover;
  readonly onOriginTrustDecision: (
    input: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
  ) => void;
  readonly getOriginMatrixCapabilities: (origin: string) => readonly CapabilityId[];
  readonly challenges: SdkAuthChallengeCache;
  readonly requestDedup: SdkRequestDedupCache;
  readonly now: () => Date;
  readonly connectionCount: number;
  readonly heartbeatSeconds: number;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly startHeartbeat: (connection: SdkGatewayConnection) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly isSessionExpired: (connection: SdkGatewayConnection) => boolean;
  readonly productSurface: SdkGatewayProductSurface | null;
  readonly getPairingPendingTtlMs?: () => number;
}): Promise<void> {
  if (input.isSessionExpired(input.connection)) {
    input.closeConnection(input.connection, "unauthenticated");
    return;
  }
  const originPolicyCapabilities = input.getOriginMatrixCapabilities(
    input.connection.origin,
  );
  syncAccountActivateCapabilityFromOriginPolicy(
    input.connection,
    originPolicyCapabilities,
  );
  const effectiveCapabilities = intersectCapabilitiesWithOriginPolicy(
    input.connection.grantedCapabilities,
    originPolicyCapabilities,
  );
  const route = routeSdkInbound(input.message, {
    handshakeComplete: input.connection.handshakeComplete,
    authState: input.connection.authState,
    grantedCapabilities: effectiveCapabilities,
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
      getOriginTrustState: input.getOriginTrustState,
      originTrustApprover: input.originTrustApprover,
      onOriginTrustDecision: input.onOriginTrustDecision,
      now: input.now,
      sendJson: input.sendJson,
      closeConnection: input.closeConnection,
      startHeartbeat: input.startHeartbeat,
      log: input.log,
      connectionCount: input.connectionCount,
    });
    return;
  }
  const originCtx: SdkOriginTrustSessionContext = {
    connection: input.connection,
    getOriginTrustState: input.getOriginTrustState,
    originTrustApprover: input.originTrustApprover,
    onOriginTrustDecision: input.onOriginTrustDecision,
    getIdentity: input.getIdentity,
    sendJson: input.sendJson,
    closeConnection: input.closeConnection,
    now: input.now,
    log: input.log,
  };
  const authDeps: SdkSessionAuthDeps = {
    pairingStore: input.pairingStore,
    pairingApprover: input.pairingApprover,
    challenges: input.challenges,
    now: input.now,
    getIdentity: input.getIdentity,
    sendJson: input.sendJson,
    closeConnection: input.closeConnection,
    audit: input.log,
    getOriginMatrixCapabilities: input.getOriginMatrixCapabilities,
    getOriginTrustState: input.getOriginTrustState,
    ...(input.getPairingPendingTtlMs !== undefined
      ? { getPairingPendingTtlMs: input.getPairingPendingTtlMs }
      : {}),
  };
  if (route.action === "pairing_request") {
    const trust = await ensureSdkOriginTrusted(originCtx);
    if (!trust.allowed) {
      applySdkOriginTrustFailure(originCtx, trust);
      return;
    }
    await handlePairingRequest(authDeps, input.connection, route.message);
    return;
  }
  if (route.action === "auth_proof") {
    const trust = await ensureSdkOriginTrusted(originCtx);
    if (!trust.allowed) {
      applySdkOriginTrustFailure(originCtx, trust);
      return;
    }
    await handleAuthProof(authDeps, input.connection, route.message);
    return;
  }
  if (
    route.action === "command_deny" ||
    route.action === "command_not_ready" ||
    route.action === "command_ping"
  ) {
    const matrixDenied =
      route.action === "command_deny" &&
      route.code === "forbidden" &&
      isRequiredCapabilityBlockedByOriginPolicy({
        granted: input.connection.grantedCapabilities,
        originPolicyCapabilities,
        required: requiredCapabilityForCommand(route.commandType),
      });
    await handleSdkCommandRoute({
      connection: input.connection,
      route,
      getIdentity: input.getIdentity,
      requestDedup: input.requestDedup,
      now: input.now,
      sendJson: input.sendJson,
      closeConnection: input.closeConnection,
      log: input.log,
      ...(matrixDenied ? { denyDetails: { permission_denied: true } } : {}),
    });
    return;
  }
  if (route.action === "command_broker") {
    const productWork = dispatchSdkProductRoute({
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
        effectiveCapabilities,
        isOriginActivateAllowed: (origin) => {
          const caps = input.getOriginMatrixCapabilities(origin);
          // Fail-closed: empty / missing matrix ⇒ activate off (ADR-0018).
          // DI-08 harness elevates account.activate via autoApprovePairing matrix;
          // unit tests omit isOriginActivateAllowed to skip this gate.
          return caps.includes("account.activate");
        },
      },
      onNotReady: async (productRoute) => {
        await handleSdkCommandRoute({
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
    // Long activate hop must not block per-connection inbound serialization —
    // client heartbeats (`sdk:ping`) need to proceed (ADR-0018 activate / PROTOCOL).
    if (
      route.action === "command_broker" &&
      releasesSdkInboundQueueWhilePending(route.commandType)
    ) {
      void productWork.catch((error: unknown) => {
        const principal = createSdkDedupPrincipal(
          input.connection,
          route.requestId,
        );
        input.requestDedup.abandon(principal, "failed");
        const message =
          error instanceof Error ? error.message.slice(0, 120) : "unknown";
        input.log("sdk_gateway_detached_command_failed", {
          commandType: route.commandType,
          requestId: route.requestId,
          result: message,
        });
      });
      return;
    }
    await productWork;
    return;
  }
  if (route.action === "close") {
    input.closeConnection(input.connection, route.code);
    return;
  }
  input.closeConnection(input.connection, "invalid_message");
}
