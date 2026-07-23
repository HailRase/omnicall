/**
 * Connection registry for loopback WS gateway (DI-03 transport + DI-04 auth).
 */

import type { WireMessage } from "@axata/axatalk-protocol";
import type { CapabilityId } from "@axata/axatalk-protocol";
import type { SdkOriginTrustState } from "@domain/index.js";

import { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";
import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import {
  clearSdkGatewayConnectionTimers,
  createSdkGatewayConnection,
  type SdkGatewayConnection,
  type SdkGatewaySocket,
} from "./sdkGatewayConnection.js";
import { createSdkOpaqueId } from "./sdkGatewayIds.js";
import {
  buildSdkPermissionChangedEvent,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import {
  fanoutSdkPublicEvent,
  parseSdkPublicEventDraft,
} from "./sdkGatewayEventFanout.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import {
  armSdkGatewayIdleTimer,
  bindSdkGatewaySocketHandlers,
  closeSdkGatewayConnection,
  sendSdkGatewayJson,
} from "./sdkGatewaySessionSocket.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";
import { syncAccountActivateCapabilityFromOriginPolicy } from "./sdkAccountActivateSession.js";
import { parseAndDispatchLocalWsSession } from "./localWsSessionInbound.js";
import { revokeLocalWsClient } from "./localWsSessionRevoke.js";
import type {
  SdkOriginTrustApprover,
  SdkOriginTrustDecision,
} from "./sdkGatewayOriginTrustApprover.js";

export type LocalWsSessionRegistryDeps = Readonly<{
  limits: SdkGatewayLimits;
  now: () => Date;
  validateWire: (
    input: unknown,
  ) =>
    | { success: true; data: WireMessage }
    | { success: false; code: string };
  getIdentity: () => SdkGatewayIdentity | null;
  pairingStore: SdkGatewayPairingStore;
  pairingApprover: SdkPairingApprover;
  getOriginTrustState: (origin: string) => SdkOriginTrustState;
  originTrustApprover: SdkOriginTrustApprover;
  onOriginTrustDecision: (
    input: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
  ) => void;
  getOriginMatrixCapabilities: (origin: string) => readonly CapabilityId[];
  getProductSurface?: () => SdkGatewayProductSurface | null;
  /** Fired after a connection leaves the registry (close / terminate). */
  onConnectionRemoved?: (connection: SdkGatewayConnection) => void;
  onLog?: SdkGatewayLogFn;
  getPairingPendingTtlMs?: () => number;
}>;

export class LocalWsSessionRegistry {
  private readonly connections = new Map<string, SdkGatewayConnection>();
  private readonly limits: SdkGatewayLimits;
  private readonly now: () => Date;
  private readonly validateWire: LocalWsSessionRegistryDeps["validateWire"];
  private readonly getIdentity: () => SdkGatewayIdentity | null;
  private readonly pairingStore: SdkGatewayPairingStore;
  private readonly pairingApprover: SdkPairingApprover;
  private readonly getOriginTrustState: (origin: string) => SdkOriginTrustState;
  private readonly originTrustApprover: SdkOriginTrustApprover;
  private readonly onOriginTrustDecision: (
    input: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
  ) => void;
  private readonly getOriginMatrixCapabilities: (
    origin: string,
  ) => readonly CapabilityId[];
  private readonly getProductSurface: () => SdkGatewayProductSurface | null;
  private readonly onConnectionRemoved:
    | ((connection: SdkGatewayConnection) => void)
    | undefined;
  private readonly challenges = new SdkAuthChallengeCache();
  private readonly requestDedup = new SdkRequestDedupCache();
  private readonly onLog: SdkGatewayLogFn | undefined;
  private readonly getPairingPendingTtlMs: (() => number) | undefined;
  private revokeEventSequence = 0;

  constructor(deps: LocalWsSessionRegistryDeps) {
    this.limits = deps.limits;
    this.now = deps.now;
    this.validateWire = deps.validateWire;
    this.getIdentity = deps.getIdentity;
    this.pairingStore = deps.pairingStore;
    this.pairingApprover = deps.pairingApprover;
    this.getOriginTrustState = deps.getOriginTrustState;
    this.originTrustApprover = deps.originTrustApprover;
    this.onOriginTrustDecision = deps.onOriginTrustDecision;
    this.getOriginMatrixCapabilities = deps.getOriginMatrixCapabilities;
    this.getProductSurface = deps.getProductSurface ?? (() => null);
    this.onConnectionRemoved = deps.onConnectionRemoved;
    this.onLog = deps.onLog;
    this.getPairingPendingTtlMs = deps.getPairingPendingTtlMs;
  }

  get size(): number {
    return this.connections.size;
  }

  countConnectionsForOrigin(origin: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.origin === origin) {
        count += 1;
      }
    }
    return count;
  }

  /** Close every live socket for Origin (policy remove / blacklist). */
  closeConnectionsForOrigin(origin: string, reason: string): number {
    let count = 0;
    for (const connection of [...this.connections.values()]) {
      if (connection.origin === origin) {
        this.closeConnection(connection, reason);
        count += 1;
      }
    }
    return count;
  }

  /** Allowlisted auth-state counts for Settings diagnostics (no payloads). */
  countByAuthState(): Readonly<{
    authenticated: number;
    unauthenticated: number;
    authenticating: number;
    revoked: number;
  }> {
    let authenticated = 0;
    let unauthenticated = 0;
    let authenticating = 0;
    let revoked = 0;
    for (const connection of this.connections.values()) {
      switch (connection.authState) {
        case "authenticated":
          authenticated += 1;
          break;
        case "authenticating":
          authenticating += 1;
          break;
        case "revoked":
          revoked += 1;
          break;
        default:
          unauthenticated += 1;
          break;
      }
    }
    return { authenticated, unauthenticated, authenticating, revoked };
  }

  /** Sync live account.activate capability after an Origin matrix update. */
  syncActivateCapabilitiesForOrigin(
    origin: string,
    policyCapabilities: readonly CapabilityId[],
  ): number {
    const identity = this.getIdentity();
    if (identity === null) {
      return 0;
    }
    let changed = 0;
    for (const connection of this.connections.values()) {
      if (
        connection.origin !== origin ||
        !syncAccountActivateCapabilityFromOriginPolicy(
          connection,
          policyCapabilities,
        )
      ) {
        continue;
      }
      connection.eventSequence += 1;
      this.sendJson(
        connection,
        buildSdkPermissionChangedEvent({
          identity,
          now: this.now,
          sequence: connection.eventSequence,
          grantedCapabilities: connection.grantedCapabilities,
        }),
      );
      changed += 1;
    }
    return changed;
  }

  attach(socket: SdkGatewaySocket, origin: string): void {
    const id = createSdkOpaqueId("conn");
    const connection = createSdkGatewayConnection(
      id,
      socket,
      origin,
      this.now().getTime(),
    );
    this.connections.set(id, connection);
    this.log("sdk_gateway_connection_opened", {
      connectionCount: this.connections.size,
    });
    connection.handshakeTimer = setTimeout(() => {
      this.closeConnection(connection, "handshake_timeout");
    }, this.limits.handshakeTimeoutMs);
    this.armIdle(connection);
    bindSdkGatewaySocketHandlers({
      connection,
      onMessage: (conn, text) => {
        this.parseAndDispatch(conn, text);
      },
      onActivity: (conn) => {
        this.armIdle(conn);
      },
      onClose: (conn) => {
        this.removeConnection(conn);
      },
      closeConnection: (conn, reason) => {
        this.closeConnection(conn, reason);
      },
      limits: this.limits,
      nowMs: () => this.now().getTime(),
      logRateLimited: () => {
        this.log("sdk_gateway_rate_limited", {
          connectionCount: this.connections.size,
        });
      },
    });
  }

  terminateAll(): void {
    for (const connection of [...this.connections.values()]) {
      clearSdkGatewayConnectionTimers(connection);
      try {
        connection.socket.terminate();
      } catch {
        // ignore
      }
    }
    this.connections.clear();
  }

  async revokeClient(clientId: string): Promise<boolean> {
    return revokeLocalWsClient({
      clientId,
      pairingStore: this.pairingStore,
      connections: this.connections,
      getIdentity: this.getIdentity,
      now: this.now,
      sendJson: (c, m) => {
        this.sendJson(c, m);
      },
      closeConnection: (c, reason) => {
        this.closeConnection(c, reason);
      },
      log: (event, fields) => {
        this.log(event, fields);
      },
      nextRevokeSequence: () => {
        this.revokeEventSequence += 1;
        return this.revokeEventSequence;
      },
    });
  }

  /** Fan-out validated public event draft; 0 when identity/draft invalid. */
  publishPublicEvent(draftInput: unknown): number {
    const identity = this.getIdentity();
    const draft = parseSdkPublicEventDraft(draftInput);
    if (identity === null || draft === null) {
      return 0;
    }
    return fanoutSdkPublicEvent({
      connections: this.connections.values(),
      identity,
      now: this.now,
      draft,
      sendJson: (c, m) => {
        this.sendJson(c, m);
      },
      getOriginPolicyCapabilities: (origin) =>
        this.getOriginMatrixCapabilities(origin),
    });
  }

  private parseAndDispatch(
    connection: SdkGatewayConnection,
    text: string,
  ): void {
    parseAndDispatchLocalWsSession({
      connection,
      text,
      validateWire: this.validateWire,
      getIdentity: this.getIdentity,
      pairingStore: this.pairingStore,
      pairingApprover: this.pairingApprover,
      getOriginTrustState: this.getOriginTrustState,
      originTrustApprover: this.originTrustApprover,
      onOriginTrustDecision: this.onOriginTrustDecision,
      getOriginMatrixCapabilities: this.getOriginMatrixCapabilities,
      challenges: this.challenges,
      requestDedup: this.requestDedup,
      now: this.now,
      connectionCount: this.connections.size,
      limits: this.limits,
      productSurface: this.getProductSurface(),
      sendJson: (c, m) => {
        this.sendJson(c, m);
      },
      closeConnection: (c, reason) => {
        this.closeConnection(c, reason);
      },
      isSessionExpired: (c) => this.isSessionExpired(c),
      log: (event, fields) => {
        this.log(event, fields);
      },
      ...(this.getPairingPendingTtlMs !== undefined
        ? { getPairingPendingTtlMs: this.getPairingPendingTtlMs }
        : {}),
    });
  }

  private isSessionExpired(connection: SdkGatewayConnection): boolean {
    if (
      connection.authState === "authenticated" &&
      connection.sessionExpiresAtMs !== null &&
      connection.sessionExpiresAtMs <= this.now().getTime()
    ) {
      connection.authState = "unauthenticated";
      connection.grantedCapabilities = [];
      return true;
    }
    return false;
  }

  private sendJson(connection: SdkGatewayConnection, message: WireMessage): void {
    sendSdkGatewayJson({
      connection,
      message,
      maxOutboundQueue: this.limits.maxOutboundQueue,
      closeConnection: (c, reason) => {
        this.closeConnection(c, reason);
      },
    });
  }

  private armIdle(connection: SdkGatewayConnection): void {
    armSdkGatewayIdleTimer({
      connection,
      unauthIdleMs: this.limits.unauthIdleMs,
      closeConnection: (c, reason) => {
        this.closeConnection(c, reason);
      },
    });
  }

  private closeConnection(
    connection: SdkGatewayConnection,
    reason: string,
  ): void {
    closeSdkGatewayConnection({
      connection,
      reason,
      connections: this.connections,
      log: (event, fields) => {
        this.log(event, fields);
      },
    });
  }

  private removeConnection(connection: SdkGatewayConnection): void {
    clearSdkGatewayConnectionTimers(connection);
    this.connections.delete(connection.id);
    const clientId = connection.clientId;
    if (clientId !== null && clientId.length > 0) {
      this.getProductSurface()?.onClientSessionEnded?.(clientId);
    }
    this.onConnectionRemoved?.(connection);
  }

  private log(
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ): void {
    this.onLog?.(event, fields);
  }
}
