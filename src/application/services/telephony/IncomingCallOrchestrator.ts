import {
  applyCallTransition,
  countEstablishedCalls,
  createCallAnsweredEvent,
  createCallAutoAnsweredEvent,
  createCallEndedEvent,
  createCallRejectedByDndEvent,
  createCallRejectedEvent,
  createCallRejectReasonSelectedEvent,
  createIncomingCall,
  createIncomingCallDisplayNameResolvedEvent,
  createIncomingCallEndedBeforeAnswerEvent,
  createIncomingCallReceivedEvent,
  createIncomingCallRingingStartedEvent,
  createIncomingRingtoneStartedEvent,
  createIncomingRingtoneStoppedEvent,
  createPhoneNumber,
  evaluateIncomingAutoAnswerSchedule,
  evaluateAutoAnswerGlobalBlock,
  type AutoAnswerBlockedReason,
  type Call,
  type CallId,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  IncomingCallSettings,
  Logger,
  MediaGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import { decideAutoAnswer } from "@application/policies/AutoAnswerPolicy.js";
import { decideDndIncomingReject } from "@application/policies/DndRejectPolicy.js";
import { computeAutoAnswerExpiresAt } from "@application/projections/telephony/deriveAutoAnswerCountdown.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { CallTracker } from "./CallTracker.js";
import type { MultiCallPolicyService } from "./MultiCallPolicyService.js";
import { cancelScheduledTonePlaybackStop } from "./scheduleTonePlaybackStop.js";
import { attachRemoteAudioWhenReady } from "./remoteAudioAttach.js";
import type {
  AnswerCallInput,
  HandleCallAnsweredInput,
  HandleIncomingCallInput,
  RejectCallInput,
} from "./callEngineTypes.js";

type IncomingCallOrchestratorDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  settingsRepository: SettingsRepository;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  callTracker: CallTracker;
  hostIntegrationGateway?: HostIntegrationGateway;
  multiCallPolicyService: MultiCallPolicyService;
}>;

export class IncomingCallOrchestrator {
  private readonly autoAnswerTimers = new Map<CallId, ReturnType<typeof setTimeout>>();

  constructor(private readonly deps: IncomingCallOrchestratorDeps) {}

  async handleIncomingReceived(
    input: HandleIncomingCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const { notification } = input;
    const correlationId = notification.correlationId;
    const incomingCall = createIncomingCall(
      notification.callId,
      createPhoneNumber(notification.remoteNumber),
    );
    const ringingTransition = applyCallTransition(incomingCall, "incoming_received");
    if (!ringingTransition.transition.ok) {
      return err(
        createPlatformError("validation_failed", ringingTransition.transition.reason),
      );
    }

    const phoneStatus = await this.deps.settingsRepository.getPhoneStatus();
    const dndDecision = decideDndIncomingReject(phoneStatus);
    this.deps.callTracker.setActiveIncomingCall(ringingTransition.call);
    this.deps.callTracker.trackCall(ringingTransition.call);

    this.deps.eventPublisher.publish(
      createIncomingCallReceivedEvent(correlationId, {
        callId: ringingTransition.call.id,
        direction: "incoming",
        phoneNumber: ringingTransition.call.phoneNumber,
      }),
    );

    if (dndDecision.shouldReject && dndDecision.sipCode !== null) {
      return this.rejectCall({
        callId: ringingTransition.call.id,
        correlationId,
        sipCode: dndDecision.sipCode,
      });
    }

    const multiCallSettings = await this.deps.settingsRepository.getMultiCallSettings();
    const establishedCount = countEstablishedCalls(
      this.deps.callTracker.getEstablishedCalls(),
    );
    if (!multiCallSettings.multiSessionsEnabled && establishedCount > 0) {
      return this.rejectCall({
        callId: ringingTransition.call.id,
        correlationId,
        sipCode: 486,
      });
    }

    const incomingSettings = await this.deps.settingsRepository.getIncomingCallSettings();
    const autoAnswerDecision = decideAutoAnswer(incomingSettings);
    if (autoAnswerDecision === null) {
      this.deps.eventPublisher.publish(
        createIncomingCallRingingStartedEvent(correlationId, {
          callId: ringingTransition.call.id,
          autoAnswerTimeoutSec: null,
          autoAnswerExpiresAt: null,
        }),
      );
    }
    await this.deps.mediaGateway.playRingtone({
      callId: ringingTransition.call.id,
      correlationId,
    });
    this.deps.eventPublisher.publish(
      createIncomingRingtoneStartedEvent(correlationId, {
        callId: ringingTransition.call.id,
      }),
    );

    const displayName = notification.remoteDisplayNameRaw?.trim();
    if (displayName !== undefined && displayName.length > 0) {
      this.deps.eventPublisher.publish(
        createIncomingCallDisplayNameResolvedEvent(correlationId, {
          callId: ringingTransition.call.id,
          displayName,
        }),
      );
    }

    if (autoAnswerDecision !== null) {
      this.applyAutoAnswerScheduleForCall(
        ringingTransition.call.id,
        autoAnswerDecision.timeoutSec,
        incomingSettings,
        correlationId,
      );
    }

    this.deps.logger.info("incoming_call_received", {
      correlationId,
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "incoming_call",
      previousState: "Idle",
      nextState: ringingTransition.call.state,
      result: "ringing",
    });

    return ok(ringingTransition.call);
  }

  async refreshAutoAnswerSchedules(): Promise<void> {
    const incomingSettings = await this.deps.settingsRepository.getIncomingCallSettings();
    const autoAnswerDecision = decideAutoAnswer(incomingSettings);

    for (const call of this.deps.callTracker.getRingingIncomingCalls()) {
      this.clearAutoAnswerTimer(call.id);
      const correlationId = createCorrelationId();
      if (autoAnswerDecision === null) {
        this.deps.eventPublisher.publish(
          createIncomingCallRingingStartedEvent(correlationId, {
            callId: call.id,
            autoAnswerTimeoutSec: null,
            autoAnswerExpiresAt: null,
          }),
        );
        continue;
      }

      this.applyAutoAnswerScheduleForCall(
        call.id,
        autoAnswerDecision.timeoutSec,
        incomingSettings,
        correlationId,
      );
    }
  }

  async answerCall(
    input: AnswerCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const call = this.deps.callTracker.findRingingIncomingCall(input.callId);
    if (call === null) {
      return err(createPlatformError("validation_failed", "Incoming call not found"));
    }

    const connectingBlock = await this.deps.multiCallPolicyService.checkConflictingOperationBlocked(
      "incoming_answer",
      correlationId,
    );
    if (isErr(connectingBlock)) {
      return err(connectingBlock.error);
    }

    const blockResult = await this.deps.multiCallPolicyService.checkSecondSessionBlocked(
      "incoming_answer",
      correlationId,
    );
    if (isErr(blockResult)) {
      return err(blockResult.error);
    }

    const holdAllResult = await this.deps.multiCallPolicyService.holdAllActiveLines(
      correlationId,
      "before_incoming_answer",
    );
    if (isErr(holdAllResult)) {
      return err(holdAllResult.error);
    }

    const answered = applyCallTransition(call, "answered");
    if (!answered.transition.ok) {
      return err(createPlatformError("validation_failed", answered.transition.reason));
    }

    const answerResult = await this.deps.telephonyGateway.answerCall({
      callId: input.callId,
      correlationId,
    });
    if (isErr(answerResult)) {
      return answerResult;
    }

    this.clearAutoAnswerTimer(input.callId);
    cancelScheduledTonePlaybackStop(input.callId);
    await this.deps.mediaGateway.stopTone({ callId: input.callId, correlationId });
    this.deps.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(correlationId, {
        callId: input.callId,
      }),
    );
    await attachRemoteAudioWhenReady(
      {
        mediaGateway: this.deps.mediaGateway,
        eventPublisher: this.deps.eventPublisher,
      },
      input.callId,
      correlationId,
    );
    this.deps.eventPublisher.publish(
      createCallAnsweredEvent(correlationId, { callId: input.callId }),
    );
    if (input.autoAnswered === true && input.timeoutSec !== undefined) {
      this.deps.eventPublisher.publish(
        createCallAutoAnsweredEvent(correlationId, {
          callId: input.callId,
          timeoutSec: input.timeoutSec,
        }),
      );
    }

    this.deps.callTracker.setActiveIncomingCall(answered.call);
    this.deps.callTracker.trackCall(answered.call);
    this.deps.logger.info("incoming_call_answered", {
      correlationId,
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "answer_call",
      previousState: call.state,
      nextState: answered.call.state,
      result: input.autoAnswered === true ? "auto_answered" : "answered",
    });

    return ok(answered.call);
  }

  async retryRemoteAudioAttach(input: HandleCallAnsweredInput): Promise<void> {
    const correlationId = input.correlationId ?? createCorrelationId();
    await attachRemoteAudioWhenReady(
      {
        mediaGateway: this.deps.mediaGateway,
        eventPublisher: this.deps.eventPublisher,
      },
      input.call.id,
      correlationId,
    );
  }

  async rejectCall(
    input: RejectCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const call = this.deps.callTracker.findRingingIncomingCall(input.callId);
    if (call === null) {
      return err(createPlatformError("validation_failed", "Incoming call not found"));
    }

    const ending = applyCallTransition(call, "reject_requested");
    if (!ending.transition.ok) {
      return err(createPlatformError("validation_failed", ending.transition.reason));
    }

    const rejectCommand: {
      callId: CallId;
      correlationId: CorrelationId;
      reason?: string;
      sipCode?: number;
    } = {
      callId: input.callId,
      correlationId,
    };
    if (input.breakReason !== undefined) {
      rejectCommand.reason = input.breakReason;
    }
    if (input.sipCode !== undefined) {
      rejectCommand.sipCode = input.sipCode;
    }
    const rejectResult = await this.deps.telephonyGateway.rejectCall(rejectCommand);
    if (isErr(rejectResult)) {
      return rejectResult;
    }

    const ended = applyCallTransition(ending.call, "reject_completed");
    if (!ended.transition.ok) {
      return err(createPlatformError("validation_failed", ended.transition.reason));
    }

    this.clearAutoAnswerTimer(input.callId);
    cancelScheduledTonePlaybackStop(input.callId);
    await this.deps.mediaGateway.stopTone({ callId: input.callId, correlationId });
    this.deps.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(correlationId, {
        callId: input.callId,
      }),
    );

    if (input.breakReason !== undefined) {
      this.deps.eventPublisher.publish(
        createCallRejectReasonSelectedEvent(correlationId, {
          callId: input.callId,
          breakReason: input.breakReason,
        }),
      );
      if (this.deps.hostIntegrationGateway !== undefined) {
        await this.deps.hostIntegrationGateway.emitSoftPhoneBreakReason({
          breakReason: input.breakReason,
          callId: input.callId,
          correlationId,
        });
      }
    }

    if (input.sipCode === 486) {
      this.deps.eventPublisher.publish(
        createCallRejectedByDndEvent(correlationId, {
          callId: input.callId,
          sipCode: 486,
        }),
      );
    }

    this.deps.eventPublisher.publish(
      createCallRejectedEvent(correlationId, {
        callId: input.callId,
        reason: input.breakReason ?? null,
      }),
    );

    this.deps.callTracker.trackCall(ended.call);
    this.deps.callTracker.reconcileActiveIncomingPointer();
    this.deps.logger.info("incoming_call_rejected", {
      correlationId,
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "reject_call",
      previousState: call.state,
      nextState: ended.call.state,
      result: input.sipCode === 486 ? "dnd_486" : "rejected",
    });

    return ok(ended.call);
  }

  async handleCallEnded(callId: CallId, correlationId?: CorrelationId): Promise<void> {
    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    const trackedCall = this.deps.callTracker.resolveForEnded(callId);
    if (trackedCall === null) {
      return;
    }
    const ended = applyCallTransition(trackedCall, "ended");
    if (!ended.transition.ok) {
      this.deps.logger.warn("call_ended_transition_rejected", {
        correlationId: resolvedCorrelationId,
        featureId: "F-004",
        boundedContext: "Telephony",
        operation: "handle_call_ended",
        previousState: trackedCall.state,
        nextState: trackedCall.state,
        result: ended.transition.reason,
      });
      return;
    }

    this.clearAutoAnswerTimer(callId);
    cancelScheduledTonePlaybackStop(callId);
    await this.deps.mediaGateway.stopTone({
      callId,
      correlationId: resolvedCorrelationId,
    });
    this.deps.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(resolvedCorrelationId, { callId }),
    );
    if (trackedCall.state === "Ringing") {
      this.deps.eventPublisher.publish(
        createIncomingCallEndedBeforeAnswerEvent(resolvedCorrelationId, { callId }),
      );
    }
    this.deps.eventPublisher.publish(
      createCallEndedEvent(resolvedCorrelationId, { callId }),
    );
    this.deps.callTracker.trackCall(ended.call);
    this.deps.callTracker.reconcileActiveIncomingPointer();
  }

  private applyAutoAnswerScheduleForCall(
    callId: CallId,
    timeoutSec: number,
    incomingSettings: IncomingCallSettings,
    correlationId: CorrelationId,
  ): void {
    const scheduleDecision = evaluateIncomingAutoAnswerSchedule({
      calls: this.deps.callTracker.getAllTrackedCalls(),
      targetIncomingCallId: callId,
      autoAnswerDuringActiveSessionEnabled:
        incomingSettings.autoAnswerDuringActiveSessionEnabled,
      transferSession: this.deps.callTracker.getTransferSession(),
      transferModeActive: this.deps.callTracker.getTransferModeSourceCallId() !== null,
      timeoutSec,
    });

    const expiresAt =
      scheduleDecision.action === "schedule"
        ? computeAutoAnswerExpiresAt(scheduleDecision.timeoutSec)
        : null;

    this.deps.eventPublisher.publish(
      createIncomingCallRingingStartedEvent(correlationId, {
        callId,
        autoAnswerTimeoutSec:
          scheduleDecision.action === "schedule" ? scheduleDecision.timeoutSec : null,
        autoAnswerExpiresAt: expiresAt,
      }),
    );

    if (scheduleDecision.action === "schedule") {
      this.scheduleAutoAnswer(callId, scheduleDecision.timeoutSec);
      return;
    }

    if (scheduleDecision.reason === "other_session_busy_policy") {
      this.deps.multiCallPolicyService.publishAutoAnswerBlocked(callId, correlationId);
      return;
    }

    this.logAutoAnswerSuppressed(callId, scheduleDecision.reason);
  }

  private scheduleAutoAnswer(callId: CallId, timeoutSec: number): void {
    this.clearAutoAnswerTimer(callId);
    const timer = setTimeout(() => {
      void this.executeScheduledAutoAnswer(callId, timeoutSec);
    }, timeoutSec * 1000);
    this.autoAnswerTimers.set(callId, timer);
  }

  private async executeScheduledAutoAnswer(
    callId: CallId,
    timeoutSec: number,
  ): Promise<void> {
    const incomingSettings = await this.deps.settingsRepository.getIncomingCallSettings();
    const autoAnswerDecision = decideAutoAnswer(incomingSettings);
    if (autoAnswerDecision === null) {
      return;
    }

    const globalBlock = evaluateAutoAnswerGlobalBlock(
      this.deps.callTracker.getAllTrackedCalls(),
      this.deps.callTracker.getTransferSession(),
      this.deps.callTracker.getTransferModeSourceCallId() !== null,
    );
    if (globalBlock !== null) {
      this.logAutoAnswerSuppressed(callId, globalBlock);
      return;
    }

    const result = await this.answerCall({
      callId,
      autoAnswered: true,
      timeoutSec,
    });
    if (!result.ok) {
      this.deps.logger.warn("scheduled_auto_answer_failed", {
        correlationId: createCorrelationId(),
        featureId: "F-002",
        boundedContext: "Telephony",
        operation: "auto_answer",
        previousState: "Ringing",
        nextState: "Ringing",
        result: "failed",
        normalizedError: result.error.message,
      });
    }
  }

  private logAutoAnswerSuppressed(
    callId: CallId,
    reason: AutoAnswerBlockedReason,
  ): void {
    this.deps.logger.warn("auto_answer_suppressed", {
      correlationId: createCorrelationId(),
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "auto_answer",
      previousState: "Ringing",
      nextState: "Ringing",
      result: reason,
      normalizedError: callId,
    });
  }

  private clearAutoAnswerTimer(callId: CallId): void {
    const timer = this.autoAnswerTimers.get(callId);
    if (timer === undefined) {
      return;
    }
    clearTimeout(timer);
    this.autoAnswerTimers.delete(callId);
  }
}
