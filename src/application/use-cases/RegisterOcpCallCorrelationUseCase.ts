import { createCallId } from "@domain/telephony/CallId.js";
import {
  createOcpCallCorrelation,
  createOcpCallCorrelationRegisteredEvent,
  createMainAcallId,
  parseMainAcallId,
  type CallId,
  type MainAcallId,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  OcpCallCorrelationRegistry,
} from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type RegisterOcpCallCorrelationInput = Readonly<{
  callId: CallId | string;
  mainAcallId: MainAcallId | string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: persist CallId ↔ main_acallid correlation for inbound OCP sync.
 * - Inputs: branded callId, mainAcallId, optional correlationId.
 * - Outputs: registry entry and OcpCallCorrelationRegistered event.
 */
export class RegisterOcpCallCorrelationUseCase {
  constructor(
    private readonly registry: OcpCallCorrelationRegistry,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  execute(input: RegisterOcpCallCorrelationInput): Result<void, PlatformError> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const callId = parseCallIdInput(input.callId);
    if (callId === null) {
      return err(createPlatformError("validation_failed", "Invalid callId"));
    }

    const mainAcallId = parseMainAcallIdInput(input.mainAcallId);
    if (mainAcallId === null) {
      return err(createPlatformError("validation_failed", "Invalid mainAcallId"));
    }

    const correlation = createOcpCallCorrelation(callId, mainAcallId);
    this.registry.register(correlation);
    this.eventPublisher.publish(
      createOcpCallCorrelationRegisteredEvent(correlationId, {
        callId,
        mainAcallId,
      }),
    );

    this.logger.info("ocp_call_correlation_registered", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "register_ocp_correlation",
      callId,
      result: "succeeded",
    });

    return ok(undefined);
  }
}

function parseCallIdInput(value: CallId | string): CallId | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return createCallId(value);
}

function parseMainAcallIdInput(value: MainAcallId | string): MainAcallId | null {
  if (typeof value === "string" && value.length > 0) {
    try {
      return createMainAcallId(value);
    } catch {
      return parseMainAcallId(value);
    }
  }
  return null;
}
