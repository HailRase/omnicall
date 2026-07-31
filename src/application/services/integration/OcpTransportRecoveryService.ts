/**
 * - Purpose: Application-owned OCP transport recovery after unexpected socket drop.
 * - Inputs: gateway failed/disconnected while session was live; fresh-token reconnect callback.
 * - Outputs: capped cancelable reconnect attempts with reconnecting projection (no stale token).
 *
 * ADR-AF-002: adapter must not schedule reconnect; this service owns the policy.
 * Progress during auto-recovery is `uiSurface: "silent"` (banner only — not the sign-in Dialog).
 */

import type { Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { ReconnectScheduler } from "@shared/scheduling/ReconnectScheduler.js";
import type { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import {
  clearAuthorizationProgress,
  withAuthorizationProgressUiSurface,
} from "../../projections/settings/authorizationProgressProjection.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";
const DEFAULT_RECONNECT_DELAY_MS = 5_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 6;

const INTENTIONAL_CONNECT_CANCEL_REASONS = new Set([
  "fresh_token_connect",
  "sign_in_supersede",
]);

export type OcpTransportRecoveryDeps = Readonly<{
  ocpGateway: OcpGateway;
  projectionHub: OcpProjectionHub;
  /** Must acquire a fresh HTTP token and open a new socket (never reuse stale token). */
  recoverWithFreshToken: (
    correlationId: CorrelationId,
  ) => Promise<Result<void, PlatformError>>;
  logger: Logger;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  /** When false, unexpected drops do not auto-recover (manual Retry server only). */
  enabled?: boolean;
}>;

export class OcpTransportRecoveryService {
  private readonly unsubscribers: Array<() => void> = [];
  private readonly scheduler = new ReconnectScheduler();
  private readonly reconnectDelayMs: number;
  private readonly maxReconnectAttempts: number;
  private readonly enabled: boolean;
  private reconnectAttempts = 0;
  private wasLive = false;
  private recovering = false;
  private disposed = false;
  /**
   * True while `recoverWithFreshToken` is running. Intentional close reasons must
   * disarm drops without wiping the attempt budget (otherwise retries never cap).
   */
  private recoveryConnectInFlight = false;
  /**
   * When true, ignore disconnected/failed (intentional logout / Reconnect / fresh-token connect).
   * Cleared when a new socket reaches connecting|connected.
   * Prevents double `/proxy/authenticate` when async WS close races progress hub notifies.
   */
  private ignoreTransportDrops = false;

  constructor(private readonly deps: OcpTransportRecoveryDeps) {
    this.reconnectDelayMs = deps.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
    this.maxReconnectAttempts =
      deps.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    this.enabled = deps.enabled !== false;

    this.unsubscribers.push(
      deps.ocpGateway.onConnectionStateChange((state) => {
        this.onServerState(state);
      }),
    );
    this.unsubscribers.push(
      deps.projectionHub.subscribe(() => {
        const session = deps.projectionHub.getSessionProjection();
        // Only arm unexpected-drop recovery for a live authorized+connected session.
        // Progress updates during intentional reconnect must not re-arm wasLive.
        if (
          !this.ignoreTransportDrops &&
          session.authorizationState.phase === "authorized" &&
          session.serverState === "connected"
        ) {
          this.wasLive = true;
        }
        if (session.connectionState === "sessionClosed") {
          this.cancelAll("terminal_session_closed");
          this.wasLive = false;
        }
      }),
    );
  }

  dispose(): void {
    this.disposed = true;
    this.cancelAll("dispose");
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;
    this.scheduler.dispose();
  }

  /**
   * Cancel pending recovery (logout / terminate / superseding user sign-in / Reconnect).
   * Clears wasLive and ignores further transport drops until the next connecting|connected.
   *
   * When called from an in-flight recovery connect (`fresh_token_connect` /
   * `sign_in_supersede`), only disarms drop handling — attempt counter is preserved.
   */
  cancelAll(reason: string): void {
    if (
      this.recoveryConnectInFlight &&
      INTENTIONAL_CONNECT_CANCEL_REASONS.has(reason)
    ) {
      this.disarmForIntentionalConnect(reason);
      return;
    }

    this.scheduler.cancelAll();
    this.recovering = false;
    this.reconnectAttempts = 0;
    this.wasLive = false;
    this.ignoreTransportDrops = true;
    this.deps.projectionHub.clearTransportRecovery();
    this.deps.logger.info("ocp_transport_recovery_cancelled", {
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_transport_recovery",
      result: reason,
    });
  }

  /**
   * Re-arm live-session tracking after a failed intentional logout that left
   * the operator authorized on an open socket.
   */
  restoreLiveTrackingIfAuthorized(): void {
    const session = this.deps.projectionHub.getSessionProjection();
    if (session.authorizationState.phase === "authorized") {
      this.ignoreTransportDrops = false;
      this.wasLive = true;
    }
  }

  private disarmForIntentionalConnect(reason: string): void {
    this.scheduler.cancelAll();
    this.ignoreTransportDrops = true;
    this.wasLive = false;
    this.deps.logger.info("ocp_transport_recovery_disarmed_for_connect", {
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_transport_recovery",
      result: reason,
      attempt: this.reconnectAttempts,
    });
  }

  private seedSilentProgress(): void {
    this.deps.projectionHub.setAuthorizationProgress(
      withAuthorizationProgressUiSurface(
        clearAuthorizationProgress(),
        "silent",
      ),
    );
  }

  private clearSilentProgress(): void {
    this.deps.projectionHub.setAuthorizationProgress(
      withAuthorizationProgressUiSurface(
        clearAuthorizationProgress(),
        "silent",
      ),
    );
  }

  private onServerState(state: OcpServerState): void {
    if (this.disposed || !this.enabled) {
      return;
    }

    if (state === "connected" || state === "connecting") {
      // New intentional (or recovery) socket — resume unexpected-drop tracking.
      this.ignoreTransportDrops = false;
      // During in-flight recovery, a brief WS `connected` must not reset the
      // attempt budget or clear the banner (auth/HTTP may still fail next).
      if (
        state === "connected" &&
        !this.recovering &&
        !this.recoveryConnectInFlight
      ) {
        this.reconnectAttempts = 0;
        this.scheduler.cancelAll();
      }
      return;
    }

    if (state !== "failed" && state !== "disconnected") {
      return;
    }

    if (this.ignoreTransportDrops || !this.wasLive || this.recovering) {
      return;
    }

    const session = this.deps.projectionHub.getSessionProjection();
    if (session.connectionState === "sessionClosed") {
      return;
    }

    this.scheduleRecovery();
  }

  private scheduleRecovery(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.deps.logger.warn("ocp_transport_recovery_exhausted", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_transport_recovery",
        result: "failed",
        attempt: this.reconnectAttempts,
      });
      this.wasLive = false;
      this.deps.projectionHub.markTransportRecoveryExhausted();
      this.clearSilentProgress();
      return;
    }

    this.recovering = true;
    this.reconnectAttempts += 1;
    const attemptId = createCorrelationId();
    // Keeps banner visible across disconnect→HTTP→connect; silent progress (no Dialog).
    this.deps.projectionHub.beginTransportRecoveryAttempt(
      attemptId,
      this.reconnectAttempts,
    );
    this.seedSilentProgress();

    this.deps.logger.info("ocp_transport_recovery_scheduled", {
      correlationId: attemptId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_transport_recovery",
      result: "scheduled",
      attempt: this.reconnectAttempts,
    });

    this.scheduler.schedule(this.reconnectDelayMs, () => {
      void this.runRecovery(attemptId);
    });
  }

  private async runRecovery(attemptId: CorrelationId): Promise<void> {
    if (this.disposed) {
      return;
    }
    if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
      this.recovering = false;
      return;
    }

    this.seedSilentProgress();
    this.recoveryConnectInFlight = true;
    try {
      const result = await this.deps.recoverWithFreshToken(attemptId);
      this.deps.logger.info("ocp_transport_recovery_completed", {
        correlationId: attemptId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_transport_recovery",
        result: result.ok ? "succeeded" : result.error.message,
        attempt: this.reconnectAttempts,
      });
      if (result.ok) {
        this.reconnectAttempts = 0;
        this.recovering = false;
        this.deps.projectionHub.clearTransportRecovery();
        this.clearSilentProgress();
        return;
      }
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.recovering = false;
        this.scheduleRecovery();
        return;
      }
      this.recovering = false;
      this.wasLive = false;
      this.deps.projectionHub.markTransportRecoveryExhausted();
      this.clearSilentProgress();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown_error";
      this.deps.logger.error("ocp_transport_recovery_threw", {
        correlationId: attemptId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_transport_recovery",
        result: message,
      });
      this.recovering = false;
      this.wasLive = false;
      this.deps.projectionHub.markTransportRecoveryExhausted();
      this.clearSilentProgress();
    } finally {
      this.recoveryConnectInFlight = false;
    }
  }
}
