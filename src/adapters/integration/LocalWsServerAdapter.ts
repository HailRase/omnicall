/** Real loopback WS ExternalClientGateway (DI-03…DI-05, DI-11). */

import type { Server as HttpServer } from "node:http";
import {
  validateDiscoveryDocument,
  validateWireMessage,
  type CapabilityId,
  type DiscoveryDocument,
  type WireMessage,
} from "@axata/axatalk-protocol";
import type {
  ExternalClientGateway,
  ExternalClientGatewayStatus,
  ExternalGatewayValidationResult,
} from "@ports/integration/ExternalClientGateway.js";
import type { WebSocketServer } from "ws";
import {
  listEnabledMatrixCapabilities,
  withMatrixCapability,
  type SdkOriginTrustEntry,
} from "@domain/index.js";
import {
  mergeSdkGatewayLimits,
  SDK_GATEWAY_DEFAULT_HOST,
  SDK_GATEWAY_DEFAULT_PORT,
  type SdkGatewayLimits,
} from "./sdkGatewayConfig.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";
import {
  type LocalWsServerAdapterOptions,
  type LocalWsStartResult,
} from "./localWsServerAdapterTypes.js";
import { LocalWsSessionRegistry } from "./LocalWsSessionRegistry.js";
import {
  bindLocalWsListening,
  disposeLocalWsListening,
} from "./localWsServerLifecycle.js";
import {
  loadSdkOriginAllowlistFromEnv,
  trustEntriesFromAllowlist,
} from "./sdkGatewayOriginPolicy.js";
import { applySdkOriginTrustDecision } from "./sdkGatewayOriginTrustAdapterState.js";
import {
  createAutoAllowOriginTrustApprover,
  DeferredSdkOriginTrustApprover,
  type SdkOriginTrustApprover,
  type SdkOriginTrustDecision,
  type SdkOriginTrustPending,
} from "./sdkGatewayOriginTrustApprover.js";
import { isApprovedLoopbackBindHost } from "./sdkGatewayPeer.js";
import {
  DeferredSdkPairingApprover,
  createAutoApprovePairingApprover,
} from "./sdkGatewayPairingApprover.js";
import { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import type {
  SdkPairedClientPublicMeta,
  SdkPairingApprover,
  SdkPairingPendingRequest,
} from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayDiagnosticsProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import {
  normalizeSdkOperatorModalTimeouts,
  SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS,
  SDK_ORIGIN_TRUST_PENDING_TTL_MS,
  SDK_PENDING_SWEEP_INTERVAL_MS,
  type SdkOperatorModalTimeouts,
} from "@shared/integration/sdkOperatorModalTimeouts.js";

export type {
  LocalWsServerAdapterOptions,
  LocalWsStartResult,
} from "./localWsServerAdapterTypes.js";

export {
  SDK_ORIGIN_TRUST_PENDING_TTL_MS,
  SDK_PENDING_SWEEP_INTERVAL_MS,
};

function resolveInitialOriginTrustEntries(
  options: LocalWsServerAdapterOptions,
): SdkOriginTrustEntry[] {
  if (options.originTrustEntries !== undefined) {
    return [...options.originTrustEntries];
  }
  const allowlist =
    options.allowedOrigins ?? loadSdkOriginAllowlistFromEnv();
  return [...trustEntriesFromAllowlist(allowlist)];
}

export class LocalWsServerAdapter implements ExternalClientGateway {
  private readonly desktopVersion: string;
  private readonly host: string;
  private readonly port: number;
  private readonly enabled: boolean;
  private readonly mayClaimEndpoint: () => boolean;
  private readonly limits: SdkGatewayLimits;
  private readonly now: () => Date;
  private readonly onLog: SdkGatewayLogFn | undefined;
  private originTrustEntries: SdkOriginTrustEntry[];
  private readonly onOriginTrustChanged:
    | ((entries: readonly SdkOriginTrustEntry[]) => void)
    | undefined;
  private readonly pairingStore: SdkGatewayPairingStore | null;
  private readonly deferredApprover: DeferredSdkPairingApprover;
  private readonly pairingApprover: SdkPairingApprover;
  private readonly deferredOriginTrustApprover: DeferredSdkOriginTrustApprover;
  private readonly originTrustApprover: SdkOriginTrustApprover;
  private productSurface: SdkGatewayProductSurface | null;
  private httpServer: HttpServer | null = null;
  private wss: WebSocketServer | null = null;
  private sessions: LocalWsSessionRegistry | null = null;
  private accepting = true;
  private listening = false;
  private lastErrorCode: string | null = null;
  private pendingSweepTimer: ReturnType<typeof setInterval> | null = null;
  private operatorModalTimeouts: SdkOperatorModalTimeouts = {
    ...SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS,
  };

  constructor(options: LocalWsServerAdapterOptions) {
    this.desktopVersion = options.desktopVersion;
    this.host = options.host ?? SDK_GATEWAY_DEFAULT_HOST;
    this.port = options.port ?? SDK_GATEWAY_DEFAULT_PORT;
    this.enabled = options.enabled ?? true;
    this.mayClaimEndpoint = options.mayClaimEndpoint ?? (() => true);
    this.limits = mergeSdkGatewayLimits(options.limits);
    this.now = options.now ?? (() => new Date());
    this.onLog = options.onLog;
    this.originTrustEntries = resolveInitialOriginTrustEntries(options);
    // Fortress / auto-approve harness: elevate activate in matrix so DI-08 grant
    // path remains testable; product TOFU Allow still defaults activate off.
    if (options.autoApprovePairing === true) {
      this.originTrustEntries = this.originTrustEntries.map((entry) => {
        if (entry.state !== "allowed" || entry.matrix === null) {
          return entry;
        }
        return {
          ...entry,
          matrix: withMatrixCapability(
            entry.matrix,
            "account.activate",
            true,
          ),
        };
      });
    }
    this.onOriginTrustChanged = options.onOriginTrustChanged;
    this.pairingStore =
      options.secretStorage !== undefined
        ? new SdkGatewayPairingStore(options.secretStorage)
        : null;
    this.deferredApprover = new DeferredSdkPairingApprover(
      options.autoApprovePairing === true || options.pairingApprover !== undefined
        ? undefined
        : options.onPairingPending !== undefined
          ? { onPending: options.onPairingPending }
          : undefined,
    );
    this.pairingApprover =
      options.pairingApprover ??
      (options.autoApprovePairing === true
        ? createAutoApprovePairingApprover()
        : this.deferredApprover.approver);
    const autoAllowOrigin =
      options.autoAllowOriginTrust === true ||
      options.autoApprovePairing === true;
    this.deferredOriginTrustApprover = new DeferredSdkOriginTrustApprover(
      autoAllowOrigin || options.originTrustApprover !== undefined
        ? undefined
        : options.onOriginTrustPending !== undefined
          ? { onPending: options.onOriginTrustPending }
          : undefined,
    );
    this.originTrustApprover =
      options.originTrustApprover ??
      (autoAllowOrigin
        ? createAutoAllowOriginTrustApprover()
        : this.deferredOriginTrustApprover.approver);
    this.productSurface = options.productSurface ?? null;
  }

  setProductSurface(surface: SdkGatewayProductSurface | null): void {
    this.productSurface = surface;
  }

  publishPublicEvent(draft: unknown): number {
    return this.sessions?.publishPublicEvent(draft) ?? 0;
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
    return this.originTrustEntries
      .filter((entry) => entry.state === "allowed")
      .map((entry) => entry.origin);
  }

  getOriginTrustEntries(): readonly SdkOriginTrustEntry[] {
    return this.originTrustEntries;
  }

  setOriginTrustEntries(entries: readonly SdkOriginTrustEntry[]): void {
    const previous = this.originTrustEntries;
    this.originTrustEntries = [...entries];
    this.onOriginTrustChanged?.(this.originTrustEntries);
    this.enforceOriginTrustPolicySideEffects(previous, this.originTrustEntries);
    for (const entry of this.originTrustEntries) {
      if (entry.state !== "allowed") {
        continue;
      }
      this.sessions?.syncActivateCapabilitiesForOrigin(
        entry.origin,
        this.getOriginMatrixCapabilities(entry.origin),
      );
    }
  }

  /**
   * When an Origin leaves `allowed` (remove or blacklist), deny pending pairing
   * and close live sockets. Does not revoke durable paired clients.
   */
  private enforceOriginTrustPolicySideEffects(
    previous: readonly SdkOriginTrustEntry[],
    next: readonly SdkOriginTrustEntry[],
  ): void {
    const nextByOrigin = new Map(next.map((row) => [row.origin, row]));
    for (const row of previous) {
      if (row.state !== "allowed") {
        continue;
      }
      const updated = nextByOrigin.get(row.origin);
      if (updated !== undefined && updated.state === "allowed") {
        continue;
      }
      const deniedPairing = this.deferredApprover.denyByOrigin(row.origin);
      const closed =
        this.sessions?.closeConnectionsForOrigin(
          row.origin,
          updated?.state === "denied" ? "origin_blacklisted" : "origin_removed",
        ) ?? 0;
      this.log("sdk_gateway_origin_policy_enforced", {
        origin: row.origin,
        deniedPairing,
        closedConnections: closed,
        nextState: updated?.state ?? "absent",
      });
    }
  }

  /** Cancel orphaned ceremony waiters when a socket leaves the registry. */
  private handleConnectionRemoved(connection: {
    readonly id: string;
    readonly origin: string;
  }): void {
    const deniedPairing = this.deferredApprover.denyByConnectionId(connection.id);
    const remaining =
      this.sessions?.countConnectionsForOrigin(connection.origin) ?? 0;
    let cancelledTrust = false;
    if (remaining === 0) {
      cancelledTrust = this.deferredOriginTrustApprover.cancelByOrigin(
        connection.origin,
      );
    }
    if (deniedPairing > 0 || cancelledTrust) {
      this.log("sdk_gateway_pending_cancelled_on_disconnect", {
        origin: connection.origin,
        deniedPairing,
        cancelledTrust,
      });
    }
  }

  private startPendingSweep(): void {
    this.stopPendingSweep();
    this.pendingSweepTimer = setInterval(() => {
      this.sweepExpiredPending();
    }, SDK_PENDING_SWEEP_INTERVAL_MS);
    this.pendingSweepTimer.unref?.();
  }

  private stopPendingSweep(): void {
    if (this.pendingSweepTimer !== null) {
      clearInterval(this.pendingSweepTimer);
      this.pendingSweepTimer = null;
    }
  }

  setOperatorModalTimeouts(timeouts: SdkOperatorModalTimeouts): void {
    this.operatorModalTimeouts = normalizeSdkOperatorModalTimeouts(timeouts);
  }

  getOperatorModalTimeouts(): SdkOperatorModalTimeouts {
    return this.operatorModalTimeouts;
  }

  private sweepExpiredPending(): void {
    const nowMs = this.now().getTime();
    const deniedPairing = this.deferredApprover.denyExpired(nowMs);
    const cancelledTrust = this.deferredOriginTrustApprover.cancelExpired(
      nowMs,
      this.operatorModalTimeouts.originTrustTtlMs,
    );
    if (deniedPairing > 0 || cancelledTrust > 0) {
      this.log("sdk_gateway_pending_sweep", {
        deniedPairing,
        cancelledTrust,
      });
    }
  }

  listPendingOriginTrust(): readonly SdkOriginTrustPending[] {
    return this.deferredOriginTrustApprover.listPending();
  }

  allowOriginTrust(originTrustRequestId: string): boolean {
    return this.deferredOriginTrustApprover.allow(originTrustRequestId);
  }

  denyOriginTrust(originTrustRequestId: string): boolean {
    return this.deferredOriginTrustApprover.deny(originTrustRequestId);
  }

  /** TTL / disconnect path — cancel without blacklisting Origin. */
  cancelOriginTrust(originTrustRequestId: string): boolean {
    return this.deferredOriginTrustApprover.cancel(originTrustRequestId);
  }

  /**
   * Allowlisted operational diagnostics for Settings UX (DI-09).
   * Never includes payloads, secrets, or public keys.
   */
  getDiagnosticsSnapshot(
    pairedClientCount = 0,
  ): SdkGatewayDiagnosticsProjection {
    const authCounts = this.sessions?.countByAuthState() ?? {
      authenticated: 0,
      unauthenticated: 0,
      authenticating: 0,
      revoked: 0,
    };
    const bound = this.getBoundAddress();
    const status = this.getStatus() === "listening" ? "listening" : "disabled";
    return {
      status,
      bindHost: bound?.host ?? null,
      bindPort: bound?.port ?? null,
      connectionCount: this.getConnectionCount(),
      authenticatedCount: authCounts.authenticated,
      unauthenticatedCount: authCounts.unauthenticated + authCounts.authenticating,
      pendingPairingCount: this.listPendingPairingRequests().length,
      pairedClientCount,
      allowedOriginsCount: this.getAllowedOrigins().length,
      lastErrorCode: this.lastErrorCode,
      windowHideAvailable: false,
    };
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
      return this.pairingStore.revoke(clientId);
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
      this.lastErrorCode = null;
      return { ok: false, reason: "disabled" };
    }
    if (this.pairingStore === null) {
      this.lastErrorCode = "missing_secret_storage";
      this.log("sdk_gateway_start_denied", { reason: "missing_secret_storage" });
      return { ok: false, reason: "missing_secret_storage" };
    }
    if (!this.accepting) {
      this.lastErrorCode = "shutting_down";
      return { ok: false, reason: "shutting_down" };
    }
    if (this.listening) {
      return { ok: false, reason: "already_listening" };
    }
    if (!this.mayClaimEndpoint()) {
      this.lastErrorCode = "not_primary_instance";
      this.log("sdk_gateway_start_denied", { reason: "not_primary_instance" });
      return { ok: false, reason: "not_primary_instance" };
    }
    if (!isApprovedLoopbackBindHost(this.host)) {
      this.lastErrorCode = "invalid_bind_host";
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

  private persistOriginTrustMutation(
    input: Readonly<{
      origin: string;
      decision: SdkOriginTrustDecision;
    }>,
  ): void {
    if (input.decision.decision === "cancel") {
      return;
    }
    const next = applySdkOriginTrustDecision(this.originTrustEntries, input);
    this.setOriginTrustEntries(next);
  }

  private getOriginMatrixCapabilities(origin: string): readonly CapabilityId[] {
    const entry = this.originTrustEntries.find((row) => row.origin === origin);
    if (entry?.state !== "allowed" || entry.matrix === null) {
      return [];
    }
    return listEnabledMatrixCapabilities(entry.matrix);
  }

  private async bindAndListen(): Promise<LocalWsStartResult> {
    const pairingStore = this.pairingStore;
    if (pairingStore === null) {
      return { ok: false, reason: "missing_secret_storage" };
    }
    const bound = await bindLocalWsListening({
      desktopVersion: this.desktopVersion,
      host: this.host,
      port: this.port,
      limits: this.limits,
      pairingStore,
      pairingApprover: this.pairingApprover,
      getOriginTrustEntries: () => this.originTrustEntries,
      originTrustApprover: this.originTrustApprover,
      onOriginTrustDecision: (decision) => {
        this.persistOriginTrustMutation(decision);
      },
      getOriginMatrixCapabilities: (origin) =>
        this.getOriginMatrixCapabilities(origin),
      getPairingPendingTtlMs: () => this.operatorModalTimeouts.pairingTtlMs,
      getAccepting: () => this.accepting,
      getListening: () => this.listening,
      resolveWsHostPort: () =>
        this.getBoundAddress() ?? { host: this.host, port: this.port },
      getProductSurface: () => this.productSurface,
      validateWireInbound: (value) => this.validateWireInbound(value),
      now: this.now,
      onConnectionRemoved: (connection) => {
        this.handleConnectionRemoved(connection);
      },
      ...(this.onLog !== undefined ? { onLog: this.onLog } : {}),
    });
    if (!bound.ok) {
      this.lastErrorCode = bound.code;
      this.log("sdk_gateway_bind_failed", {
        reason: "bind_failed",
        code: bound.code,
      });
      return { ok: false, reason: "bind_failed" };
    }
    this.sessions = bound.sessions;
    this.httpServer = bound.httpServer;
    this.wss = bound.wss;
    this.listening = true;
    this.lastErrorCode = null;
    this.startPendingSweep();
    return { ok: true, host: bound.host, port: bound.port };
  }

  private async disposeAll(): Promise<void> {
    this.stopPendingSweep();
    await disposeLocalWsListening({
      sessions: this.sessions,
      wss: this.wss,
      httpServer: this.httpServer,
    });
    this.sessions = null;
    this.wss = null;
    this.httpServer = null;
    this.listening = false;
  }

  private log(
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ): void {
    this.onLog?.(event, fields);
  }
}
