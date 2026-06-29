import {
  countEstablishedCalls,
  createAllOtherCallsHeldEvent,
  createMultiCallOperationRejectedEvent,
  createSecondSessionBlockedEvent,
  evaluateSecondSessionBlock,
  getCallsToHoldBeforeOutgoing,
  getCallsToHoldForExclusiveResume,
  hasConnectingCall,
  type Call,
  type CallId,
  type HoldAllTrigger,
  type MultiCallOperationScenario,
  type SecondSessionDirection,
} from "@domain/index.js";
import type { DomainEventPublisher, Logger, MediaGateway, SettingsRepository } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { CallTracker } from "./CallTracker.js";
import { reconcileCallTracker } from "./callTrackerReconciliation.js";
import { stopTonesOnOtherLines } from "./multiCallMediaHelpers.js";
import type { HoldCallInput, ResumeCallInput } from "./activeCallControlTypes.js";

type HoldCallExecutor = (
  input: HoldCallInput,
) => Promise<Result<Call, PlatformError>>;

type ResumeCallExecutor = (
  input: ResumeCallInput,
) => Promise<Result<Call, PlatformError>>;

type ConflictingOperation = SecondSessionDirection | "resume";

type MultiCallPolicyServiceDeps = Readonly<{
  settingsRepository: SettingsRepository;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  callTracker: CallTracker;
  mediaGateway: MediaGateway;
  holdCall: HoldCallExecutor;
  resumeCall: ResumeCallExecutor;
}>;

/**
 * - Purpose: orchestrate multi-call policy checks and hold-all batches.
 * - Inputs: settings, tracked calls, hold/resume executors, correlation id.
 * - Outputs: policy pass/fail results and domain events for projections.
 */
export class MultiCallPolicyService {
  private holdAllBatchInProgress = false;

  constructor(private readonly deps: MultiCallPolicyServiceDeps) {}

  async checkSecondSessionBlocked(
    direction: SecondSessionDirection,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    reconcileCallTracker(this.deps.callTracker);
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

  checkConflictingOperationBlocked(
    operation: ConflictingOperation,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    reconcileCallTracker(this.deps.callTracker);
    if (this.holdAllBatchInProgress) {
      return Promise.resolve(
        this.rejectOperation(
          "hold_all_in_progress",
          "Hold-all batch in progress",
          [],
          correlationId,
          operation,
        ),
      );
    }

    const calls = this.deps.callTracker.getAllTrackedCalls();
    if (hasConnectingCall(calls)) {
      return Promise.resolve(
        this.rejectOperation(
          "connecting_in_progress",
          "Another call is connecting",
          calls.filter((call) => call.state === "Connecting").map((call) => call.id),
          correlationId,
          operation,
        ),
      );
    }

    return Promise.resolve(ok(undefined));
  }

  async holdAllActiveLines(
    correlationId: CorrelationId,
    trigger: HoldAllTrigger,
  ): Promise<Result<ReadonlyArray<CallId>, PlatformError>> {
    reconcileCallTracker(this.deps.callTracker);
    const callsToHold = getCallsToHoldBeforeOutgoing(
      this.deps.callTracker.getAllTrackedCalls(),
    );
    if (callsToHold.length === 0) {
      return ok([]);
    }

    this.holdAllBatchInProgress = true;
    this.deps.eventPublisher.publish(
      createAllOtherCallsHeldEvent(correlationId, {
        heldCallIds: callsToHold.map((call) => call.id),
        trigger,
        phase: "in_progress",
      }),
    );

    const heldCallIds: CallId[] = [];
    try {
      for (const call of callsToHold) {
        const holdResult = await this.deps.holdCall({
          callId: call.id,
          correlationId,
        });
        if (isErr(holdResult)) {
          const rollbackFailedCallIds = await this.compensatingUnhold(
            heldCallIds,
            correlationId,
          );
          this.deps.eventPublisher.publish(
            createAllOtherCallsHeldEvent(correlationId, {
              heldCallIds,
              trigger,
              phase: "failed",
            }),
          );
          if (rollbackFailedCallIds.length > 0) {
            this.publishPolicyRejected(
              "hold_all_rollback_failed",
              "Hold-all rollback partially failed",
              [...heldCallIds, ...rollbackFailedCallIds],
              correlationId,
            );
          } else {
            this.publishPolicyRejected(
              "hold_all_failed",
              holdResult.error.message,
              [...heldCallIds, call.id],
              correlationId,
            );
          }
          this.deps.logger.error("hold_all_active_lines_failed", {
            correlationId,
            featureId: "F-007",
            boundedContext: "Telephony",
            operation: "hold_all_active_lines",
            previousState: call.state,
            nextState: call.state,
            result: "failed",
            normalizedError: holdResult.error.message,
          });
          return holdResult;
        }
        heldCallIds.push(call.id);
        await this.deps.mediaGateway.stopTone({ callId: call.id, correlationId });
      }

      this.deps.eventPublisher.publish(
        createAllOtherCallsHeldEvent(correlationId, {
          heldCallIds,
          trigger,
          phase: "completed",
        }),
      );
      this.deps.logger.info("hold_all_active_lines_completed", {
        correlationId,
        featureId: "F-007",
        boundedContext: "Telephony",
        operation: "hold_all_active_lines",
        previousState: "established",
        nextState: "held",
        result: "completed",
      });

      return ok(heldCallIds);
    } finally {
      this.holdAllBatchInProgress = false;
    }
  }

  async enforceExclusiveHoldBeforeResume(
    targetCallId: CallId,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    reconcileCallTracker(this.deps.callTracker);
    const blockResult = await this.checkConflictingOperationBlocked(
      "resume",
      correlationId,
    );
    if (isErr(blockResult)) {
      return blockResult;
    }

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
      await this.deps.mediaGateway.stopTone({ callId: call.id, correlationId });
    }

    await stopTonesOnOtherLines(
      {
        mediaGateway: this.deps.mediaGateway,
        callTracker: this.deps.callTracker,
      },
      targetCallId,
      correlationId,
    );
    return ok(undefined);
  }

  publishAutoAnswerBlocked(
    incomingCallId: CallId,
    correlationId: CorrelationId,
  ): void {
    const establishedCalls = this.deps.callTracker.getEstablishedCalls();
    this.publishPolicyRejected(
      "auto_answer_blocked",
      "Auto-answer blocked while another call is active",
      [...establishedCalls.map((call) => call.id), incomingCallId],
      correlationId,
    );
    this.deps.logger.warn("auto_answer_blocked", {
      correlationId,
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "auto_answer",
      previousState: "established",
      nextState: "blocked",
      result: "auto_answer_blocked",
    });
  }

  private async compensatingUnhold(
    heldCallIds: ReadonlyArray<CallId>,
    correlationId: CorrelationId,
  ): Promise<ReadonlyArray<CallId>> {
    const rollbackFailedCallIds: CallId[] = [];
    for (const callId of heldCallIds) {
      const resumeResult = await this.deps.resumeCall({ callId, correlationId });
      if (isErr(resumeResult)) {
        rollbackFailedCallIds.push(callId);
        this.deps.logger.error("hold_all_rollback_unhold_failed", {
          correlationId,
          featureId: "F-007",
          boundedContext: "Telephony",
          operation: "hold_all_rollback",
          previousState: "Held",
          nextState: "Held",
          result: "failed",
          normalizedError: resumeResult.error.message,
        });
      }
    }
    return rollbackFailedCallIds;
  }

  private rejectOperation(
    scenario: MultiCallOperationScenario,
    reason: string,
    affectedCallIds: ReadonlyArray<CallId>,
    correlationId: CorrelationId,
    operation: ConflictingOperation,
  ): Result<void, PlatformError> {
    this.publishPolicyRejected(scenario, reason, affectedCallIds, correlationId);
    this.deps.logger.warn("multi_call_operation_rejected", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation,
      previousState: scenario,
      nextState: "blocked",
      result: reason,
    });
    return err(createPlatformError("validation_failed", reason));
  }

  private publishPolicyRejected(
    scenario: MultiCallOperationScenario,
    reason: string,
    affectedCallIds: ReadonlyArray<CallId>,
    correlationId: CorrelationId,
  ): void {
    this.deps.eventPublisher.publish(
      createMultiCallOperationRejectedEvent(correlationId, {
        scenario,
        reason,
        affectedCallIds,
      }),
    );
  }
}
