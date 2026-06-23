import {
  countEstablishedCalls,
  createAllOtherCallsHeldEvent,
  createSecondSessionBlockedEvent,
  evaluateSecondSessionBlock,
  getCallsToHoldBeforeOutgoing,
  getCallsToHoldForExclusiveResume,
  type Call,
  type CallId,
  type SecondSessionDirection,
} from "@domain/index.js";
import type { DomainEventPublisher, Logger, SettingsRepository } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { CallTracker } from "./CallTracker.js";
import type { HoldCallInput } from "./activeCallControlTypes.js";

type HoldCallExecutor = (
  input: HoldCallInput,
) => Promise<Result<Call, PlatformError>>;

type MultiCallPolicyServiceDeps = Readonly<{
  settingsRepository: SettingsRepository;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  callTracker: CallTracker;
  holdCall: HoldCallExecutor;
}>;

/**
 * - Purpose: orchestrate multi-call policy checks and hold-all batches.
 * - Inputs: settings, tracked calls, hold executor, correlation id.
 * - Outputs: policy pass/fail results and domain events for projections.
 */
export class MultiCallPolicyService {
  constructor(private readonly deps: MultiCallPolicyServiceDeps) {}

  async checkSecondSessionBlocked(
    direction: SecondSessionDirection,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const settings = await this.deps.settingsRepository.getMultiCallSettings();
    const establishedCalls = this.deps.callTracker.getEstablishedCalls();
    const decision = evaluateSecondSessionBlock(
      countEstablishedCalls(establishedCalls),
      settings,
    );
    if (!decision.blocked) {
      return ok(undefined);
    }

    this.deps.eventPublisher.publish(
      createSecondSessionBlockedEvent(correlationId, {
        direction,
        reason: decision.reason,
        blockingCallIds: establishedCalls.map((call) => call.id),
      }),
    );
    this.deps.logger.warn("second_session_blocked", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "multi_call_policy",
      previousState: "established",
      nextState: "blocked",
      result: decision.reason,
      normalizedError: direction,
    });

    return err(
      createPlatformError("validation_failed", "Second session disabled by policy"),
    );
  }

  async holdAllBeforeOutgoing(
    correlationId: CorrelationId,
  ): Promise<Result<ReadonlyArray<CallId>, PlatformError>> {
    const callsToHold = getCallsToHoldBeforeOutgoing(
      this.deps.callTracker.getAllTrackedCalls(),
    );
    if (callsToHold.length === 0) {
      return ok([]);
    }

    this.deps.eventPublisher.publish(
      createAllOtherCallsHeldEvent(correlationId, {
        heldCallIds: callsToHold.map((call) => call.id),
        trigger: "before_outgoing",
        phase: "in_progress",
      }),
    );

    const heldCallIds: CallId[] = [];
    for (const call of callsToHold) {
      const holdResult = await this.deps.holdCall({
        callId: call.id,
        correlationId,
      });
      if (isErr(holdResult)) {
        this.deps.eventPublisher.publish(
          createAllOtherCallsHeldEvent(correlationId, {
            heldCallIds,
            trigger: "before_outgoing",
            phase: "failed",
          }),
        );
        this.deps.logger.error("hold_all_before_outgoing_failed", {
          correlationId,
          featureId: "F-007",
          boundedContext: "Telephony",
          operation: "hold_all_before_outgoing",
          previousState: call.state,
          nextState: call.state,
          result: "failed",
          normalizedError: holdResult.error.message,
        });
        return holdResult;
      }
      heldCallIds.push(call.id);
    }

    this.deps.eventPublisher.publish(
      createAllOtherCallsHeldEvent(correlationId, {
        heldCallIds,
        trigger: "before_outgoing",
        phase: "completed",
      }),
    );
    this.deps.logger.info("hold_all_before_outgoing_completed", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "hold_all_before_outgoing",
      previousState: "established",
      nextState: "held",
      result: "completed",
    });

    return ok(heldCallIds);
  }

  async enforceExclusiveHoldBeforeResume(
    targetCallId: CallId,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const callsToHold = getCallsToHoldForExclusiveResume(
      this.deps.callTracker.getAllTrackedCalls(),
      targetCallId,
    );
    for (const call of callsToHold) {
      const holdResult = await this.deps.holdCall({
        callId: call.id,
        correlationId,
      });
      if (isErr(holdResult)) {
        this.deps.logger.error("exclusive_hold_before_resume_failed", {
          correlationId,
          featureId: "F-007",
          boundedContext: "Telephony",
          operation: "exclusive_hold_before_resume",
          previousState: call.state,
          nextState: call.state,
          result: "failed",
          normalizedError: holdResult.error.message,
        });
        return holdResult;
      }
    }
    return ok(undefined);
  }
}
