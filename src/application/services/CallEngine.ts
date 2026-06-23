import {
  applyCallTransition,
  createCallAutoAnsweredEvent,
  createCallAnsweredEvent,
  createCallEndedEvent,
  createCallFailedEvent,
  createCallId,
  createCallRejectedByDndEvent,
  createCallRejectedEvent,
  createCallRejectReasonSelectedEvent,
  createCallProgressReceivedEvent,
  createBusyToneStartedEvent,
  createDtmfFailedEvent,
  createDtmfSentEvent,
  createFailedToneStartedEvent,
  createIncomingCall,
  createIncomingCallDisplayNameResolvedEvent,
  createIncomingCallEndedBeforeAnswerEvent,
  createIncomingCallReceivedEvent,
  createIncomingCallRingingStartedEvent,
  createIncomingRingtoneStartedEvent,
  createIncomingRingtoneStoppedEvent,
  createPhoneNumber,
  createOutgoingCall,
  createOutgoingCallRequestedEvent,
  createOutgoingCallStartedEvent,
  createRemoteAudioAttachedEvent,
  createRingbackToneStartedEvent,
  mapCallFailureReason,
  type CallFailureReason,
  type Call,
  type CallId,
  type DtmfTone,
  type PhoneNumber,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  MediaGateway,
  SettingsRepository,
  TelephonyIncomingCallNotification,
  TelephonyGateway,
} from "@ports/index.js";
import { decideAutoAnswer } from "@application/policies/AutoAnswerPolicy.js";
import { decideDndIncomingReject } from "@application/policies/DndRejectPolicy.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

/**
 * - Purpose: execute telephony call operations through ports only.
 * - Inputs: validated phone number, call id, dtmf tone, correlation id.
 * - Outputs: call state progression and emitted domain events.
 */
export type MakeCallInput = Readonly<{
  phoneNumber: PhoneNumber;
  callId?: CallId;
  correlationId?: CorrelationId;
}>;

export type SendDtmfInput = Readonly<{
  callId: CallId;
  tone: DtmfTone;
  correlationId?: CorrelationId;
}>;

export type HandleCallProgressInput = Readonly<{
  call: Call;
  progressCode: number;
  correlationId?: CorrelationId;
}>;

export type HandleCallAnsweredInput = Readonly<{
  call: Call;
  correlationId?: CorrelationId;
}>;

export type HandleCallFailedInput = Readonly<{
  call: Call;
  failure: string;
  correlationId?: CorrelationId;
}>;

export type AnswerCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
  autoAnswered?: boolean;
  timeoutSec?: number;
}>;

export type RejectCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
  breakReason?: string;
  sipCode?: number;
}>;

export type HandleIncomingCallInput = Readonly<{
  notification: TelephonyIncomingCallNotification;
}>;

export class CallEngine {
  private activeIncomingCall: Call | null = null;
  private autoAnswerTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly telephonyGateway: TelephonyGateway,
    private readonly mediaGateway: MediaGateway,
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
    private readonly hostIntegrationGateway?: HostIntegrationGateway,
  ) {}

  async makeCall(
    input: MakeCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const callId = input.callId ?? createCallId(`call-${correlationId}`);
    const initialCall = createOutgoingCall(callId, input.phoneNumber);

    this.eventPublisher.publish(
      createOutgoingCallRequestedEvent(correlationId, {
        callId,
        phoneNumber: input.phoneNumber,
      }),
    );

    this.logger.info("outgoing_call_requested", {
      correlationId,
      featureId: "F-003",
      boundedContext: "Telephony",
      operation: "make_call",
      previousState: "Idle",
      nextState: "Connecting",
      result: "requested",
    });

    const requested = applyCallTransition(initialCall, "outgoing_requested");
    if (!requested.transition.ok) {
      return err(
        createPlatformError("validation_failed", requested.transition.reason),
      );
    }
    let call = requested.call;

    try {
      const gatewayResult = await this.telephonyGateway.makeCall({
        callId,
        number: input.phoneNumber,
        correlationId,
      });

      if (isErr(gatewayResult)) {
        return this.failCall(call, correlationId, gatewayResult.error.message);
      }

      this.eventPublisher.publish(
        createOutgoingCallStartedEvent(correlationId, { callId }),
      );

      this.logger.info("outgoing_call_started", {
        correlationId,
        featureId: "F-003",
        boundedContext: "Telephony",
        operation: "make_call",
        previousState: "Connecting",
        nextState: "Connecting",
        result: gatewayResult.value.stage,
      });

      if (gatewayResult.value.stage === "progress") {
        const progressed = await this.handleProgress({
          call,
          progressCode: gatewayResult.value.progressCode,
          correlationId,
        });
        if (isErr(progressed)) {
          return progressed;
        }
        call = progressed.value;
      }

      if (gatewayResult.value.stage === "answered") {
        const answered = await this.handleAnswered({ call, correlationId });
        if (isErr(answered)) {
          return answered;
        }
        call = answered.value;
      }

      return ok(call);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      return this.failCall(call, correlationId, normalized.message);
    }
  }

  async handleProgress(
    input: HandleCallProgressInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.eventPublisher.publish(
      createCallProgressReceivedEvent(correlationId, {
        callId: input.call.id,
        progressCode: input.progressCode,
      }),
    );

    const progressed = applyCallTransition(input.call, "progress_received");
    if (!progressed.transition.ok) {
      return err(
        createPlatformError("validation_failed", progressed.transition.reason),
      );
    }

    if (input.progressCode === 183) {
      await this.mediaGateway.playRingbackTone({
        callId: input.call.id,
        correlationId,
      });
      this.eventPublisher.publish(
        createRingbackToneStartedEvent(correlationId, {
          callId: input.call.id,
        }),
      );
    }

    return ok(progressed.call);
  }

  async handleAnswered(
    input: HandleCallAnsweredInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(
      createCallAnsweredEvent(correlationId, { callId: input.call.id }),
    );
    const answered = applyCallTransition(input.call, "answered");
    if (!answered.transition.ok) {
      return err(createPlatformError("validation_failed", answered.transition.reason));
    }

    await this.mediaGateway.stopTone({ callId: input.call.id, correlationId });
    await this.mediaGateway.attachRemoteAudio({
      callId: input.call.id,
      correlationId,
    });
    this.eventPublisher.publish(
      createRemoteAudioAttachedEvent(correlationId, {
        callId: input.call.id,
      }),
    );
    return ok(answered.call);
  }

  async handleFailed(
    input: HandleCallFailedInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    return this.failCall(input.call, correlationId, input.failure);
  }

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

    const phoneStatus = await this.settingsRepository.getPhoneStatus();
    const dndDecision = decideDndIncomingReject(phoneStatus);
    this.activeIncomingCall = ringingTransition.call;

    this.eventPublisher.publish(
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

    const incomingSettings = await this.settingsRepository.getIncomingCallSettings();
    const autoAnswerDecision = decideAutoAnswer(incomingSettings);
    this.eventPublisher.publish(
      createIncomingCallRingingStartedEvent(correlationId, {
        callId: ringingTransition.call.id,
        autoAnswerTimeoutSec:
          autoAnswerDecision !== null ? autoAnswerDecision.timeoutSec : null,
      }),
    );
    await this.mediaGateway.playRingtone({
      callId: ringingTransition.call.id,
      correlationId,
    });
    this.eventPublisher.publish(
      createIncomingRingtoneStartedEvent(correlationId, {
        callId: ringingTransition.call.id,
      }),
    );

    const displayName = notification.remoteDisplayNameRaw?.trim();
    if (displayName !== undefined && displayName.length > 0) {
      this.eventPublisher.publish(
        createIncomingCallDisplayNameResolvedEvent(correlationId, {
          callId: ringingTransition.call.id,
          displayName,
        }),
      );
    }

    if (autoAnswerDecision !== null) {
      this.scheduleAutoAnswer(ringingTransition.call.id, autoAnswerDecision.timeoutSec);
    }

    this.logger.info("incoming_call_received", {
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
    const call = this.activeIncomingCall;
    if (call === null || call.id !== input.callId) {
      return err(createPlatformError("validation_failed", "Incoming call not found"));
    }

    const answered = applyCallTransition(call, "answered");
    if (!answered.transition.ok) {
      return err(createPlatformError("validation_failed", answered.transition.reason));
    }

    const answerResult = await this.telephonyGateway.answerCall({
      callId: input.callId,
      correlationId,
    });
    if (isErr(answerResult)) {
      return answerResult;
    }

    this.clearAutoAnswerTimer();
    await this.mediaGateway.stopRingtone({ callId: input.callId, correlationId });
    this.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(correlationId, {
        callId: input.callId,
      }),
    );
    await this.mediaGateway.attachRemoteAudio({
      callId: input.callId,
      correlationId,
    });
    this.eventPublisher.publish(
      createRemoteAudioAttachedEvent(correlationId, {
        callId: input.callId,
      }),
    );
    this.eventPublisher.publish(
      createCallAnsweredEvent(correlationId, { callId: input.callId }),
    );
    if (input.autoAnswered === true && input.timeoutSec !== undefined) {
      this.eventPublisher.publish(
        createCallAutoAnsweredEvent(correlationId, {
          callId: input.callId,
          timeoutSec: input.timeoutSec,
        }),
      );
    }

    this.activeIncomingCall = answered.call;
    this.logger.info("incoming_call_answered", {
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
    const call = this.activeIncomingCall;
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
    const rejectResult = await this.telephonyGateway.rejectCall(rejectCommand);
    if (isErr(rejectResult)) {
      return rejectResult;
    }

    const ended = applyCallTransition(ending.call, "reject_completed");
    if (!ended.transition.ok) {
      return err(createPlatformError("validation_failed", ended.transition.reason));
    }

    this.clearAutoAnswerTimer();
    await this.mediaGateway.stopRingtone({ callId: input.callId, correlationId });
    this.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(correlationId, {
        callId: input.callId,
      }),
    );

    if (input.breakReason !== undefined) {
      this.eventPublisher.publish(
        createCallRejectReasonSelectedEvent(correlationId, {
          callId: input.callId,
          breakReason: input.breakReason,
        }),
      );
      if (this.hostIntegrationGateway !== undefined) {
        await this.hostIntegrationGateway.emitSoftPhoneBreakReason({
          breakReason: input.breakReason,
          callId: input.callId,
          correlationId,
        });
      }
    }

    if (input.sipCode === 486) {
      this.eventPublisher.publish(
        createCallRejectedByDndEvent(correlationId, {
          callId: input.callId,
          sipCode: 486,
        }),
      );
    }

    this.eventPublisher.publish(
      createCallRejectedEvent(correlationId, {
        callId: input.callId,
        reason: input.breakReason ?? null,
      }),
    );

    this.activeIncomingCall = null;
    this.logger.info("incoming_call_rejected", {
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
    const activeCall = this.activeIncomingCall;
    if (activeCall === null || activeCall.id !== callId) {
      return;
    }
    const ended = applyCallTransition(activeCall, "ended");
    if (!ended.transition.ok) {
      return;
    }

    this.clearAutoAnswerTimer();
    await this.mediaGateway.stopRingtone({
      callId,
      correlationId: resolvedCorrelationId,
    });
    this.eventPublisher.publish(
      createIncomingRingtoneStoppedEvent(resolvedCorrelationId, { callId }),
    );
    if (activeCall.state === "Ringing") {
      this.eventPublisher.publish(
        createIncomingCallEndedBeforeAnswerEvent(resolvedCorrelationId, { callId }),
      );
    }
    this.eventPublisher.publish(
      createCallEndedEvent(resolvedCorrelationId, { callId }),
    );
    this.activeIncomingCall = null;
  }

  async hangup(
    call: Call,
    correlationIdInput?: CorrelationId,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = correlationIdInput ?? createCorrelationId();
    const gatewayResult = await this.telephonyGateway.hangup({
      callId: call.id,
      correlationId,
    });
    if (isErr(gatewayResult)) {
      return err(gatewayResult.error);
    }

    const ended = applyCallTransition(call, "ended");
    if (!ended.transition.ok) {
      return err(createPlatformError("validation_failed", ended.transition.reason));
    }
    await this.mediaGateway.stopTone({ callId: call.id, correlationId });
    this.eventPublisher.publish(
      createCallEndedEvent(correlationId, {
        callId: call.id,
      }),
    );
    return ok(ended.call);
  }

  async sendDtmf(
    input: SendDtmfInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    try {
      const gatewayResult = await this.telephonyGateway.sendDtmf({
        callId: input.callId,
        tone: input.tone,
        correlationId,
      });

      if (isErr(gatewayResult)) {
        this.eventPublisher.publish(
          createDtmfFailedEvent(correlationId, {
            callId: input.callId,
            tone: input.tone,
            reason: gatewayResult.error.message,
          }),
        );

        this.logger.error("dtmf_failed", {
          correlationId,
          featureId: "F-008",
          boundedContext: "Telephony",
          operation: "send_dtmf",
          previousState: "Active",
          nextState: "Active",
          result: gatewayResult.error.code,
        });

        return gatewayResult;
      }

      this.eventPublisher.publish(
        createDtmfSentEvent(correlationId, {
          callId: input.callId,
          tone: input.tone,
        }),
      );

      this.logger.info("dtmf_sent", {
        correlationId,
        featureId: "F-008",
        boundedContext: "Telephony",
        operation: "send_dtmf",
        previousState: "Active",
        nextState: "Active",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.eventPublisher.publish(
        createDtmfFailedEvent(correlationId, {
          callId: input.callId,
          tone: input.tone,
          reason: normalized.message,
        }),
      );
      return err(normalized);
    }
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

  private async failCall(
    call: Call,
    correlationId: CorrelationId,
    details: string,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const failedTransition = applyCallTransition(call, "failed");
    const failedCall = failedTransition.transition.ok ? failedTransition.call : call;
    const reason = mapCallFailureReason(details);

    this.eventPublisher.publish(
      createCallFailedEvent(correlationId, {
        callId: call.id,
        reason,
        details,
      }),
    );

    this.logger.error("outgoing_call_failed", {
      correlationId,
      featureId: "F-003",
      boundedContext: "Telephony",
      operation: "make_call",
      previousState: call.state,
      nextState: failedCall.state,
      result: reason,
    });

    await this.playFailureTone(call.id, correlationId, reason, details);

    return err(createPlatformError("operation_failed", details));
  }

  private async playFailureTone(
    callId: CallId,
    correlationId: CorrelationId,
    reason: CallFailureReason,
    details: string,
  ): Promise<void> {
    if (reason === "busy") {
      await this.mediaGateway.playBusyTone({ callId, correlationId });
      this.eventPublisher.publish(
        createBusyToneStartedEvent(correlationId, {
          callId,
        }),
      );
      return;
    }

    await this.mediaGateway.playFailedTone({
      callId,
      reason: details,
      correlationId,
    });
    this.eventPublisher.publish(
      createFailedToneStartedEvent(correlationId, {
        callId,
      }),
    );
  }
}

