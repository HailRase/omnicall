import type { DomainEvent } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import { CallHistoryCallTracker } from "../../read-models/CallHistoryCallTracker.js";
import type { RecordCallHistoryUseCase } from "../../use-cases/contacts/RecordCallHistoryUseCase.js";

/**
 * - Purpose: record call history when telephony end events occur (F-013).
 * - Inputs: CallEnded, IncomingCallEndedBeforeAnswer, CallRejected, CallFailed domain events.
 * - Outputs: RecordCallHistoryUseCase invocation with tracked session snapshot.
 */
export class CallHistoryRecordingOrchestrationService {
  private readonly tracker = new CallHistoryCallTracker();

  constructor(
    private readonly recordCallHistory: RecordCallHistoryUseCase,
    private readonly logger: Logger,
  ) {}

  subscribe(eventPublisher: DomainEventPublisher): void {
    eventPublisher.subscribe((event) => {
      void this.handleEvent(event);
    });
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const snapshot = this.tracker.consume(event);
    if (snapshot === null) {
      return;
    }

    const result = await this.recordCallHistory.execute({
      snapshot,
      correlationId: event.correlationId,
    });

    if (isErr(result)) {
      this.logger.warn("call_history_recording_orchestration_failed", {
        correlationId: event.correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "call_history_recording_orchestration",
        callId: snapshot.callId,
        result: result.error.code,
      });
    }
  }
}
