import type { DomainEvent } from "@domain/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectFailedEvent,
  createOcpReconnectScheduledEvent,
  createOcpReconnectSucceededEvent,
} from "@domain/operator/events/ocpRecoveryEvents.js";
import {
  OCP_RECONNECT_POLICY_CONFIG,
  SIP_RECONNECT_POLICY_CONFIG,
  isTerminalReconnectFailure,
  planReconnectAttempt,
  type RandomSource,
  type ReconnectPolicyConfig,
} from "@domain/shared/recovery/ReconnectPolicy.js";
import {
  createSipReconnectFailedEvent,
  createSipReconnectScheduledEvent,
  createSipReconnectSucceededEvent,
} from "@domain/telephony/events/sipRecoveryEvents.js";
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
} from "../infrastructure/ReconnectScheduler.js";

const FEATURE_ID = "F-014";

type RecoveryChannel = "sip" | "ocp";

type RecoverySession = Readonly<{
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
  sipPolicy?: ReconnectPolicyConfig;
  ocpPolicy?: ReconnectPolicyConfig;
}>;

/**
 * - Purpose: orchestrate SIP/OCP reconnect scheduling and gateway retries (LF-008, LF-058).
 * - Inputs: transport disconnect notifications, ServerTerminateReceived.
 * - Outputs: recovery domain events via publisher; gateway reconnectTransport calls.
 */
export class ConnectionRecoveryOrchestrationService {
  private readonly scheduler: ReconnectScheduler;
  private readonly random: RandomSource;
  private readonly sipPolicy: ReconnectPolicyConfig;
  private readonly ocpPolicy: ReconnectPolicyConfig;
  private ocpModeEnabled = false;
  private sipSession: RecoverySession | null = null;
  private ocpSession: RecoverySession | null = null;
  private readonly transportUnsubscribers: Array<() => void> = [];

  constructor(private readonly deps: ConnectionRecoveryOrchestrationDeps) {
    this.scheduler = deps.scheduler ?? new ReconnectScheduler();
    this.random = deps.random ?? (() => 0.5);
    this.sipPolicy = deps.sipPolicy ?? SIP_RECONNECT_POLICY_CONFIG;
    this.ocpPolicy = deps.ocpPolicy ?? OCP_RECONNECT_POLICY_CONFIG;
  }

  bindTransportHandlers(): void {
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setTransportDisconnectedHandler((notification) => {
        this.handleSipTransportDisconnected(notification.correlationId, notification.reason);
        return Promise.resolve();
      }),
    );
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

  dispose(): void {
    for (const unsubscribe of this.transportUnsubscribers) {
      unsubscribe();
    }
    this.transportUnsubscribers.length = 0;
    this.clearChannel("sip");
    this.clearChannel("ocp");
    this.scheduler.dispose();
  }

  getScheduler(): ReconnectScheduler {
    return this.scheduler;
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
          this.clearChannel("ocp");
        } else {
          this.ocpModeEnabled = true;
        }
        return;
      }
      case "OcpAuthenticationSucceeded":
        this.ocpModeEnabled = true;
        return;
      case "ServerTerminateReceived":
        this.stopAllRecovery("server_terminate");
        return;
      default:
        return;
    }
  }

  private handleSipTransportDisconnected(
    correlationId: CorrelationId,
    reason: string,
  ): void {
    this.clearChannel("sip");
    this.sipSession = {
      correlationId,
      nextAttemptNumber: 1,
      timerHandle: null,
    };

    this.deps.logger.warn("sip_transport_disconnected", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "sip_transport_disconnected",
      reason,
    });

    this.scheduleNextAttempt("sip");
  }

  private handleOcpTransportDisconnected(
    correlationId: CorrelationId,
    reason: string,
  ): void {
    if (!this.ocpModeEnabled) {
      return;
    }

    this.clearChannel("ocp");
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

    this.scheduleNextAttempt("ocp");
  }

  private scheduleNextAttempt(channel: RecoveryChannel): void {
    const session = this.getSession(channel);
    if (session === null) {
      return;
    }

    const plan = planReconnectAttempt(
      session.nextAttemptNumber,
      this.getPolicy(channel),
      this.random,
    );

    if (plan === null) {
      this.publishTerminalFailure(channel, session.correlationId, session.nextAttemptNumber);
      this.clearChannel(channel);
      return;
    }

    this.deps.logger.info("reconnect_scheduled", {
      correlationId: session.correlationId,
      featureId: FEATURE_ID,
      boundedContext: channel === "sip" ? "Telephony" : "Operator",
      operation: `${channel}_reconnect_scheduled`,
      attemptNumber: plan.attemptNumber,
      delayMs: plan.delayMs,
    });

    this.publishScheduled(channel, session.correlationId, plan.attemptNumber, plan.delayMs);

    const timerHandle = this.scheduler.schedule(plan.delayMs, () => {
      void this.executeReconnectAttempt(channel, plan.attemptNumber);
    });

    this.setSession(channel, {
      ...session,
      timerHandle,
    });
  }

  private async executeReconnectAttempt(
    channel: RecoveryChannel,
    attemptNumber: number,
  ): Promise<void> {
    const session = this.getSession(channel);
    if (session === null || session.nextAttemptNumber !== attemptNumber) {
      return;
    }

    this.setSession(channel, {
      ...session,
      timerHandle: null,
    });

    const gatewayResult =
      channel === "sip"
        ? await this.deps.telephonyGateway.reconnectTransport(session.correlationId)
        : await this.deps.operatorGateway.reconnectTransport(session.correlationId);

    if (!isErr(gatewayResult)) {
      this.deps.logger.info("reconnect_succeeded", {
        correlationId: session.correlationId,
        featureId: FEATURE_ID,
        boundedContext: channel === "sip" ? "Telephony" : "Operator",
        operation: `${channel}_reconnect_succeeded`,
        attemptNumber,
        result: "succeeded",
      });

      this.publishSucceeded(channel, session.correlationId, attemptNumber);
      this.clearChannel(channel);
      return;
    }

    const reason = gatewayResult.error.message;
    const isTerminal = isTerminalReconnectFailure(attemptNumber, this.getPolicy(channel));

    this.deps.logger.error("reconnect_failed", {
      correlationId: session.correlationId,
      featureId: FEATURE_ID,
      boundedContext: channel === "sip" ? "Telephony" : "Operator",
      operation: `${channel}_reconnect_failed`,
      attemptNumber,
      isTerminal,
      result: gatewayResult.error.code,
      reason,
    });

    this.publishFailed(channel, session.correlationId, attemptNumber, reason, isTerminal);

    if (isTerminal) {
      this.clearChannel(channel);
      return;
    }

    const nextSession: RecoverySession = {
      correlationId: session.correlationId,
      nextAttemptNumber: attemptNumber + 1,
      timerHandle: null,
    };
    this.setSession(channel, nextSession);
    this.scheduleNextAttempt(channel);
  }

  private publishScheduled(
    channel: RecoveryChannel,
    correlationId: CorrelationId,
    attemptNumber: number,
    delayMs: number,
  ): void {
    if (channel === "sip") {
      this.deps.eventPublisher.publish(
        createSipReconnectScheduledEvent(correlationId, { attemptNumber, delayMs }),
      );
      return;
    }

    this.deps.eventPublisher.publish(
      createOcpReconnectScheduledEvent(correlationId, { attemptNumber, delayMs }),
    );
  }

  private publishSucceeded(
    channel: RecoveryChannel,
    correlationId: CorrelationId,
    attemptNumber: number,
  ): void {
    if (channel === "sip") {
      this.deps.eventPublisher.publish(
        createSipReconnectSucceededEvent(correlationId, { attemptNumber }),
      );
      return;
    }

    this.deps.eventPublisher.publish(
      createOcpReconnectSucceededEvent(correlationId, { attemptNumber }),
    );
  }

  private publishFailed(
    channel: RecoveryChannel,
    correlationId: CorrelationId,
    attemptNumber: number,
    reason: string,
    isTerminal: boolean,
  ): void {
    if (channel === "sip") {
      this.deps.eventPublisher.publish(
        createSipReconnectFailedEvent(correlationId, {
          attemptNumber,
          reason,
          isTerminal,
        }),
      );
      return;
    }

    this.deps.eventPublisher.publish(
      createOcpReconnectFailedEvent(correlationId, {
        attemptNumber,
        reason,
        isTerminal,
      }),
    );
  }

  private publishTerminalFailure(
    channel: RecoveryChannel,
    correlationId: CorrelationId,
    attemptNumber: number,
  ): void {
    this.publishFailed(
      channel,
      correlationId,
      attemptNumber,
      `${channel}_reconnect_exhausted`,
      true,
    );
  }

  private stopAllRecovery(reason: string): void {
    void reason;
    this.clearChannel("sip");
    this.clearChannel("ocp");
    this.scheduler.cancelAll();
  }

  private clearChannel(channel: RecoveryChannel): void {
    const session = this.getSession(channel);
    if (session?.timerHandle !== null && session?.timerHandle !== undefined) {
      this.scheduler.cancel(session.timerHandle);
    }

    if (channel === "sip") {
      this.sipSession = null;
      return;
    }

    this.ocpSession = null;
  }

  private getSession(channel: RecoveryChannel): RecoverySession | null {
    return channel === "sip" ? this.sipSession : this.ocpSession;
  }

  private setSession(channel: RecoveryChannel, session: RecoverySession | null): void {
    if (channel === "sip") {
      this.sipSession = session;
      return;
    }
    this.ocpSession = session;
  }

  private getPolicy(channel: RecoveryChannel): ReconnectPolicyConfig {
    return channel === "sip" ? this.sipPolicy : this.ocpPolicy;
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
