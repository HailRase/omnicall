import {
  applyCallTransition,
  createBusyToneStartedEvent,
  createCallAnsweredEvent,
  createCallFailedEvent,
  createCallId,
  createCallProgressReceivedEvent,
  createFailedToneStartedEvent,
  createOutgoingCall,
  createOutgoingCallRequestedEvent,
  createOutgoingCallStartedEvent,
  createRingbackToneStartedEvent,
  mapCallFailureReason,
  type Call,
  type CallFailureReason,
  type CallId,
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
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { CallTracker } from "./CallTracker.js";
import type { MultiCallPolicyService } from "./MultiCallPolicyService.js";
import {
  cancelScheduledTonePlaybackStop,
  scheduleTonePlaybackStop,
} from "./scheduleTonePlaybackStop.js";
import { attachRemoteAudioWhenReady } from "./remoteAudioAttach.js";
import { resolveTerminalFailureToneDuration } from "../../policies/tonePlaybackPolicy.js";
import type {
  HandleCallAnsweredInput,
  HandleCallFailedInput,
  HandleCallProgressInput,
  MakeCallInput,
} from "./callEngineTypes.js";

type OutgoingCallOrchestratorDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  callTracker: CallTracker;
  multiCallPolicyService: MultiCallPolicyService;
}>;

export class OutgoingCallOrchestrator {
  constructor(private readonly deps: OutgoingCallOrchestratorDeps) {}

  async makeCall(
    input: MakeCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    const connectingBlock = await this.deps.multiCallPolicyService.checkConflictingOperationBlocked(
      "outgoing",
      correlationId,
    );
    if (isErr(connectingBlock)) {
      return err(connectingBlock.error);
    }

    const blockResult = await this.deps.multiCallPolicyService.checkSecondSessionBlocked(
      "outgoing",
      correlationId,
    );
    if (isErr(blockResult)) {
      return err(blockResult.error);
    }

    const holdAllResult = await this.deps.multiCallPolicyService.holdAllActiveLines(
      correlationId,
      "before_outgoing",
    );
    if (isErr(holdAllResult)) {
      return err(holdAllResult.error);
    }

    const callId = input.callId ?? createCallId(`call-${correlationId}`);
    const initialCall = createOutgoingCall(callId, input.phoneNumber);

    this.deps.eventPublisher.publish(
      createOutgoingCallRequestedEvent(correlationId, {
        callId,
        phoneNumber: input.phoneNumber,
      }),
    );

    this.deps.logger.info("outgoing_call_requested", {
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
    this.deps.callTracker.trackCall(call);

    try {
      const gatewayResult = await this.deps.telephonyGateway.makeCall({
        callId,
        number: input.phoneNumber,
        correlationId,
      });

      if (isErr(gatewayResult)) {
        return this.failCall(call, correlationId, gatewayResult.error.message);
      }

      this.deps.eventPublisher.publish(
        createOutgoingCallStartedEvent(correlationId, { callId }),
      );

      this.deps.logger.info("outgoing_call_started", {
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
        this.deps.callTracker.trackCall(call);
      }

      if (gatewayResult.value.stage === "answered") {
        const answered = await this.handleAnswered({ call, correlationId });
        if (isErr(answered)) {
          return answered;
        }
        call = answered.value;
        this.deps.callTracker.trackCall(call);
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
    this.deps.eventPublisher.publish(
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

    if (input.progressCode === 183 || input.progressCode === 180) {
      await this.deps.mediaGateway.playRingbackTone({
        callId: input.call.id,
        correlationId,
      });
      this.deps.eventPublisher.publish(
        createRingbackToneStartedEvent(correlationId, {
          callId: input.call.id,
        }),
      );
    }
    this.deps.callTracker.trackCall(progressed.call);
    return ok(progressed.call);
  }

  async handleAnswered(
    input: HandleCallAnsweredInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.deps.eventPublisher.publish(
      createCallAnsweredEvent(correlationId, { callId: input.call.id }),
    );
    const answered = applyCallTransition(input.call, "answered");
    if (!answered.transition.ok) {
      return err(createPlatformError("validation_failed", answered.transition.reason));
    }

    cancelScheduledTonePlaybackStop(input.call.id);
    await this.deps.mediaGateway.stopTone({ callId: input.call.id, correlationId });
    await attachRemoteAudioWhenReady(
      {
        mediaGateway: this.deps.mediaGateway,
        eventPublisher: this.deps.eventPublisher,
      },
      input.call.id,
      correlationId,
    );
    this.deps.callTracker.trackCall(answered.call);
    return ok(answered.call);
  }

  async retryRemoteAudioAttach(
    input: HandleCallAnsweredInput,
  ): Promise<void> {
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

  async handleFailed(
    input: HandleCallFailedInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    return this.failCall(input.call, correlationId, input.failure);
  }

  private async failCall(
    call: Call,
    correlationId: CorrelationId,
    details: string,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const failedTransition = applyCallTransition(call, "failed");
    const failedCall = failedTransition.transition.ok ? failedTransition.call : call;
    const reason = mapCallFailureReason(details);

    this.deps.eventPublisher.publish(
      createCallFailedEvent(correlationId, {
        callId: call.id,
        reason,
        details,
      }),
    );

    this.deps.logger.error("outgoing_call_failed", {
      correlationId,
      featureId: "F-003",
      boundedContext: "Telephony",
      operation: "make_call",
      previousState: call.state,
      nextState: failedCall.state,
      result: reason,
      normalizedError: details,
    });

    cancelScheduledTonePlaybackStop(call.id);
    await this.deps.mediaGateway.stopTone({ callId: call.id, correlationId });

    await this.playFailureTone(call.id, correlationId, reason, details);
    this.deps.callTracker.trackCall(failedCall);

    return err(createPlatformError("operation_failed", details));
  }

  private async playFailureTone(
    callId: CallId,
    correlationId: CorrelationId,
    reason: CallFailureReason,
    details: string,
  ): Promise<void> {
    if (reason === "busy") {
      await this.deps.mediaGateway.playBusyTone({ callId, correlationId });
      this.deps.eventPublisher.publish(
        createBusyToneStartedEvent(correlationId, {
          callId,
        }),
      );
      scheduleTonePlaybackStop(
        {
          mediaGateway: this.deps.mediaGateway,
          eventPublisher: this.deps.eventPublisher,
        },
        callId,
        correlationId,
        resolveTerminalFailureToneDuration("busy"),
      );
      return;
    }

    await this.deps.mediaGateway.playFailedTone({
      callId,
      reason: details,
      correlationId,
    });
    this.deps.eventPublisher.publish(
      createFailedToneStartedEvent(correlationId, {
        callId,
      }),
    );
    scheduleTonePlaybackStop(
      {
        mediaGateway: this.deps.mediaGateway,
        eventPublisher: this.deps.eventPublisher,
      },
      callId,
      correlationId,
      resolveTerminalFailureToneDuration("failed"),
    );
  }
}
