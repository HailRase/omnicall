import type { DomainEvent } from "@domain/index.js";
import type { OcpCallCorrelation } from "@domain/operator/ocp/OcpCallCorrelation.js";
import { createCallId, type CallId } from "@domain/telephony/CallId.js";
import type { MainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { OcpCallCorrelationRegistry } from "@ports/operator/OcpCallCorrelationRegistry.js";
import type { DomainEventPublisher } from "@ports/index.js";

/**
 * - Purpose: in-memory CallId ↔ main_acallid registry with lifecycle cleanup.
 * - Inputs: explicit register API and domain events for call end and OCP reset.
 * - Outputs: correlation lookups for inbound queue_info matching.
 */
export class InMemoryOcpCallCorrelationRegistry implements OcpCallCorrelationRegistry {
  private readonly byCallId = new Map<string, OcpCallCorrelation>();
  private readonly byMainAcallId = new Map<string, OcpCallCorrelation>();

  constructor(eventPublisher?: DomainEventPublisher) {
    if (eventPublisher !== undefined) {
      eventPublisher.subscribe((event) => {
        this.applyLifecycleEvent(event);
      });
    }
  }

  register(correlation: OcpCallCorrelation): void {
    this.byCallId.set(correlation.callId, correlation);
    this.byMainAcallId.set(correlation.mainAcallId, correlation);
  }

  getByCallId(callId: CallId): OcpCallCorrelation | null {
    return this.byCallId.get(callId) ?? null;
  }

  getByMainAcallId(mainAcallId: MainAcallId): OcpCallCorrelation | null {
    return this.byMainAcallId.get(mainAcallId) ?? null;
  }

  removeByCallId(callId: CallId): void {
    const existing = this.byCallId.get(callId);
    if (existing === undefined) {
      return;
    }
    this.byCallId.delete(callId);
    this.byMainAcallId.delete(existing.mainAcallId);
  }

  listAll(): ReadonlyArray<OcpCallCorrelation> {
    return [...this.byCallId.values()];
  }

  clear(): void {
    this.byCallId.clear();
    this.byMainAcallId.clear();
  }

  private applyLifecycleEvent(event: DomainEvent): void {
    switch (event.type) {
      case "CallEnded":
      case "IncomingCallEndedBeforeAnswer": {
        const callId = parseCallId(event["callId"]);
        if (callId !== null) {
          this.removeByCallId(callId);
        }
        return;
      }
      case "OcpAuthenticationFailed":
        this.clear();
        return;
      case "StartupModeResolved": {
        const resolution = event["resolution"];
        if (
          resolution !== undefined &&
          typeof resolution === "object" &&
          resolution !== null &&
          "action" in resolution &&
          resolution.action === "sip_only_ready"
        ) {
          this.clear();
        }
        return;
      }
      default:
        return;
    }
  }
}

function parseCallId(value: unknown): CallId | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return createCallId(value);
}
