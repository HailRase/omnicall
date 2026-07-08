import { describe, expect, it, vi } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import {
  createCallId,
  createOutgoingCall,
  createPhoneNumber,
  type Call,
} from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { executeStartConsultation } from "./attendedTransferOperations.js";
import type { TransferCallControlDeps } from "./transferCallControlTypes.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";

describe("executeStartConsultation rollback", () => {
  it("publishes ConsultationCallFailed when session transition fails after makeCall success", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const sourceCall = {
      ...createOutgoingCall(createCallId("src-roll-1"), createPhoneNumber("+12025550900")),
      state: "Held" as const,
    };
    const consultationCall = {
      ...createOutgoingCall(createCallId("consult-roll-1"), createPhoneNumber("+12025550901")),
      state: "Active" as const,
    };
    const deps = createMockDeps(events, sourceCall, consultationCall);

    const result = await executeStartConsultation(deps, {
      sourceCallId: createCallId("src-roll-1"),
      targetNumber: "+12025550901",
      consultationCallId: createCallId("consult-roll-1"),
    });

    expect(result.ok).toBe(false);
    expect(publishedTypes).toContain("ConsultationCallFailed");
    expect(deps.hangupCall).toHaveBeenCalledWith(
      expect.objectContaining({ callId: "consult-roll-1" }),
    );
  });
});

function createMockDeps(
  events: InMemoryDomainEventBus,
  sourceCall: Call,
  consultationCall: Call,
): TransferCallControlDeps & { hangupCall: ReturnType<typeof vi.fn> } {
  const settingsRepository = new InMemorySettingsRepository({
    multiCallSettings: { multiSessionsEnabled: true },
  });
  const hangupCall = vi.fn(() => Promise.resolve(ok(consultationCall)));
  return {
    telephonyGateway: new MockTelephonyGateway(),
    mediaGateway: new MockMediaGateway(),
    settingsRepository,
    eventPublisher: events,
    logger: createTestLogger(),
    resolveTrackedCall: (callId) => {
      if (callId === sourceCall.id) {
        return ok(sourceCall);
      }
      if (callId === consultationCall.id) {
        return ok(consultationCall);
      }
      return err(createPlatformError("not_found", "missing"));
    },
    trackCall: () => undefined,
    clearIncomingCallById: () => undefined,
    getTransferSession: () => null,
    setTransferSession: () => undefined,
    getTransferModeSourceCallId: () => null,
    setTransferModeSourceCallId: () => undefined,
    makeCall: () => Promise.resolve(ok(consultationCall)),
    hangupCall,
    resumeCall: vi.fn(() => Promise.resolve(ok(sourceCall))),
  };
}
