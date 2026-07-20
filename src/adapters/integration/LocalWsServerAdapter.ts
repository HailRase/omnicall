/** Real loopback WS ExternalClientGateway (DI-03/DI-04). No snapshot success (DI-05). */

import type { Server as HttpServer } from "node:http";
import {
  validateDiscoveryDocument,
  validateWireMessage,
  type DiscoveryDocument,
  type WireMessage,
} from "@axatalk/protocol";
import type {
  ExternalClientGateway,
  ExternalClientGatewayStatus,
  ExternalGatewayValidationResult,
} from "@ports/integration/ExternalClientGateway.js";
import type { WebSocketServer } from "ws";
import {
  mergeSdkGatewayLimits,
  SDK_GATEWAY_DEFAULT_HOST,
  SDK_GATEWAY_DEFAULT_PORT,
  type SdkGatewayLimits,
} from "./sdkGatewayConfig.js";
import {
  createGatewayIdentityShell,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import { closeHttpServer, type SdkGatewayLogFn } from "./localWsServerHelpers.js";
import { bindLocalWsServer } from "./localWsServerBind.js";
import {
  type LocalWsServerAdapterOptions,
  type LocalWsStartResult,
} from "./localWsServerAdapterTypes.js";
import { LocalWsSessionRegistry } from "./LocalWsSessionRegistry.js";
import { loadSdkOriginAllowlistFromEnv } from "./sdkGatewayOriginPolicy.js";
import { isApprovedLoopbackBindHost } from "./sdkGatewayPeer.js";
import {
  DeferredSdkPairingApprover,
  createAutoApprovePairingApprover,
} from "./sdkGatewayPairingApprover.js";
import { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type {
  SdkPairedClientPublicMeta,
  SdkPairingApprover,
  SdkPairingPendingRequest,
} from "./sdkGatewayPairingTypes.js";

export type {
  LocalWsServerAdapterOptions,
  LocalWsStartResult,
} from "./localWsServerAdapterTypes.js";

export class LocalWsServerAdapter implements ExternalClientGateway {
  private readonly desktopVersion: string;
  private readonly host: string;
  private readonly port: number;
  private readonly enabled: boolean;
  private readonly mayClaimEndpoint: () => boolean;
  private readonly limits: SdkGatewayLimits;
  private readonly now: () => Date;
  private readonly onLog: SdkGatewayLogFn | undefined;
  private readonly allowedOrigins: readonly string[];
  private readonly pairingStore: SdkGatewayPairingStore | null;
  private readonly deferredApprover: DeferredSdkPairingApprover;
  private readonly pairingApprover: SdkPairingApprover;
  private httpServer: HttpServer | null = null;
  private wss: WebSocketServer | null = null;
  private identity: SdkGatewayIdentity | null = null;
  private sessions: LocalWsSessionRegistry | null = null;
  private accepting = true;
  private listening = false;

  constructor(options: LocalWsServerAdapterOptions) {
    this.desktopVersion = options.desktopVersion;
    this.host = options.host ?? SDK_GATEWAY_DEFAULT_HOST;
    this.port = options.port ?? SDK_GATEWAY_DEFAULT_PORT;
    this.enabled = options.enabled ?? true;
    this.mayClaimEndpoint = options.mayClaimEndpoint ?? (() => true);
    this.limits = mergeSdkGatewayLimits(options.limits);
    this.now = options.now ?? (() => new Date());
    this.onLog = options.onLog;
    this.allowedOrigins =
      options.allowedOrigins ?? loadSdkOriginAllowlistFromEnv();
    // Enabled gateways require SecretStoragePort (no insecure in-memory default).
    this.pairingStore =
      options.secretStorage !== undefined
        ? new SdkGatewayPairingStore(options.secretStorage)
        : null;
    this.deferredApprover = new DeferredSdkPairingApprover();
    this.pairingApprover =
      options.pairingApprover ??
      (options.autoApprovePairing === true
        ? createAutoApprovePairingApprover()
        : this.deferredApprover.approver);
  }

  getStatus(): ExternalClientGatewayStatus {
    if (!this.enabled) {
      return "disabled";
    }
    return this.listening ? "listening" : "disabled";
  }

  getBoundAddress(): Readonly<{ host: string; port: number }> | null {
    if (this.httpServer === null) {
      return null;
    }
    const address = this.httpServer.address();
    if (address === null || typeof address === "string") {
      return null;
    }
    return { host: address.address, port: address.port };
  }

  getConnectionCount(): number {
    return this.sessions?.size ?? 0;
  }

  getAllowedOrigins(): readonly string[] {
    return this.allowedOrigins;
  }

  listPendingPairingRequests(): readonly SdkPairingPendingRequest[] {
    return this.deferredApprover.listPending();
  }

  approvePairingRequest(pairingRequestId: string): boolean {
    return this.deferredApprover.approve(pairingRequestId);
  }

  denyPairingRequest(pairingRequestId: string): boolean {
    return this.deferredApprover.deny(pairingRequestId);
  }

  listPairedClients(): Promise<readonly SdkPairedClientPublicMeta[]> {
    if (this.pairingStore === null) {
      return Promise.resolve([]);
    }
    return this.pairingStore.listPublic();
  }

  revokePairedClient(clientId: string): Promise<boolean> {
    if (this.pairingStore === null) {
      return Promise.resolve(false);
    }
    if (this.sessions === null) {
      return this.pairingStore.revoke(clientId, this.now().toISOString());
    }
    return this.sessions.revokeClient(clientId);
  }

  validateWireInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<WireMessage> {
    const result = validateWireMessage(input);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, code: result.code };
  }

  validateDiscoveryInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<DiscoveryDocument> {
    const result = validateDiscoveryDocument(input);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, code: result.code };
  }

  async start(): Promise<LocalWsStartResult> {
    if (!this.enabled) {
      return { ok: false, reason: "disabled" };
    }
    if (this.pairingStore === null) {
      this.log("sdk_gateway_start_denied", { reason: "missing_secret_storage" });
      return { ok: false, reason: "missing_secret_storage" };
    }
    if (!this.accepting) {
      return { ok: false, reason: "shutting_down" };
    }
    if (this.listening) {
      return { ok: false, reason: "already_listening" };
    }
    if (!this.mayClaimEndpoint()) {
      this.log("sdk_gateway_start_denied", { reason: "not_primary_instance" });
      return { ok: false, reason: "not_primary_instance" };
    }
    if (!isApprovedLoopbackBindHost(this.host)) {
      this.log("sdk_gateway_start_denied", { reason: "invalid_bind_host" });
      return { ok: false, reason: "invalid_bind_host" };
    }
    return this.bindAndListen();
  }

  beginAppShutdown(): void {
    this.accepting = false;
    this.log("sdk_gateway_begin_shutdown", {
      connectionCount: this.getConnectionCount(),
    });
  }

  cancelAppShutdown(): void {
    if (this.listening) {
      this.accepting = true;
      this.log("sdk_gateway_cancel_shutdown", { listening: true });
    }
  }

  async stop(): Promise<void> {
    this.accepting = false;
    await this.disposeAll();
    this.log("sdk_gateway_stopped", { listening: false });
  }

  private async bindAndListen(): Promise<LocalWsStartResult> {
    const pairingStore = this.pairingStore;
    if (pairingStore === null) {
      return { ok: false, reason: "missing_secret_storage" };
    }
    const shell = createGatewayIdentityShell(this.desktopVersion);
    this.identity = {
      ...shell,
      maxMessageBytes: this.limits.maxMessageBytes,
      heartbeatSeconds: this.limits.heartbeatSeconds,
    };
    this.sessions = new LocalWsSessionRegistry({
      limits: this.limits,
      now: this.now,
      validateWire: (input) => this.validateWireInbound(input),
      getIdentity: () => this.identity,
      pairingStore,
      pairingApprover: this.pairingApprover,
      ...(this.onLog !== undefined ? { onLog: this.onLog } : {}),
    });

    const bound = await bindLocalWsServer({
      host: this.host,
      port: this.port,
      limits: this.limits,
      identity: this.identity,
      sessions: this.sessions,
      allowedOrigins: this.allowedOrigins,
      getAccepting: () => this.accepting,
      getListening: () => this.listening,
      resolveWsHostPort: () => this.getBoundAddress() ?? {
        host: this.host,
        port: this.port,
      },
      ...(this.onLog !== undefined ? { onLog: this.onLog } : {}),
    });
    if (!bound.ok) {
      this.identity = null;
      this.sessions = null;
      this.log("sdk_gateway_bind_failed", {
        reason: "bind_failed",
        code: bound.code,
      });
      return { ok: false, reason: "bind_failed" };
    }

    this.httpServer = bound.httpServer;
    this.wss = bound.wss;
    this.listening = true;
    return { ok: true, host: bound.host, port: bound.port };
  }

  private async disposeAll(): Promise<void> {
    this.sessions?.terminateAll();
    this.sessions = null;
    const wss = this.wss;
    this.wss = null;
    if (wss !== null) {
      await new Promise<void>((resolve) => {
        wss.close(() => {
          resolve();
        });
      });
    }
    const httpServer = this.httpServer;
    this.httpServer = null;
    this.listening = false;
    this.identity = null;
    if (httpServer !== null) {
      await closeHttpServer(httpServer);
    }
  }

  private log(
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ): void {
    this.onLog?.(event, fields);
  }
}
