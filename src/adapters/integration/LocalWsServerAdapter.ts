/**
 * Real loopback WebSocket ExternalClientGateway (DI-03 / ADR-0009/0010/0015).
 * Handshake + discovery only — no product snapshot/command execution.
 */

import { createServer, type Server as HttpServer } from "node:http";

import {
  DISCOVERY_PATH,
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
import { WebSocketServer } from "ws";

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
import {
  closeHttpServer,
  errorCode,
  listenHttp,
  type SdkGatewayLogFn,
} from "./localWsServerHelpers.js";
import {
  serveSdkDiscoveryHttp,
  tryAcceptSdkUpgrade,
} from "./localWsServerUpgrade.js";
import { LocalWsSessionRegistry } from "./LocalWsSessionRegistry.js";
import { isApprovedLoopbackBindHost } from "./sdkGatewayPeer.js";

export type LocalWsStartResult =
  | { readonly ok: true; readonly host: string; readonly port: number }
  | {
      readonly ok: false;
      readonly reason:
        | "disabled"
        | "not_primary_instance"
        | "invalid_bind_host"
        | "bind_failed"
        | "already_listening"
        | "shutting_down";
    };

export type LocalWsServerAdapterOptions = Readonly<{
  desktopVersion: string;
  host?: string;
  port?: number;
  enabled?: boolean;
  mayClaimEndpoint?: () => boolean;
  limits?: Partial<SdkGatewayLimits>;
  now?: () => Date;
  onLog?: SdkGatewayLogFn;
}>;

export class LocalWsServerAdapter implements ExternalClientGateway {
  private readonly desktopVersion: string;
  private readonly host: string;
  private readonly port: number;
  private readonly enabled: boolean;
  private readonly mayClaimEndpoint: () => boolean;
  private readonly limits: SdkGatewayLimits;
  private readonly now: () => Date;
  private readonly onLog: SdkGatewayLogFn | undefined;
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

  validateWireInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<WireMessage> {
    const result = validateWireMessage(input);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, code: result.code };
  }

  validateDiscoveryInbound(
    input: unknown,
  ): ExternalGatewayValidationResult<DiscoveryDocument> {
    const result = validateDiscoveryDocument(input);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, code: result.code };
  }

  async start(): Promise<LocalWsStartResult> {
    if (!this.enabled) {
      return { ok: false, reason: "disabled" };
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
      ...(this.onLog !== undefined ? { onLog: this.onLog } : {}),
    });

    const httpServer = createServer((req, res) => {
      const bound = this.getBoundAddress();
      serveSdkDiscoveryHttp({
        req,
        res,
        identity: this.identity,
        wsHost: bound?.host ?? this.host,
        wsPort: bound?.port ?? this.port,
      });
    });
    const wss = new WebSocketServer({
      noServer: true,
      maxPayload: this.limits.maxMessageBytes,
      clientTracking: false,
    });
    httpServer.on("upgrade", (req, socket, head) => {
      if (this.sessions === null) {
        socket.destroy();
        return;
      }
      tryAcceptSdkUpgrade({
        req,
        socket,
        head,
        wss,
        accepting: this.accepting,
        listening: this.listening,
        connectionCount: this.sessions.size,
        maxConnections: this.limits.maxConnections,
        onAttach: (ws) => {
          this.sessions?.attach(ws);
        },
        ...(this.onLog !== undefined ? { onLog: this.onLog } : {}),
      });
    });

    try {
      await listenHttp(httpServer, this.host, this.port);
    } catch (error: unknown) {
      httpServer.close();
      this.identity = null;
      this.sessions = null;
      this.log("sdk_gateway_bind_failed", {
        reason: "bind_failed",
        code: errorCode(error),
      });
      return { ok: false, reason: "bind_failed" };
    }

    this.httpServer = httpServer;
    this.wss = wss;
    this.listening = true;
    const bound = this.getBoundAddress();
    this.log("sdk_gateway_listening", {
      host: bound?.host ?? this.host,
      port: bound?.port ?? this.port,
      discoveryPath: DISCOVERY_PATH,
    });
    return {
      ok: true,
      host: bound?.host ?? this.host,
      port: bound?.port ?? this.port,
    };
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
