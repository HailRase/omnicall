import type { DomainEvent } from "@domain/index.js";
import type { SipAccountId } from "@domain/index.js";
import {
  createDefaultUserSettings,
  createRegistrationFailedEvent,
  createRegistrationSucceededEvent,
  mapSipRegistrationFailureKey,
} from "@domain/index.js";
import {
  buildSipRegistrationRecoveryPolicy,
  buildSipTransportRecoveryPolicy,
} from "@domain/settings/SipRecoverySettings.js";
import type { UserSettings } from "@domain/settings/UserSettings.js";
import {
  isTerminalReconnectFailure,
  planReconnectAttempt,
  type RandomSource,
  type ReconnectPolicyConfig,
} from "@domain/shared/recovery/ReconnectPolicy.js";
import {
  createSipRegistrationRetryAttemptStartedEvent,
  createSipRegistrationRetryFailedEvent,
  createSipRegistrationRetryScheduledEvent,
  createSipRegistrationRetrySucceededEvent,
} from "@domain/telephony/events/sipRegistrationRetryEvents.js";
import {
  createManualSipTransportReconnectRequestedEvent,
  createSipRegistrationClearedEvent,
  createSipTransportConnectedEvent,
  createSipTransportConnectingEvent,
  createSipTransportDisconnectedEvent,
  createSipTransportReconnectAttemptStartedEvent,
  createSipTransportReconnectFailedEvent,
  createSipTransportReconnectScheduledEvent,
  createSipTransportReconnectSucceededEvent,
} from "@domain/telephony/events/sipTransportEvents.js";
import type { DomainEventPublisher, Logger, TelephonyGateway } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";
import {
  ReconnectScheduler,
  type TimerHandle,
} from "../infrastructure/ReconnectScheduler.js";
import { SipConnectionJournal } from "./SipConnectionJournal.js";

const FEATURE_ID = "F-014";

type SipRecoveryTarget = "transport" | "registration";

type SipRecoverySession = Readonly<{
  correlationId: CorrelationId;
  target: SipRecoveryTarget;
  nextAttemptNumber: number;
  timerHandle: TimerHandle | null;
  accountId: SipAccountId | null;
  pausedForActiveCall: boolean;
}>;

export type SipRecoveryOrchestrationDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  journal?: SipConnectionJournal;
  scheduler?: ReconnectScheduler;
  random?: RandomSource;
  transportPolicy?: ReconnectPolicyConfig;
  registrationPolicy?: ReconnectPolicyConfig;
  sipAutoReconnectEnabled?: boolean;
  sipAutoReregisterEnabled?: boolean;
  hasEstablishedTelephonySessions?: () => boolean;
}>;

/**
 * - Purpose: SIP-only transport/registration recovery orchestration (ADR-0004).
 * - Inputs: transport disconnect, registration failure, user settings, active calls.
 * - Outputs: transport/registration recovery domain events; gateway reconnect/reregister.
 */
export class SipRecoveryOrchestrationService {
  private readonly scheduler: ReconnectScheduler;
  private readonly random: RandomSource;
  private readonly journal: SipConnectionJournal;
  private transportPolicy: ReconnectPolicyConfig;
  private registrationPolicy: ReconnectPolicyConfig;
  private sipAutoReconnectEnabled: boolean;
  private sipAutoReregisterEnabled: boolean;
  private readonly hasEstablishedTelephonySessions: (() => boolean) | null;
  private session: SipRecoverySession | null = null;
  private transportConnected = false;
  private activeCallEpisodes = 0;
  private readonly transportUnsubscribers: Array<() => void> = [];

  constructor(private readonly deps: SipRecoveryOrchestrationDeps) {
    this.scheduler = deps.scheduler ?? new ReconnectScheduler();
    this.random = deps.random ?? (() => 0.5);
    this.journal = deps.journal ?? new SipConnectionJournal();
    const defaultSettings = createDefaultUserSettings();
    this.transportPolicy = deps.transportPolicy ?? buildSipTransportRecoveryPolicy(defaultSettings);
    this.registrationPolicy =
      deps.registrationPolicy ?? buildSipRegistrationRecoveryPolicy(defaultSettings);
    this.sipAutoReconnectEnabled = deps.sipAutoReconnectEnabled ?? true;
    this.sipAutoReregisterEnabled = deps.sipAutoReregisterEnabled ?? true;
    this.hasEstablishedTelephonySessions = deps.hasEstablishedTelephonySessions ?? null;
  }

  bindTransportHandlers(): void {
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setTransportConnectingHandler((notification) => {
        const event = createSipTransportConnectingEvent(notification.correlationId);
        this.deps.eventPublisher.publish(event);
        this.journal.recordDomainEvent(event);
        return Promise.resolve();
      }),
    );
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setTransportConnectedHandler((notification) => {
        this.transportConnected = true;
        const event = createSipTransportConnectedEvent(notification.correlationId);
        this.deps.eventPublisher.publish(event);
        this.journal.recordDomainEvent(event);
        return Promise.resolve();
      }),
    );
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setTransportDisconnectedHandler((notification) => {
        this.handleTransportDisconnected(notification.correlationId, notification.reason);
        return Promise.resolve();
      }),
    );
    this.transportUnsubscribers.push(
      this.deps.telephonyGateway.setRegistrationFailedHandler((notification) => {
        const reason = mapSipRegistrationFailureKey(notification.reason);
        const accountId = notification.accountId;
        const event = createRegistrationFailedEvent(notification.correlationId, {
          accountId:
            accountId ?? ("runtime-registration-failed" as SipAccountId),
          reason,
        });
        this.deps.eventPublisher.publish(event);
        this.journal.recordDomainEvent(event);
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
    this.transportPolicy = buildSipTransportRecoveryPolicy(settings);
    this.registrationPolicy = buildSipRegistrationRecoveryPolicy(settings);
    this.sipAutoReconnectEnabled = settings.sipAutoReconnectEnabled;
    this.sipAutoReregisterEnabled = settings.sipAutoReregisterEnabled;

    const activeSession = this.session;
    this.cancelTimer();

    if (!this.isAutoEnabledForTarget(activeSession?.target ?? null)) {
      this.session = null;
      return;
    }

    if (activeSession === null) {
      return;
    }

    this.session = {
      ...activeSession,
      timerHandle: null,
      pausedForActiveCall: this.shouldPauseRecovery(),
    };

    if (this.session.pausedForActiveCall) {
      return;
    }

    this.scheduleNextAttempt();
  }

  dispose(): void {
    for (const unsubscribe of this.transportUnsubscribers) {
      unsubscribe();
    }
    this.transportUnsubscribers.length = 0;
    this.clearSession();
    this.scheduler.dispose();
    this.transportConnected = false;
  }

  getJournal(): SipConnectionJournal {
    return this.journal;
  }

  getScheduler(): ReconnectScheduler {
    return this.scheduler;
  }

  async requestManualTransportReconnect(correlationId: CorrelationId): Promise<void> {
    const existing = this.session;
    const attemptNumber = existing?.target === "transport" ? existing.nextAttemptNumber : 1;

    this.clearSession();

    this.deps.eventPublisher.publish(
      createManualSipTransportReconnectRequestedEvent(correlationId),
    );
    this.journal.record({
      correlationId,
      category: "transport",
      eventType: "ManualSipTransportReconnectRequested",
      detail: null,
    });

    this.session = {
      correlationId,
      target: "transport",
      nextAttemptNumber: attemptNumber,
      timerHandle: null,
      accountId: existing?.accountId ?? null,
      pausedForActiveCall: false,
    };

    if (this.shouldPauseRecovery()) {
      this.session = { ...this.session, pausedForActiveCall: true };
      return;
    }

    await this.executeAttempt(attemptNumber);
  }

  private handleDomainEvent(event: DomainEvent): void {
    switch (event.type) {
      case "RegistrationSucceeded":
        this.transportConnected = true;
        return;
      case "RegistrationFailed": {
        const accountId = asOptionalAccountId(event["accountId"]);
        const reason = mapSipRegistrationFailureKey(
          asOptionalString(event["reason"]) ?? "registration_failed",
        );
        queueMicrotask(() => {
          this.handleRegistrationFailed(event.correlationId, reason, accountId);
        });
        return;
      }
      case "CallEnded":
      case "IncomingCallEndedBeforeAnswer":
      case "CallFailed":
        this.activeCallEpisodes = Math.max(0, this.activeCallEpisodes - 1);
        this.resumePausedRecoveryIfReady();
        return;
      case "OutgoingCallRequested":
      case "IncomingCallReceived":
      case "ConsultationCallRequested":
        this.activeCallEpisodes += 1;
        return;
      case "ServerTerminateReceived":
      case "SipSessionReset":
      case "UserSessionEnded":
        this.clearSession();
        this.scheduler.cancelAll();
        return;
      default:
        return;
    }
  }

  private handleTransportDisconnected(correlationId: CorrelationId, reason: string): void {
    if (this.session !== null) {
      this.deps.logger.warn("sip_transport_disconnect_deduplicated", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_transport_disconnect_deduplicated",
        reason,
      });
      return;
    }

    this.transportConnected = false;

    const disconnected = createSipTransportDisconnectedEvent(correlationId, { reason });
    const cleared = createSipRegistrationClearedEvent(correlationId, { reason });
    this.deps.eventPublisher.publish(disconnected);
    this.deps.eventPublisher.publish(cleared);
    this.journal.recordDomainEvent(disconnected);
    this.journal.recordDomainEvent(cleared);

    this.deps.logger.warn("sip_transport_disconnected", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "sip_transport_disconnected",
      reason,
    });

    if (!this.sipAutoReconnectEnabled) {
      return;
    }

    this.session = {
      correlationId,
      target: "transport",
      nextAttemptNumber: 1,
      timerHandle: null,
      accountId: null,
      pausedForActiveCall: false,
    };
    this.beginScheduling();
  }

  private handleRegistrationFailed(
    correlationId: CorrelationId,
    reason: string,
    accountId: SipAccountId | null,
  ): void {
    const reasonKey = mapSipRegistrationFailureKey(reason);

    if (!this.transportConnected) {
      this.deps.logger.warn("sip_registration_failure_ignored_transport_down", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_registration_failure_ignored",
        reason,
      });
      return;
    }

    if (this.session !== null) {
      this.deps.logger.warn("sip_registration_failure_deduplicated", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "sip_registration_failure_deduplicated",
        reason,
      });
      return;
    }

    if (!this.sipAutoReregisterEnabled) {
      this.publishRegistrationFailed(correlationId, 1, reasonKey, true);
      return;
    }

    this.session = {
      correlationId,
      target: "registration",
      nextAttemptNumber: 1,
      timerHandle: null,
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

    this.beginScheduling();
  }

  private beginScheduling(): void {
    if (this.shouldPauseRecovery()) {
      const current = this.session;
      if (current !== null) {
        this.session = { ...current, pausedForActiveCall: true };
      }
      return;
    }
    this.scheduleNextAttempt();
  }

  private resumePausedRecoveryIfReady(): void {
    const current = this.session;
    if (current === null || !current.pausedForActiveCall || this.shouldPauseRecovery()) {
      return;
    }
    this.session = { ...current, pausedForActiveCall: false };
    this.scheduleNextAttempt();
  }

  private shouldPauseRecovery(): boolean {
    if (this.hasEstablishedTelephonySessions !== null) {
      return this.hasEstablishedTelephonySessions();
    }
    return this.activeCallEpisodes > 0;
  }

  private scheduleNextAttempt(): void {
    const current = this.session;
    if (current === null) {
      return;
    }

    if (current.target === "registration" && !this.transportConnected) {
      return;
    }

    if (this.shouldPauseRecovery()) {
      this.session = { ...current, pausedForActiveCall: true };
      return;
    }

    const policy = this.getPolicy(current.target);
    const plan = planReconnectAttempt(current.nextAttemptNumber, policy, this.random);
    if (plan === null) {
      this.publishTerminalFailure(current);
      this.clearSession();
      return;
    }

    this.publishScheduled(current, plan.attemptNumber, plan.delayMs);
    const timerHandle = this.scheduler.schedule(plan.delayMs, () => {
      void this.executeAttempt(plan.attemptNumber);
    });
    this.session = { ...current, timerHandle };
  }

  private async executeAttempt(attemptNumber: number): Promise<void> {
    const current = this.session;
    if (current === null || current.nextAttemptNumber !== attemptNumber) {
      return;
    }

    if (current.target === "registration" && !this.transportConnected) {
      return;
    }

    if (this.shouldPauseRecovery()) {
      this.session = { ...current, pausedForActiveCall: true, timerHandle: null };
      return;
    }

    this.session = { ...current, timerHandle: null };
    this.publishAttemptStarted(current, attemptNumber);

    const gatewayResult =
      current.target === "transport"
        ? await this.deps.telephonyGateway.reconnectTransport(current.correlationId)
        : await this.deps.telephonyGateway.reregister(current.correlationId);

    if (!isErr(gatewayResult)) {
      if (current.target === "transport") {
        this.transportConnected = true;
        this.publishTransportSucceeded(current, attemptNumber);
        const accountId = current.accountId;
        this.clearSession();
        if (this.sipAutoReregisterEnabled) {
          this.startRegistrationRecovery(current.correlationId, accountId);
        }
        return;
      }

      this.publishRegistrationSucceeded(current, attemptNumber);
      this.clearSession();
      return;
    }

    const reason = mapSipRegistrationFailureKey(gatewayResult.error.message);
    const isTerminal = isTerminalReconnectFailure(attemptNumber, this.getPolicy(current.target));
    this.publishFailed(current, attemptNumber, reason, isTerminal);
    if (isTerminal) {
      this.clearSession();
      return;
    }

    this.session = {
      ...current,
      nextAttemptNumber: attemptNumber + 1,
      timerHandle: null,
      pausedForActiveCall: false,
    };
    this.scheduleNextAttempt();
  }

  private startRegistrationRecovery(
    correlationId: CorrelationId,
    accountId: SipAccountId | null,
  ): void {
    if (!this.sipAutoReregisterEnabled || !this.transportConnected || this.session !== null) {
      return;
    }

    this.session = {
      correlationId,
      target: "registration",
      nextAttemptNumber: 1,
      timerHandle: null,
      accountId,
      pausedForActiveCall: false,
    };
    this.beginScheduling();
  }

  private publishScheduled(
    session: SipRecoverySession,
    attemptNumber: number,
    delayMs: number,
  ): void {
    const event =
      session.target === "transport"
        ? createSipTransportReconnectScheduledEvent(session.correlationId, {
            attemptNumber,
            delayMs,
          })
        : createSipRegistrationRetryScheduledEvent(session.correlationId, {
            attemptNumber,
            delayMs,
          });
    this.deps.eventPublisher.publish(event);
    this.journal.recordDomainEvent(event);
  }

  private publishAttemptStarted(session: SipRecoverySession, attemptNumber: number): void {
    const event =
      session.target === "transport"
        ? createSipTransportReconnectAttemptStartedEvent(session.correlationId, {
            attemptNumber,
          })
        : createSipRegistrationRetryAttemptStartedEvent(session.correlationId, {
            attemptNumber,
          });
    this.deps.eventPublisher.publish(event);
    this.journal.recordDomainEvent(event);
  }

  private publishTransportSucceeded(session: SipRecoverySession, attemptNumber: number): void {
    const event = createSipTransportReconnectSucceededEvent(session.correlationId, {
      attemptNumber,
    });
    this.deps.eventPublisher.publish(event);
    this.journal.recordDomainEvent(event);
  }

  private publishRegistrationSucceeded(session: SipRecoverySession, attemptNumber: number): void {
    const event = createSipRegistrationRetrySucceededEvent(session.correlationId, {
      attemptNumber,
    });
    this.deps.eventPublisher.publish(event);
    this.journal.recordDomainEvent(event);
    if (session.accountId !== null) {
      this.deps.eventPublisher.publish(
        createRegistrationSucceededEvent(session.correlationId, {
          accountId: session.accountId,
        }),
      );
    }
  }

  private publishFailed(
    session: SipRecoverySession,
    attemptNumber: number,
    reason: string,
    isTerminal: boolean,
  ): void {
    if (session.target === "transport") {
      const event = createSipTransportReconnectFailedEvent(session.correlationId, {
        attemptNumber,
        reason,
        isTerminal,
      });
      this.deps.eventPublisher.publish(event);
      this.journal.recordDomainEvent(event);
      return;
    }
    this.publishRegistrationFailed(session.correlationId, attemptNumber, reason, isTerminal);
  }

  private publishRegistrationFailed(
    correlationId: CorrelationId,
    attemptNumber: number,
    reason: string,
    isTerminal: boolean,
  ): void {
    const event = createSipRegistrationRetryFailedEvent(correlationId, {
      attemptNumber,
      reason,
      isTerminal,
    });
    this.deps.eventPublisher.publish(event);
    this.journal.recordDomainEvent(event);
  }

  private publishTerminalFailure(session: SipRecoverySession): void {
    const reason =
      session.target === "transport" ? "sip_transport_recovery_exhausted" : "sip_registration_recovery_exhausted";
    this.publishFailed(session, session.nextAttemptNumber, reason, true);
  }

  private getPolicy(target: SipRecoveryTarget): ReconnectPolicyConfig {
    return target === "transport" ? this.transportPolicy : this.registrationPolicy;
  }

  private isAutoEnabledForTarget(target: SipRecoveryTarget | null): boolean {
    if (target === "transport") {
      return this.sipAutoReconnectEnabled;
    }
    if (target === "registration") {
      return this.sipAutoReregisterEnabled;
    }
    return true;
  }

  private cancelTimer(): void {
    const current = this.session;
    if (current?.timerHandle !== null && current?.timerHandle !== undefined) {
      this.scheduler.cancel(current.timerHandle);
    }
  }

  private clearSession(): void {
    this.cancelTimer();
    this.session = null;
  }
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asOptionalAccountId(value: unknown): SipAccountId | null {
  return typeof value === "string" && value.length > 0 ? (value as SipAccountId) : null;
}
