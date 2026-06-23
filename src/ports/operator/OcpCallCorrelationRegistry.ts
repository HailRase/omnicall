import type { OcpCallCorrelation } from "@domain/operator/ocp/OcpCallCorrelation.js";
import type { CallId } from "@domain/telephony/CallId.js";
import type { MainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { DomainEventPublisher } from "../events/DomainEventPublisher.js";

/**
 * - Purpose: application read model linking CallId to OCP main_acallid.
 * - Inputs: register/remove/query by CallId or MainAcallId.
 * - Outputs: correlation snapshots for inbound sync matching.
 */
export interface OcpCallCorrelationRegistry {
  register(correlation: OcpCallCorrelation): void;
  getByCallId(callId: CallId): OcpCallCorrelation | null;
  getByMainAcallId(mainAcallId: MainAcallId): OcpCallCorrelation | null;
  removeByCallId(callId: CallId): void;
  listAll(): ReadonlyArray<OcpCallCorrelation>;
  clear(): void;
  bindLifecycleEvents(eventPublisher: DomainEventPublisher): void;
}
