import {
  applyCallTransition,
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
  createRemoteAudioAttachedEvent,
  type Call,
  type CallId,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  MediaGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import { decideAutoAnswer } from "@application/policies/AutoAnswerPolicy.js";
import { decideDndIncomingReject } from "@application/policies/DndRejectPolicy.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { CallTracker } from "./CallTracker.js";
import type {
  AnswerCallInput,
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
}>;

export class IncomingCallOrchestrator {
  private autoAnswerTimer: ReturnType<typeof setTimeout> | null = null;

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

    const incomingSettings = await this.deps.settingsRepository.getIncomingCallSettings();
    const autoAnswerDecision = decideAutoAnswer(incomingSettings);
    this.deps.eventPublisher.publish(
      createIncomingCallRingingStartedEvent(correlationId, {
        callId: ringingTransition.call.id,
        autoAnswerTimeoutSec:
          autoAnswerDecision !== null ? autoAnswerDecision.timeoutSec : null,
      }),
    );
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
      this.scheduleAutoAnswer(ringingTransition.call.id, autoAnswerDecision.timeoutSec);
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

  async answerCall(
    input: AnswerCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const call = this.deps.callTracker.getActiveIncomingCall();
    if (call === null || call.id !== input.callId) {
      return err(createPlatformError("validation_failed", "Incoming call not found"));
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

    this.clearAutoAnswerTimer();
    await this.deps.mediaGateway.stopRingtone({ callId: input.callId, correlationId });
    this.deps.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(correlationId, {
        callId: input.callId,
      }),
    );
    await this.deps.mediaGateway.attachRemoteAudio({
      callId: input.callId,
      correlationId,
    });
    this.deps.eventPublisher.publish(
      createRemoteAudioAttachedEvent(correlationId, {
        callId: input.callId,
      }),
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

  async rejectCall(
    input: RejectCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const call = this.deps.callTracker.getActiveIncomingCall();
    if (call === null || call.id !== input.callId) {
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

    this.clearAutoAnswerTimer();
    await this.deps.mediaGateway.stopRingtone({ callId: input.callId, correlationId });
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

    this.deps.callTracker.setActiveIncomingCall(null);
    this.deps.callTracker.trackCall(ended.call);
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
      return;
    }

    this.clearAutoAnswerTimer();
    await this.deps.mediaGateway.stopRingtone({
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
    this.deps.callTracker.setActiveIncomingCall(null);
  }

  private scheduleAutoAnswer(callId: CallId, timeoutSec: number): void {
    this.clearAutoAnswerTimer();
    this.autoAnswerTimer = setTimeout(() => {
      void this.answerCall({
        callId,
        autoAnswered: true,
        timeoutSec,
      });
    }, timeoutSec * 1000);
  }

  private clearAutoAnswerTimer(): void {
    if (this.autoAnswerTimer !== null) {
      clearTimeout(this.autoAnswerTimer);
      this.autoAnswerTimer = null;
    }
  }
}
