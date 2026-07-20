/**
 * Connection registry for loopback WS gateway (DI-03 transport + DI-04 auth).
 */

import type { WireMessage } from "@axatalk/protocol";

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
  buildSdkRevokedEvent,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import { dispatchSdkValidatedMessage } from "./sdkGatewaySessionDispatch.js";
import {
  armSdkGatewayIdleTimer,
  bindSdkGatewaySocketHandlers,
  closeSdkGatewayConnection,
  sendSdkGatewayJson,
  startSdkGatewayHeartbeat,
} from "./sdkGatewaySessionSocket.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";

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
  onLog?: SdkGatewayLogFn;
}>;

export class LocalWsSessionRegistry {
  private readonly connections = new Map<string, SdkGatewayConnection>();
  private readonly limits: SdkGatewayLimits;
  private readonly now: () => Date;
  private readonly validateWire: LocalWsSessionRegistryDeps["validateWire"];
  private readonly getIdentity: () => SdkGatewayIdentity | null;
  private readonly pairingStore: SdkGatewayPairingStore;
  private readonly pairingApprover: SdkPairingApprover;
  private readonly challenges = new SdkAuthChallengeCache();
  private readonly requestDedup = new SdkRequestDedupCache();
  private readonly onLog: SdkGatewayLogFn | undefined;
  private revokeEventSequence = 0;

  constructor(deps: LocalWsSessionRegistryDeps) {
    this.limits = deps.limits;
    this.now = deps.now;
    this.validateWire = deps.validateWire;
    this.getIdentity = deps.getIdentity;
    this.pairingStore = deps.pairingStore;
    this.pairingApprover = deps.pairingApprover;
    this.onLog = deps.onLog;
  }

  get size(): number {
    return this.connections.size;
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
    const ok = await this.pairingStore.revoke(
      clientId,
      this.now().toISOString(),
    );
    if (!ok) {
      return false;
    }
    const identity = this.getIdentity();
    for (const connection of [...this.connections.values()]) {
      if (connection.clientId !== clientId) {
        continue;
      }
      if (identity !== null) {
        this.revokeEventSequence += 1;
        this.sendJson(
          connection,
          buildSdkRevokedEvent({
            identity,
            now: this.now,
            sequence: this.revokeEventSequence,
            reasonCode: "revoked",
          }),
        );
      }
      connection.authState = "revoked";
      this.closeConnection(connection, "revoked");
    }
    this.log("sdk_gateway_client_revoked", { clientId, result: "revoked" });
    return true;
  }

  private parseAndDispatch(
    connection: SdkGatewayConnection,
    text: string,
  ): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      this.closeConnection(connection, "invalid_json");
      return;
    }
    const validated = this.validateWire(parsed);
    if (!validated.success) {
      this.closeConnection(connection, validated.code);
      return;
    }
    void dispatchSdkValidatedMessage({
      connection,
      message: validated.data,
      getIdentity: this.getIdentity,
      pairingStore: this.pairingStore,
      pairingApprover: this.pairingApprover,
      challenges: this.challenges,
      requestDedup: this.requestDedup,
      now: this.now,
      connectionCount: this.connections.size,
      heartbeatSeconds: this.limits.heartbeatSeconds,
      sendJson: (c, m) => {
        this.sendJson(c, m);
      },
      closeConnection: (c, reason) => {
        this.closeConnection(c, reason);
      },
      startHeartbeat: (c) => {
        startSdkGatewayHeartbeat({
          connection: c,
          heartbeatSeconds: this.limits.heartbeatSeconds,
          closeConnection: (conn, reason) => {
            this.closeConnection(conn, reason);
          },
        });
      },
      log: (event, fields) => {
        this.log(event, fields);
      },
      isSessionExpired: (c) => this.isSessionExpired(c),
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
  }

  private log(
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ): void {
    this.onLog?.(event, fields);
  }
}
