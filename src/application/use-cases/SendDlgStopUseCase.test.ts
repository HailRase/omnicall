import { describe, expect, it } from "vitest";
import { MockOcpSyncGateway } from "@adapters/mock/MockOcpSyncGateway.js";
import { InMemoryOcpSyncReadModel } from "../read-models/InMemoryOcpSyncReadModel.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { SendDlgStopUseCase } from "./SendDlgStopUseCase.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr, isOk } from "@shared/result/index.js";

describe("SendDlgStopUseCase", () => {
  const callId = createCallId("dlg-call-1");
  const mainAcallId = createMainAcallId("acall-dlg-1");
  const correlationId = createCorrelationId();

  function createHarness(ocpAvailable: boolean) {
    const events = new InMemoryDomainEventBus();
    const gateway = new MockOcpSyncGateway();
    const readModel = new InMemoryOcpSyncReadModel(events);
    if (ocpAvailable) {
      events.publish({
        type: "OcpAuthenticationSucceeded",
        correlationId,
        occurredAt: new Date().toISOString(),
        sessionId: "s1",
        agentId: "a1",
      });
    }
    const useCase = new SendDlgStopUseCase(
      gateway,
      readModel,
      events,
      createTestLogger(),
    );
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    return { useCase, gateway, published };
  }

  it("sends dlg_stop and publishes Sent on success", async () => {
    const { useCase, gateway, published } = createHarness(true);
    const result = await useCase.execute({
      callId,
      mainAcallId,
      trigger: "call_ended",
      correlationId,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }
    expect(result.value).toEqual({ status: "succeeded" });
    expect(published).toEqual(["DlgStopRequested", "DlgStopSent"]);
    expect(gateway.getDlgStopSendCount()).toBe(1);
  });

  it("blocks duplicate dlg_stop for same callId", async () => {
    const { useCase, gateway } = createHarness(true);
    await useCase.execute({ callId, mainAcallId, trigger: "call_ended", correlationId });
    const second = await useCase.execute({
      callId,
      mainAcallId,
      trigger: "incoming_ended_before_answer",
      correlationId,
    });

    expect(isOk(second)).toBe(true);
    if (!isOk(second)) {
      return;
    }
    expect(second.value).toEqual({ status: "skipped", reason: "duplicate" });
    expect(gateway.getDlgStopSendCount()).toBe(1);
  });

  it("no-ops in SIP-only mode", async () => {
    const { useCase, gateway } = createHarness(false);
    const result = await useCase.execute({
      callId,
      mainAcallId,
      trigger: "call_ended",
      correlationId,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }
    expect(result.value).toEqual({ status: "skipped", reason: "sip_only" });
    expect(gateway.getDlgStopSendCount()).toBe(0);
  });

  it("returns error when gateway fails without DlgStopSent", async () => {
    const events = new InMemoryDomainEventBus();
    const gateway = new MockOcpSyncGateway();
    gateway.setDlgStopScenario("failed");
    const readModel = new InMemoryOcpSyncReadModel(events);
    events.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "s1",
      agentId: "a1",
    });
    const useCase = new SendDlgStopUseCase(
      gateway,
      readModel,
      events,
      createTestLogger(),
    );
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const result = await useCase.execute({
      callId,
      mainAcallId,
      trigger: "call_failed",
      correlationId,
    });

    expect(isErr(result)).toBe(true);
    expect(published).toEqual(["DlgStopRequested"]);
    expect(gateway.getDlgStopSendCount()).toBe(1);
  });

  it("skips when mainAcallId is missing", async () => {
    const { useCase, gateway } = createHarness(true);
    const result = await useCase.execute({
      callId,
      mainAcallId: null,
      trigger: "call_ended",
      correlationId,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) {
      return;
    }
    expect(result.value).toEqual({ status: "skipped", reason: "no_correlation" });
    expect(gateway.getDlgStopSendCount()).toBe(0);
  });
});
