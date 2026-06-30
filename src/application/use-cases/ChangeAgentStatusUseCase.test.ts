import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { InMemoryAgentStatusReadModel } from "../read-models/InMemoryAgentStatusReadModel.js";
import { ChangeAgentStatusUseCase } from "./ChangeAgentStatusUseCase.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  createAgentStatusChangedEvent,
  createBreakReason,
  createStatusReason,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";

function createHarness(
  gateway = new MockOperatorPlatformGateway(),
  settings = new InMemorySettingsRepository({
    phoneStatus: "online",
    incomingCallSettings: {
      autoAnswerTimeoutSec: null,
      autoAnswerDuringActiveSessionEnabled: false,
      rejectReasonRequired: false,
      allowedBreakReasons: [],
    },
  }),
): Readonly<{
  events: InMemoryDomainEventBus;
  useCase: ChangeAgentStatusUseCase;
}> {
  const events = new InMemoryDomainEventBus();
  const readModel = new InMemoryAgentStatusReadModel(events);
  const useCase = new ChangeAgentStatusUseCase(
    readModel,
    gateway,
    settings,
    events,
    createTestLogger(),
  );
  return { events, useCase };
}

function seedReadyStatus(events: InMemoryDomainEventBus): void {
  events.publish({
    type: "OcpAuthenticationSucceeded",
    correlationId: createCorrelationId(),
    occurredAt: new Date().toISOString(),
    sessionId: "session-1",
    agentId: "agent-001",
  });
  events.publish(
    createAgentStatusChangedEvent(createCorrelationId(), {
      previousStatus: null,
      currentStatus: "ready",
      reason: null,
      changedAt: new Date().toISOString(),
    }),
  );
}

describe("ChangeAgentStatusUseCase", () => {
  it("publishes requested then changed on successful gateway path", async () => {
    const { events, useCase } = createHarness();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    seedReadyStatus(events);
    published.length = 0;

    const result = await useCase.execute({ targetStatus: "break" });

    expect(result.ok).toBe(true);
    expect(published).toEqual([
      "AgentStatusChangeRequested",
      "AgentStatusChanged",
    ]);
  });

  it("publishes rejection on invalid transition without gateway call side effects", async () => {
    const { events, useCase } = createHarness(
      new MockOperatorPlatformGateway({ statusChangeScenario: "rejected" }),
    );
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    seedReadyStatus(events);
    published.length = 0;

    const result = await useCase.execute({ targetStatus: "post_call" });

    expect(isErr(result)).toBe(true);
    expect(published).toEqual(["AgentStatusChangeRejected"]);
  });

  it("publishes rejection when DND blocks ready (LF-019)", async () => {
    const { events, useCase } = createHarness(
      new MockOperatorPlatformGateway(),
      new InMemorySettingsRepository({ phoneStatus: "dnd" }),
    );
    const published: string[] = [];
    let rejectedReason: unknown;
    events.subscribe((event) => {
      published.push(event.type);
      if (event.type === "AgentStatusChangeRejected") {
        rejectedReason = event["reason"];
      }
    });

    events.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });
    events.publish(
      createAgentStatusChangedEvent(createCorrelationId(), {
        previousStatus: null,
        currentStatus: "break",
        reason: createStatusReason("meeting"),
        changedAt: new Date().toISOString(),
      }),
    );

    const result = await useCase.execute({ targetStatus: "ready" });

    expect(isErr(result)).toBe(true);
    expect(published).toContain("AgentStatusChangeRejected");
    expect(rejectedReason).toBe("dnd_blocks_ready");
  });

  it("publishes rejection on gateway failure without AgentStatusChanged", async () => {
    const { events, useCase } = createHarness(
      new MockOperatorPlatformGateway({ statusChangeScenario: "network_error" }),
    );
    const published: string[] = [];
    let rejectedReason: unknown;
    events.subscribe((event) => {
      published.push(event.type);
      if (event.type === "AgentStatusChangeRejected") {
        rejectedReason = event["reason"];
      }
    });
    seedReadyStatus(events);
    published.length = 0;

    const result = await useCase.execute({ targetStatus: "break" });

    expect(isErr(result)).toBe(true);
    expect(published).toEqual([
      "AgentStatusChangeRequested",
      "AgentStatusChangeRejected",
    ]);
    expect(rejectedReason).toBe("network_error");
  });

  it("rejects when OCP status is unavailable", async () => {
    const { events, useCase } = createHarness();
    const published: string[] = [];
    let rejectedReason: unknown;
    events.subscribe((event) => {
      published.push(event.type);
      if (event.type === "AgentStatusChangeRejected") {
        rejectedReason = event["reason"];
      }
    });

    const result = await useCase.execute({ targetStatus: "break" });

    expect(isErr(result)).toBe(true);
    expect(published).toContain("AgentStatusChangeRejected");
    expect(rejectedReason).toBe("ocp_not_connected");
  });

  it("publishes rejection on gateway rejected scenario with gateway_failed", async () => {
    const { events, useCase } = createHarness(
      new MockOperatorPlatformGateway({ statusChangeScenario: "rejected" }),
    );
    const published: string[] = [];
    let rejectedReason: unknown;
    events.subscribe((event) => {
      published.push(event.type);
      if (event.type === "AgentStatusChangeRejected") {
        rejectedReason = event["reason"];
      }
    });
    seedReadyStatus(events);
    published.length = 0;

    const result = await useCase.execute({ targetStatus: "break" });

    expect(isErr(result)).toBe(true);
    expect(published).toEqual([
      "AgentStatusChangeRequested",
      "AgentStatusChangeRejected",
    ]);
    expect(rejectedReason).toBe("gateway_failed");
  });

  it("requires break reason when allowed reasons configured", async () => {
    const settings = new InMemorySettingsRepository({
      phoneStatus: "online",
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        autoAnswerDuringActiveSessionEnabled: false,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("meeting")],
      },
    });
    const { events, useCase } = createHarness(
      new MockOperatorPlatformGateway(),
      settings,
    );
    let rejectedReason: unknown;
    events.subscribe((event) => {
      if (event.type === "AgentStatusChangeRejected") {
        rejectedReason = event["reason"];
      }
    });
    seedReadyStatus(events);

    const result = await useCase.execute({ targetStatus: "break" });

    expect(isErr(result)).toBe(true);
    expect(rejectedReason).toBe("break_reason_required");
  });

  it("accepts break change with valid configured reason", async () => {
    const settings = new InMemorySettingsRepository({
      phoneStatus: "online",
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        autoAnswerDuringActiveSessionEnabled: false,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("meeting")],
      },
    });
    const { events, useCase } = createHarness(
      new MockOperatorPlatformGateway(),
      settings,
    );
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    seedReadyStatus(events);
    published.length = 0;

    const result = await useCase.execute({
      targetStatus: "break",
      breakReason: "meeting",
    });

    expect(result.ok).toBe(true);
    expect(published).toEqual([
      "AgentStatusChangeRequested",
      "AgentStatusChanged",
    ]);
  });
});
