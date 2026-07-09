import { describe, expect, it, vi } from "vitest";
import { MockHeadsetGateway } from "@adapters/mock/MockHeadsetGateway.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { HeadsetSessionOrchestrator } from "./HeadsetSessionOrchestrator.js";
import { initialHeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";

describe("HeadsetSessionOrchestrator", () => {
  it("sends incoming LED when snapshot gains waiting incoming call", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();

    const getSnapshot = vi.fn(() => initialHeadsetCallSnapshot());
    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onSnapshotChanged({
      ...initialHeadsetCallSnapshot(),
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(gateway.getSentCommands().some((command) => command.type === "signalIncoming")).toBe(
      true,
    );
    orchestrator.stop();
  });
});
