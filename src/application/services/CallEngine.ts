import {
  applyCallTransition,
  createCallAnsweredEvent,
  createCallEndedEvent,
  createCallFailedEvent,
  createCallId,
  createCallProgressReceivedEvent,
  createBusyToneStartedEvent,
  createDtmfFailedEvent,
  createDtmfSentEvent,
  createFailedToneStartedEvent,
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
  Logger,
  MediaGateway,
  TelephonyGateway,
} from "@ports/index.js";
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

export class CallEngine {
  constructor(
    private readonly telephonyGateway: TelephonyGateway,
    private readonly mediaGateway: MediaGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
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

