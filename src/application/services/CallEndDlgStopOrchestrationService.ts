import { createCallId, type CallId, type DlgStopTrigger, type DomainEvent } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { OcpCallCorrelationRegistry, DomainEventPublisher, Logger } from "@ports/index.js";
import type { SendDlgStopUseCase } from "../use-cases/SendDlgStopUseCase.js";

/**
 * - Purpose: trigger dlg_stop on call end/fail without coupling CallEngine to OCP (LF-064).
 * - Inputs: CallEnded, IncomingCallEndedBeforeAnswer, CallFailed domain events.
 * - Outputs: SendDlgStopUseCase invocation with correlation lookup.
 */
export class CallEndDlgStopOrchestrationService {
  constructor(
    private readonly sendDlgStop: SendDlgStopUseCase,
    private readonly correlationRegistry: OcpCallCorrelationRegistry,
    private readonly logger: Logger,
  ) {}

  subscribe(eventPublisher: DomainEventPublisher): void {
    eventPublisher.subscribe((event) => {
      void this.handleEvent(event);
    });
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const trigger = mapDlgStopTrigger(event.type);
    if (trigger === null) {
      return;
    }

    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return;
    }

    const correlation = this.correlationRegistry.getByCallId(callId);
    const result = await this.sendDlgStop.execute({
      callId,
      mainAcallId: correlation?.mainAcallId ?? null,
      trigger,
      correlationId: event.correlationId,
    });

    if (result.ok && result.value.status === "skipped" && result.value.reason === "duplicate") {
      return;
    }

    if (isErr(result)) {
      this.logger.warn("call_end_dlg_stop_orchestration_failed", {
        correlationId: event.correlationId,
        featureId: "F-015",
        boundedContext: "Operator",
        operation: "call_end_dlg_stop_orchestration",
        callId,
        trigger,
        result: result.error.code,
      });
    }
  }
}

function mapDlgStopTrigger(eventType: string): DlgStopTrigger | null {
  switch (eventType) {
    case "CallEnded":
      return "call_ended";
    case "IncomingCallEndedBeforeAnswer":
      return "incoming_ended_before_answer";
    case "CallFailed":
      return "call_failed";
    default:
      return null;
  }
}

function parseCallId(value: unknown): CallId | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return createCallId(value);
}
