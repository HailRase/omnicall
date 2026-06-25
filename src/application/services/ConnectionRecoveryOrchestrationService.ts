import type { DomainEvent } from "@domain/index.js";
import type { SipAccountId } from "@domain/index.js";
import {
  createRegistrationSucceededEvent,
  mapSipRegistrationFailureKey,
} from "@domain/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectAttemptStartedEvent,
  createOcpReconnectFailedEvent,
  createOcpReconnectScheduledEvent,
  createOcpReconnectSucceededEvent,
} from "@domain/operator/events/ocpRecoveryEvents.js";
import { buildSipRecoveryPolicyFromUserSettings } from "@domain/settings/SipRecoverySettings.js";
import type { UserSettings } from "@domain/settings/UserSettings.js";
import {
  OCP_RECONNECT_POLICY_CONFIG,
  SIP_RECONNECT_POLICY_CONFIG,
  isTerminalReconnectFailure,
  planReconnectAttempt,
  type RandomSource,
  type ReconnectPolicyConfig,
} from "@domain/shared/recovery/ReconnectPolicy.js";
import { createManualReconnectRequestedEvent } from "@domain/shared/recovery/manualRecoveryEvents.js";
import {
  createSipRegistrationRetryAttemptStartedEvent,
  createSipRegistrationRetryFailedEvent,
  createSipRegistrationRetryScheduledEvent,
  createSipRegistrationRetrySucceededEvent,
} from "@domain/telephony/events/sipRegistrationRetryEvents.js";
import {
  createSipReconnectAttemptStartedEvent,
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
import type { SipRecoveryMode } from "../projections/connectionRecoveryProjection.js";

const FEATURE_ID = "F-014";

type RecoveryChannel = "sip" | "ocp";
type ManualRetryChannel = RecoveryChannel | "both";

type SipRecoverySession = Readonly<{
  correlationId: CorrelationId;
  nextAttemptNumber: number;
  timerHandle: TimerHandle | null;
  mode: SipRecoveryMode;
  accountId: SipAccountId | null;
  pausedForActiveCall: boolean;
}>;

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
  sipPolicy?: ReconnectPolicyConfig;
  ocpPolicy?: ReconnectPolicyConfig;
  sipAutoReregisterEnabled?: boolean;
  hasEstablishedTelephonySessions?: () => boolean;
}>;

/**
 * - Purpose: orchestrate SIP/OCP reconnect and SIP REGISTER retries (LF-008, LF-058).
 * - Inputs: transport disconnect, registration failure, user settings, active calls.
 * - Outputs: recovery domain events; gateway reconnect/reregister calls.
 */
export class ConnectionRecoveryOrchestrationService {
  private readonly scheduler: ReconnectScheduler;
  private readonly random: RandomSource;
  private sipPolicy: ReconnectPolicyConfig;
  private readonly ocpPolicy: ReconnectPolicyConfig;
  private sipAutoReregisterEnabled: boolean;
  private readonly hasEstablishedTelephonySessions: (() => boolean) | null;
  private ocpModeEnabled = false;
  private sipSession: SipRecoverySession | null = null;
  private ocpSession: OcpRecoverySession | null = null;
  private lastSipRecoveryMode: SipRecoveryMode = "transport";
  private activeCallEpisodes = 0;
  private readonly transportUnsubscribers: Array<() => void> = [];

  constructor(private readonly deps: ConnectionRecoveryOrchestrationDeps) {
    this.scheduler = deps.scheduler ?? new ReconnectScheduler();
    this.random = deps.random ?? (() => 0.5);
    this.sipPolicy = deps.sipPolicy ?? SIP_RECONNECT_POLICY_CONFIG;
    this.ocpPolicy = deps.ocpPolicy ?? OCP_RECONNECT_POLICY_CONFIG;
    this.sipAutoReregisterEnabled = deps.sipAutoReregisterEnabled ?? true;
    this.hasEstablishedTelephonySessions = deps.hasEstablishedTelephonySessions ?? null;
  }

  bindTransportHandlers(): void {
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setTransportDisconnectedHandler((notification) => {
        this.handleSipTransportDisconnected(notification.correlationId, notification.reason);
        return Promise.resolve();
      }),
    );
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setRegistrationFailedHandler((notification) => {
        this.handleSipRegistrationFailed(
          notification.correlationId,
          notification.reason,
          notification.accountId,
        );
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

  applyRecoverySettings(settings: UserSettings): void {
    this.sipPolicy = buildSipRecoveryPolicyFromUserSettings(settings);
    this.sipAutoReregisterEnabled = settings.sipAutoReregisterEnabled;

    const activeSession = this.sipSession;
    this.cancelSipTimer();

    if (!settings.sipAutoReregisterEnabled) {
      this.sipSession = null;
      return;
    }

    if (activeSession === null) {
      return;
    }

    this.sipSession = {
      ...activeSession,
      timerHandle: null,
      pausedForActiveCall: this.shouldPauseSipRecovery(),
    };

    if (this.sipSession.pausedForActiveCall) {
      return;
    }

    this.scheduleNextAttempt("sip");
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

  async requestManualRetry(
    channel: ManualRetryChannel,
    correlationId: CorrelationId,
  ): Promise<void> {
    const channels = resolveManualRetryChannels(channel);

    for (const targetChannel of channels) {
      if (targetChannel === "ocp" && !this.ocpModeEnabled) {
        continue;
      }

      this.clearChannel(targetChannel);

      this.deps.eventPublisher.publish(
        createManualReconnectRequestedEvent(correlationId, { channel: targetChannel }),
      );

      this.deps.logger.info("manual_reconnect_requested", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: targetChannel === "sip" ? "Telephony" : "Operator",
        operation: "manual_reconnect_requested",
        channel: targetChannel,
        attemptNumber: 1,
      });

      if (targetChannel === "sip") {
        this.sipSession = {
          correlationId,
          nextAttemptNumber: 1,
          timerHandle: null,
          mode: this.lastSipRecoveryMode,
          accountId: null,
          pausedForActiveCall: false,
        };
      } else {
        this.ocpSession = {
          correlationId,
          nextAttemptNumber: 1,
          timerHandle: null,
        };
      }

      await this.executeReconnectAttempt(targetChannel, 1);
    }
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
      case "RegistrationFailed": {
        const accountId = asOptionalAccountId(event["accountId"]);
        const reason = mapSipRegistrationFailureKey(
          asOptionalString(event["reason"]) ?? "registration_failed",
        );
        this.handleSipRegistrationFailed(event.correlationId, reason, accountId);
        return;
      }
      case "CallEnded":
      case "IncomingCallEndedBeforeAnswer":
      case "CallFailed":
        this.decrementActiveCalls();
        return;
      case "OutgoingCallRequested":
      case "IncomingCallReceived":
      case "ConsultationCallRequested":
        this.incrementActiveCalls();
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
    if (this.isRecoveryInFlight("sip")) {
      this.deps.logger.warn("sip_transport_disconnect_deduplicated", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_transport_disconnect_deduplicated",
        reason,
      });
      return;
    }

    this.lastSipRecoveryMode = "transport";
    this.sipSession = {
      correlationId,
      nextAttemptNumber: 1,
      timerHandle: null,
      mode: "transport",
      accountId: null,
      pausedForActiveCall: false,
    };

    this.deps.logger.warn("sip_transport_disconnected", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "sip_transport_disconnected",
      reason,
    });

    this.beginSipRecoveryScheduling();
  }

  private handleSipRegistrationFailed(
    correlationId: CorrelationId,
    reason: string,
    accountId: SipAccountId | null,
  ): void {
    if (this.isRecoveryInFlight("sip")) {
      this.deps.logger.warn("sip_registration_failure_deduplicated", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_registration_failure_deduplicated",
        reason,
      });
      return;
    }

    this.lastSipRecoveryMode = "registration";

    if (!this.sipAutoReregisterEnabled) {
      this.publishSipFailed("registration", correlationId, 1, reason, true);
      return;
    }

    this.sipSession = {
      correlationId,
      nextAttemptNumber: 1,
      timerHandle: null,
      mode: "registration",
      accountId,
      pausedForActiveCall: false,
    };

    this.deps.logger.warn("sip_registration_failed", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "sip_registration_failed",
      reason,
    });

    this.beginSipRecoveryScheduling();
  }

  private incrementActiveCalls(): void {
    this.activeCallEpisodes += 1;
  }

  private decrementActiveCalls(): void {
    this.activeCallEpisodes = Math.max(0, this.activeCallEpisodes - 1);
    this.resumePausedSipRecoveryIfReady();
  }

  private beginSipRecoveryScheduling(): void {
    if (this.shouldPauseSipRecovery()) {
      const session = this.sipSession;
      if (session !== null) {
        this.sipSession = { ...session, pausedForActiveCall: true };
      }
      return;
    }

    this.scheduleNextAttempt("sip");
  }

  private resumePausedSipRecoveryIfReady(): void {
    const session = this.sipSession;
    if (session === null || !session.pausedForActiveCall) {
      return;
    }

    if (this.shouldPauseSipRecovery()) {
      return;
    }

    this.sipSession = { ...session, pausedForActiveCall: false };
    this.scheduleNextAttempt("sip");
  }

  private shouldPauseSipRecovery(): boolean {
    if (this.hasEstablishedTelephonySessions !== null) {
      return this.hasEstablishedTelephonySessions();
    }
    return this.activeCallEpisodes > 0;
  }

  private handleOcpTransportDisconnected(
    correlationId: CorrelationId,
    reason: string,
  ): void {
    if (!this.ocpModeEnabled) {
      return;
    }

    if (this.isRecoveryInFlight("ocp")) {
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

    this.scheduleNextAttempt("ocp");
  }

  private scheduleNextAttempt(channel: RecoveryChannel): void {
    const session = this.getSession(channel);
    if (session === null) {
      return;
    }

    if (channel === "sip" && this.shouldPauseSipRecovery()) {
      this.sipSession = { ...(session as SipRecoverySession), pausedForActiveCall: true };
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

    this.publishScheduled(channel, session, plan.attemptNumber, plan.delayMs);

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

    if (channel === "sip" && this.shouldPauseSipRecovery()) {
      this.sipSession = { ...(session as SipRecoverySession), pausedForActiveCall: true };
      return;
    }

    this.setSession(channel, {
      ...session,
      timerHandle: null,
    });

    this.publishAttemptStarted(channel, session, attemptNumber);

    const gatewayResult = await this.executeGatewayAttempt(channel, session);

    if (!isErr(gatewayResult)) {
      this.deps.logger.info("reconnect_succeeded", {
        correlationId: session.correlationId,
        featureId: FEATURE_ID,
        boundedContext: channel === "sip" ? "Telephony" : "Operator",
        operation: `${channel}_reconnect_succeeded`,
        attemptNumber,
        result: "succeeded",
      });

      this.publishSucceeded(channel, session, attemptNumber);
      this.clearChannel(channel);
      return;
    }

    const reason = mapSipRegistrationFailureKey(gatewayResult.error.message);
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

    this.publishFailed(channel, session, attemptNumber, reason, isTerminal);

    if (isTerminal) {
      this.clearChannel(channel);
      return;
    }

    const nextSession =
      channel === "sip"
        ? {
            ...(session as SipRecoverySession),
            nextAttemptNumber: attemptNumber + 1,
            timerHandle: null,
            pausedForActiveCall: false,
          }
        : {
            ...(session as OcpRecoverySession),
            nextAttemptNumber: attemptNumber + 1,
            timerHandle: null,
          };

    this.setSession(channel, nextSession);
    this.scheduleNextAttempt(channel);
  }

  private executeGatewayAttempt(
    channel: RecoveryChannel,
    session: SipRecoverySession | OcpRecoverySession,
  ) {
    if (channel === "ocp") {
      return this.deps.operatorGateway.reconnectTransport(session.correlationId);
    }

    const sipSession = session as SipRecoverySession;
    if (sipSession.mode === "registration") {
      return this.deps.telephonyGateway.reregister(session.correlationId);
    }

    return this.deps.telephonyGateway.reconnectTransport(session.correlationId);
  }

  private publishScheduled(
    channel: RecoveryChannel,
    session: SipRecoverySession | OcpRecoverySession,
    attemptNumber: number,
    delayMs: number,
  ): void {
    if (channel === "ocp") {
      this.deps.eventPublisher.publish(
        createOcpReconnectScheduledEvent(session.correlationId, { attemptNumber, delayMs }),
      );
      return;
    }

    const sipSession = session as SipRecoverySession;
    if (sipSession.mode === "registration") {
      this.deps.eventPublisher.publish(
        createSipRegistrationRetryScheduledEvent(session.correlationId, {
          attemptNumber,
          delayMs,
        }),
      );
      return;
    }

    this.deps.eventPublisher.publish(
      createSipReconnectScheduledEvent(session.correlationId, { attemptNumber, delayMs }),
    );
  }

  private publishAttemptStarted(
    channel: RecoveryChannel,
    session: SipRecoverySession | OcpRecoverySession,
    attemptNumber: number,
  ): void {
    if (channel === "ocp") {
      this.deps.eventPublisher.publish(
        createOcpReconnectAttemptStartedEvent(session.correlationId, { attemptNumber }),
      );
      return;
    }

    const sipSession = session as SipRecoverySession;
    if (sipSession.mode === "registration") {
      this.deps.eventPublisher.publish(
        createSipRegistrationRetryAttemptStartedEvent(session.correlationId, { attemptNumber }),
      );
      return;
    }

    this.deps.eventPublisher.publish(
      createSipReconnectAttemptStartedEvent(session.correlationId, { attemptNumber }),
    );
  }

  private publishSucceeded(
    channel: RecoveryChannel,
    session: SipRecoverySession | OcpRecoverySession,
    attemptNumber: number,
  ): void {
    if (channel === "ocp") {
      this.deps.eventPublisher.publish(
        createOcpReconnectSucceededEvent(session.correlationId, { attemptNumber }),
      );
      return;
    }

    const sipSession = session as SipRecoverySession;
    if (sipSession.mode === "registration") {
      this.deps.eventPublisher.publish(
        createSipRegistrationRetrySucceededEvent(session.correlationId, { attemptNumber }),
      );
      if (sipSession.accountId !== null) {
        this.deps.eventPublisher.publish(
          createRegistrationSucceededEvent(session.correlationId, {
            accountId: sipSession.accountId,
          }),
        );
      }
      return;
    }

    this.deps.eventPublisher.publish(
      createSipReconnectSucceededEvent(session.correlationId, { attemptNumber }),
    );
  }

  private publishFailed(
    channel: RecoveryChannel,
    session: SipRecoverySession | OcpRecoverySession,
    attemptNumber: number,
    reason: string,
    isTerminal: boolean,
  ): void {
    if (channel === "ocp") {
      this.deps.eventPublisher.publish(
        createOcpReconnectFailedEvent(session.correlationId, {
          attemptNumber,
          reason,
          isTerminal,
        }),
      );
      return;
    }

    this.publishSipFailed(
      (session as SipRecoverySession).mode,
      session.correlationId,
      attemptNumber,
      reason,
      isTerminal,
    );
  }

  private publishSipFailed(
    mode: SipRecoveryMode,
    correlationId: CorrelationId,
    attemptNumber: number,
    reason: string,
    isTerminal: boolean,
  ): void {
    if (mode === "registration") {
      this.deps.eventPublisher.publish(
        createSipRegistrationRetryFailedEvent(correlationId, {
          attemptNumber,
          reason,
          isTerminal,
        }),
      );
      return;
    }

    this.deps.eventPublisher.publish(
      createSipReconnectFailedEvent(correlationId, {
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
    const mode = channel === "sip" ? this.lastSipRecoveryMode : "transport";
    if (channel === "sip") {
      this.publishSipFailed(mode, correlationId, attemptNumber, "sip_recovery_exhausted", true);
      return;
    }

    this.deps.eventPublisher.publish(
      createOcpReconnectFailedEvent(correlationId, {
        attemptNumber,
        reason: "ocp_reconnect_exhausted",
        isTerminal: true,
      }),
    );
  }

  private stopAllRecovery(reason: string): void {
    void reason;
    this.clearChannel("sip");
    this.clearChannel("ocp");
    this.scheduler.cancelAll();
  }

  private cancelSipTimer(): void {
    const session = this.sipSession;
    if (session?.timerHandle !== null && session?.timerHandle !== undefined) {
      this.scheduler.cancel(session.timerHandle);
    }
  }

  private clearChannel(channel: RecoveryChannel): void {
    if (channel === "sip") {
      this.cancelSipTimer();
      if (this.sipSession !== null) {
        this.lastSipRecoveryMode = this.sipSession.mode;
      }
      this.sipSession = null;
      return;
    }

    const session = this.ocpSession;
    if (session?.timerHandle !== null && session?.timerHandle !== undefined) {
      this.scheduler.cancel(session.timerHandle);
    }
    this.ocpSession = null;
  }

  private getSession(
    channel: RecoveryChannel,
  ): SipRecoverySession | OcpRecoverySession | null {
    return channel === "sip" ? this.sipSession : this.ocpSession;
  }

  private setSession(
    channel: RecoveryChannel,
    session: SipRecoverySession | OcpRecoverySession | null,
  ): void {
    if (channel === "sip") {
      this.sipSession = session as SipRecoverySession | null;
      return;
    }
    this.ocpSession = session;
  }

  private getPolicy(channel: RecoveryChannel): ReconnectPolicyConfig {
    return channel === "sip" ? this.sipPolicy : this.ocpPolicy;
  }

  private isRecoveryInFlight(channel: RecoveryChannel): boolean {
    return this.getSession(channel) !== null;
  }
}

function resolveManualRetryChannels(
  channel: ManualRetryChannel,
): ReadonlyArray<RecoveryChannel> {
  if (channel === "both") {
    return ["sip", "ocp"];
  }
  return [channel];
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

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asOptionalAccountId(value: unknown): SipAccountId | null {
  return typeof value === "string" && value.length > 0 ? (value as SipAccountId) : null;
}
