import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import type { DomainEvent } from "@domain/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "@application/projections/multiLineCallProjection.js";
import {
  initialTransferProjection,
  reduceTransferProjection,
} from "@application/projections/transferProjection.js";
import {
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
} from "@application/projections/activeCallControlsProjection.js";
import { CallEngine } from "../services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("CallEngine attended transfer", () => {
  it("completes attended transfer happy path", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      attendedTransferScenario: "success",
    });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("att-src-1");
    const consultationCallId = createCallId("att-consult-1");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550700"),
    });

    const consultationResult = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550701",
      consultationCallId,
    });
    expect(consultationResult.ok).toBe(true);

    const transferResult = await engine.attendedTransfer({
      sourceCallId,
      consultationCallId,
    });
    expect(transferResult.ok).toBe(true);
    if (!transferResult.ok) {
      return;
    }
    expect(transferResult.value.state).toBe("Ended");
    expect(telephony.getAttendedTransferCalls()).toEqual([
      { sourceCallId: "att-src-1", consultationCallId: "att-consult-1" },
    ]);
    expect(publishedTypes).toContain("ConsultationCallRequested");
    expect(publishedTypes).toContain("ConsultationCallStarted");
    expect(publishedTypes).toContain("AttendedTransferCompleted");
  });

  it("restores source held state on attended transfer failure", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      attendedTransferScenario: "failure",
    });
    const engine = createEngine(telephony);
    const sourceCallId = createCallId("att-src-2");
    const consultationCallId = createCallId("att-consult-2");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550702"),
    });
    await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550703",
      consultationCallId,
    });

    const transferResult = await engine.attendedTransfer({
      sourceCallId,
      consultationCallId,
    });
    expect(transferResult.ok).toBe(false);

    const resumeResult = await engine.resumeCall({ callId: sourceCallId });
    expect(resumeResult.ok).toBe(true);
    if (!resumeResult.ok) {
      return;
    }
    expect(resumeResult.value.state).toBe("Active");
  });

  it("blocks consultation when multi-sessions disabled (LF-032)", async () => {
    const engine = createEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      new InMemoryDomainEventBus(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: false },
      }),
    );
    const sourceCallId = createCallId("att-src-3");
    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550704"),
    });

    const result = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550705",
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe("second_session_disabled");
  });

  it("rolls back projections and allows retry after consultation outgoing failure", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
    });
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("att-src-4");
    const consultationCallId = createCallId("att-consult-4");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550706"),
    });
    telephony.setMakeCallScenario("failed_busy");

    const failedConsultation = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550707",
      consultationCallId,
    });
    expect(failedConsultation.ok).toBe(false);
    expect(collectedEvents.some((event) => event.type === "ConsultationCallFailed")).toBe(true);

    let transferProjection = initialTransferProjection();
    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      transferProjection = reduceTransferProjection(transferProjection, event);
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }
    expect(transferProjection.phase).toBe("idle");
    expect(multiLineProjection.attendedPhase).toBe("idle");
    expect(multiLineProjection.consultationCallId).toBeNull();
    expect(multiLineProjection.lines.some((line) => line.callId === "att-consult-4")).toBe(false);

    telephony.setMakeCallScenario("answered");
    const retryConsultation = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550708",
      consultationCallId: createCallId("att-consult-4-retry"),
    });
    expect(retryConsultation.ok).toBe(true);
  });

  it("matches active controls projection to restored source state on attended failure", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      attendedTransferScenario: "failure",
    });
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("att-src-5");
    const consultationCallId = createCallId("att-consult-5");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550709"),
    });
    await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550710",
      consultationCallId,
    });
    const transferResult = await engine.attendedTransfer({ sourceCallId, consultationCallId });
    expect(transferResult.ok).toBe(false);

    let controlsProjection = initialActiveCallControlsProjection();
    for (const event of collectedEvents) {
      controlsProjection = reduceActiveCallControlsProjection(controlsProjection, event);
    }

    expect(controlsProjection.callState).toBe("Held");
    expect(controlsProjection.callId).toBe("att-src-5");

    const resumeResult = await engine.resumeCall({ callId: sourceCallId });
    expect(resumeResult.ok).toBe(true);
    if (!resumeResult.ok) {
      return;
    }
    expect(resumeResult.value.state).toBe("Active");
  });

  it("retries attended transfer after gateway failure", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      attendedTransferScenario: "failure",
    });
    const engine = createEngine(telephony);
    const sourceCallId = createCallId("att-src-6");
    const consultationCallId = createCallId("att-consult-6");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550711"),
    });
    await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550712",
      consultationCallId,
    });

    const failedTransfer = await engine.attendedTransfer({
      sourceCallId,
      consultationCallId,
    });
    expect(failedTransfer.ok).toBe(false);

    telephony.setAttendedTransferScenario("success");
    const retryTransfer = await engine.attendedTransfer({
      sourceCallId,
      consultationCallId,
    });
    expect(retryTransfer.ok).toBe(true);
    if (!retryTransfer.ok) {
      return;
    }
    expect(retryTransfer.value.state).toBe("Ended");
    expect(telephony.getAttendedTransferCalls()).toEqual([
      { sourceCallId: "att-src-6", consultationCallId: "att-consult-6" },
    ]);
  });

  it("defers consultation active until remote answer after SIP progress", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("att-src-7");
    const consultationCallId = createCallId("att-consult-7");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550720"),
    });

    telephony.setMakeCallScenario("progress_180");
    const consultationResult = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550721",
      consultationCallId,
    });
    expect(consultationResult.ok).toBe(true);
    if (!consultationResult.ok) {
      return;
    }
    expect(consultationResult.value.state).toBe("Ringing");
    expect(publishedTypes).toContain("ConsultationCallRequested");
    expect(publishedTypes).not.toContain("ConsultationCallStarted");

    await engine.handleOutboundCallAnswered(consultationCallId);
    expect(publishedTypes).toContain("ConsultationCallStarted");

    const transferResult = await engine.attendedTransfer({
      sourceCallId,
      consultationCallId,
    });
    expect(transferResult.ok).toBe(true);
  });
});

function createEngine(
  telephony: MockTelephonyGateway,
  events: InMemoryDomainEventBus = new InMemoryDomainEventBus(),
  settings: InMemorySettingsRepository = new InMemorySettingsRepository({
    multiCallSettings: { multiSessionsEnabled: true },
  }),
): CallEngine {
  return new CallEngine(
    telephony,
    new MockMediaGateway(),
    settings,
    events,
    createTestLogger(),
  );
}
