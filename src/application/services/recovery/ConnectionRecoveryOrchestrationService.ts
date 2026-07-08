import type { DomainEvent } from "@domain/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectAttemptStartedEvent,
  createOcpReconnectFailedEvent,
  createOcpReconnectScheduledEvent,
  createOcpReconnectSucceededEvent,
} from "@domain/operator/events/ocpRecoveryEvents.js";
import {
  OCP_RECONNECT_POLICY_CONFIG,
  isTerminalReconnectFailure,
  planReconnectAttempt,
  type RandomSource,
  type ReconnectPolicyConfig,
} from "@domain/shared/recovery/ReconnectPolicy.js";
import { createManualReconnectRequestedEvent } from "@domain/shared/recovery/manualRecoveryEvents.js";
import type {
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";
import {
  ReconnectScheduler,
  type TimerHandle,
} from "../../infrastructure/ReconnectScheduler.js";

const FEATURE_ID = "F-014";

type OcpRecoverySession = Readonly<{
  correlationId: CorrelationId;
  nextAttemptNumber: number;
  timerHandle: TimerHandle | null;
}>;

export type ConnectionRecoveryOrchestrationDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  operatorGateway: OperatorPlatformGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  scheduler?: ReconnectScheduler;
  random?: RandomSource;
  ocpPolicy?: ReconnectPolicyConfig;
}>;

/**
 * - Purpose: orchestrate OCP WebSocket reconnect only; SIP path is SipRecoveryOrchestrationService.
 * - Inputs: OCP transport disconnect, startup mode.
 * - Outputs: OCP recovery domain events; operator gateway reconnect calls.
 */
export class ConnectionRecoveryOrchestrationService {
  private readonly scheduler: ReconnectScheduler;
  private readonly random: RandomSource;
  private readonly ocpPolicy: ReconnectPolicyConfig;
  private ocpModeEnabled = false;
  private ocpSession: OcpRecoverySession | null = null;
  private readonly transportUnsubscribers: Array<() => void> = [];

  constructor(private readonly deps: ConnectionRecoveryOrchestrationDeps) {
    void deps.telephonyGateway;
    this.scheduler = deps.scheduler ?? new ReconnectScheduler();
    this.random = deps.random ?? (() => 0.5);
    this.ocpPolicy = deps.ocpPolicy ?? OCP_RECONNECT_POLICY_CONFIG;
  }

  bindTransportHandlers(): void {
    this.transportUnsubscribers.push(
      this.deps.operatorGateway.setTransportDisconnectedHandler((notification) => {
        this.handleOcpTransportDisconnected(notification.correlationId, notification.reason);
        return Promise.resolve();
      }),
    );
  }

  subscribe(eventPublisher: DomainEventPublisher): void {
    eventPublisher.subscribe((event) => {
      this.handleDomainEvent(event);
    });
  }

  applyRecoverySettings(): void {
    // OCP reconnect policy is fixed (LF-058); SIP settings live in SipRecoveryOrchestrationService.
  }

  dispose(): void {
    for (const unsubscribe of this.transportUnsubscribers) {
      unsubscribe();
    }
    this.transportUnsubscribers.length = 0;
    this.clearOcpSession();
    this.scheduler.dispose();
  }

  getScheduler(): ReconnectScheduler {
    return this.scheduler;
  }

  async requestManualRetry(
    channel: "ocp" | "both",
    correlationId: CorrelationId,
  ): Promise<void> {
    if (channel === "both") {
      if (!this.ocpModeEnabled) {
        return;
      }
      await this.requestManualOcpRetry(correlationId);
      return;
    }

    if (!this.ocpModeEnabled) {
      return;
    }

    await this.requestManualOcpRetry(correlationId);
  }

  private async requestManualOcpRetry(correlationId: CorrelationId): Promise<void> {
    this.clearOcpSession();

    this.deps.eventPublisher.publish(
      createManualReconnectRequestedEvent(correlationId, { channel: "ocp" }),
    );

    this.deps.logger.info("manual_reconnect_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Operator",
      operation: "manual_reconnect_requested",
      channel: "ocp",
      attemptNumber: 1,
    });

    this.ocpSession = {
      correlationId,
      nextAttemptNumber: 1,
      timerHandle: null,
    };

    await this.executeOcpAttempt(1);
  }

  private handleDomainEvent(event: DomainEvent): void {
    switch (event.type) {
      case "StartupModeResolved": {
        const resolution = event["resolution"];
        if (
          resolution !== undefined &&
          typeof resolution === "object" &&
          resolution !== null &&
          "action" in resolution &&
          resolution.action === "sip_only_ready"
        ) {
          this.ocpModeEnabled = false;
          this.clearOcpSession();
        } else {
          this.ocpModeEnabled = true;
        }
        return;
      }
      case "OcpAuthenticationSucceeded":
        this.ocpModeEnabled = true;
        return;
      case "ServerTerminateReceived":
        this.clearOcpSession();
        this.scheduler.cancelAll();
        return;
      default:
        return;
    }
  }

  private handleOcpTransportDisconnected(
    correlationId: CorrelationId,
    reason: string,
  ): void {
    if (!this.ocpModeEnabled) {
      return;
    }

    if (this.ocpSession !== null) {
      this.deps.logger.warn("ocp_transport_disconnect_deduplicated", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Operator",
        operation: "ocp_transport_disconnect_deduplicated",
        reason,
      });
      return;
    }

    this.ocpSession = {
      correlationId,
      nextAttemptNumber: 1,
      timerHandle: null,
    };

    this.deps.eventPublisher.publish(
      createOcpDisconnectedEvent(correlationId, {
        reason: mapOcpDisconnectReason(reason),
        message: reason,
      }),
    );

    this.deps.logger.warn("ocp_transport_disconnected", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Operator",
      operation: "ocp_transport_disconnected",
      reason,
    });

    this.scheduleNextOcpAttempt();
  }

  private scheduleNextOcpAttempt(): void {
    const session = this.ocpSession;
    if (session === null) {
      return;
    }

    const plan = planReconnectAttempt(session.nextAttemptNumber, this.ocpPolicy, this.random);
    if (plan === null) {
      this.deps.eventPublisher.publish(
        createOcpReconnectFailedEvent(session.correlationId, {
          attemptNumber: session.nextAttemptNumber,
          reason: "ocp_reconnect_exhausted",
          isTerminal: true,
        }),
      );
      this.clearOcpSession();
      return;
    }

    this.deps.eventPublisher.publish(
      createOcpReconnectScheduledEvent(session.correlationId, {
        attemptNumber: plan.attemptNumber,
        delayMs: plan.delayMs,
      }),
    );

    const timerHandle = this.scheduler.schedule(plan.delayMs, () => {
      void this.executeOcpAttempt(plan.attemptNumber);
    });

    this.ocpSession = { ...session, timerHandle };
  }

  private async executeOcpAttempt(attemptNumber: number): Promise<void> {
    const session = this.ocpSession;
    if (session === null || session.nextAttemptNumber !== attemptNumber) {
      return;
    }

    this.ocpSession = { ...session, timerHandle: null };

    this.deps.eventPublisher.publish(
      createOcpReconnectAttemptStartedEvent(session.correlationId, { attemptNumber }),
    );

    const gatewayResult = await this.deps.operatorGateway.reconnectTransport(
      session.correlationId,
    );

    if (!isErr(gatewayResult)) {
      this.deps.eventPublisher.publish(
        createOcpReconnectSucceededEvent(session.correlationId, { attemptNumber }),
      );
      this.clearOcpSession();
      return;
    }

    const reason = gatewayResult.error.message;
    const isTerminal = isTerminalReconnectFailure(attemptNumber, this.ocpPolicy);
    this.deps.eventPublisher.publish(
      createOcpReconnectFailedEvent(session.correlationId, {
        attemptNumber,
        reason,
        isTerminal,
      }),
    );

    if (isTerminal) {
      this.clearOcpSession();
      return;
    }

    this.ocpSession = {
      ...session,
      nextAttemptNumber: attemptNumber + 1,
      timerHandle: null,
    };
    this.scheduleNextOcpAttempt();
  }

  private cancelOcpTimer(): void {
    const session = this.ocpSession;
    if (session?.timerHandle !== null && session?.timerHandle !== undefined) {
      this.scheduler.cancel(session.timerHandle);
    }
  }

  private clearOcpSession(): void {
    this.cancelOcpTimer();
    this.ocpSession = null;
  }
}

function mapOcpDisconnectReason(
  reason: string,
): "transport_closed" | "heartbeat_timeout" | "auth_revoked" | "unknown" {
  if (reason.includes("heartbeat")) {
    return "heartbeat_timeout";
  }
  if (reason.includes("auth")) {
    return "auth_revoked";
  }
  if (reason.includes("transport") || reason.includes("closed")) {
    return "transport_closed";
  }
  return "unknown";
}
