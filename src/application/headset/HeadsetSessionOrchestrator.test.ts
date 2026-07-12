import { describe, expect, it, vi } from "vitest";
import { MockHeadsetGateway } from "@adapters/mock/MockHeadsetGateway.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { HeadsetSessionOrchestrator } from "./HeadsetSessionOrchestrator.js";
import {
  initialHeadsetCallSnapshot,
  type HeadsetCallSnapshot,
} from "./buildHeadsetCallSnapshot.js";

function snapshot(partial: Partial<HeadsetCallSnapshot>): HeadsetCallSnapshot {
  return {
    ...initialHeadsetCallSnapshot(),
    ...partial,
  };
}

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
    orchestrator.onSnapshotChanged(
      snapshot({
        incomingWaitingCount: 1,
        firstIncomingCallId: "in-1",
        focusSessionId: "in-1",
        focusReason: "incoming",
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(gateway.getSentCommands().some((command) => command.type === "signalIncoming")).toBe(
      true,
    );
    orchestrator.stop();
  });

  it("hangs up active on hookOn", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onHangup = vi.fn();
    const current = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup,
        onToggleHold: vi.fn(),
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.emitHardwareEvent({ type: "hookOn" });
    expect(onHangup).toHaveBeenCalledWith("active-1");
    orchestrator.stop();
  });

  it("resumes held on hookOff after hold sync guard expires", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onToggleHold = vi.fn();
    const current = snapshot({
      focusSessionId: "held-1",
      focusedIsOnHold: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold,
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));

    orchestrator.getSyncQueue().beginHoldSessionSync("held-1", "hold");
    gateway.emitHardwareEvent({ type: "hookOn" });
    expect(onToggleHold).not.toHaveBeenCalled();

    // Expire hold guard
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2100);
    gateway.emitHardwareEvent({ type: "hookOff" });
    expect(onToggleHold).toHaveBeenCalledWith("held-1");
    vi.useRealTimers();
    orchestrator.stop();
  });

  it("applies absolute mute from headset including muted:false", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onSetMute = vi.fn();
    let current = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      mutedBySessionId: { "active-1": false },
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute,
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));

    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    expect(onSetMute).toHaveBeenCalledWith("active-1", true);

    current = {
      ...current,
      focusedIsMuted: true,
      activeIsMuted: true,
      mutedBySessionId: { "active-1": true },
    };
    orchestrator.onSnapshotChanged(current);
    await new Promise((resolve) => setTimeout(resolve, 0));

    gateway.emitHardwareEvent({ type: "muteChanged", muted: false });
    expect(onSetMute).toHaveBeenCalledWith("active-1", false);
    expect(onSetMute).toHaveBeenCalledTimes(2);
    orchestrator.stop();
  });

  it("pulse mode ignores unmute bounce after mute press (Jabra HSC016)", async () => {
    const gateway = new MockHeadsetGateway();
    gateway.setMuteInputMode("pulse");
    await gateway.connect();
    const onSetMute = vi.fn();
    let current = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      mutedBySessionId: { "active-1": false },
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute,
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));

    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    expect(onSetMute).toHaveBeenCalledWith("active-1", true);

    current = {
      ...current,
      focusedIsMuted: true,
      activeIsMuted: true,
      mutedBySessionId: { "active-1": true },
    };
    orchestrator.onSnapshotChanged(current);

    gateway.emitHardwareEvent({ type: "muteChanged", muted: false });
    expect(onSetMute).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 500);
      gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
      expect(onSetMute).toHaveBeenCalledWith("active-1", false);
    } finally {
      vi.useRealTimers();
    }
    orchestrator.stop();
  });

  it("rapid headset mute while locked does not toggle app again", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onSetMute = vi.fn();
    let current = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute,
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));

    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    expect(onSetMute).toHaveBeenCalledTimes(1);

    current = { ...current, focusedIsMuted: true, activeIsMuted: true };
    orchestrator.onSnapshotChanged(current);

    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    expect(onSetMute).toHaveBeenCalledTimes(1);
    expect(orchestrator.getSyncQueue().isMuteSyncGuardActive()).toBe(true);
    orchestrator.stop();
  });

  it("rejects headset mute during outgoing even while mute sync is locked", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onSetMute = vi.fn();
    const current = snapshot({
      focusSessionId: "out-1",
      focusReason: "outgoing",
      outgoingInProgressIds: ["out-1"],
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
      mutedBySessionId: { "held-1": false, "out-1": false },
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute,
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.clearSentCommands();

    expect(orchestrator.getSyncQueue().beginMuteSessionSync("held-1", true)).toBe(true);
    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onSetMute).not.toHaveBeenCalled();
    expect(gateway.getSentCommands().some((command) => command.type === "signalOutgoing")).toBe(
      true,
    );
    orchestrator.stop();
  });

  it("clears mute UI busy when held mutes while headset focus is on outgoing", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    let current = snapshot({
      focusSessionId: "out-1",
      focusReason: "outgoing",
      outgoingInProgressIds: ["out-1"],
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
      mutedBySessionId: { "held-1": false, "out-1": false },
      operatorSelectedCallId: "held-1",
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    expect(orchestrator.getSyncQueue().beginMuteSessionSync("held-1", true)).toBe(true);
    expect(orchestrator.getSyncQueue().getBusyState().muteSessionId).toBe("held-1");

    current = {
      ...current,
      mutedBySessionId: { "held-1": true, "out-1": false },
    };
    orchestrator.onSnapshotChanged(current);

    expect(orchestrator.getSyncQueue().getMuteIntent()).toBeNull();
    expect(orchestrator.getSyncQueue().getMuteIntentSessionId()).toBeNull();
    orchestrator.stop();
  });

  it("suppresses hookOn echo during hold sync after UI hold", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onHangup = vi.fn();
    const current = snapshot({
      focusSessionId: "active-1",
      focusedIsOnHold: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      heldSessionIds: ["active-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup,
        onToggleHold: vi.fn(),
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));

    orchestrator.getSyncQueue().beginHoldSessionSync("active-1", "hold");
    gateway.emitHardwareEvent({ type: "hookOn" });
    expect(onHangup).not.toHaveBeenCalled();
    orchestrator.stop();
  });

  it("does not unmute app when hold LED mute echo arrives", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onSetMute = vi.fn();
    let current = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: true,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute,
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.clearSentCommands();

    current = snapshot({
      focusSessionId: "active-1",
      focusReason: "held",
      focusedIsMuted: true,
      focusedIsOnHold: true,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      heldSessionIds: ["active-1"],
    });
    orchestrator.onSnapshotChanged(current);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      gateway.getSentCommands().some(
        (command) => command.type === "setHoldIndicator" && command.muted !== true,
      ),
    ).toBe(true);

    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    expect(onSetMute).not.toHaveBeenCalled();
    orchestrator.stop();
  });

  it("sends answer LED when session resumes from hold", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    let current = snapshot({
      focusSessionId: "held-1",
      focusedIsOnHold: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.clearSentCommands();

    current = snapshot({
      activeSessionId: "held-1",
      focusSessionId: "held-1",
      focusedIsOnHold: false,
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
    });
    orchestrator.onSnapshotChanged(current);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(gateway.getSentCommands().some((command) => command.type === "answer")).toBe(true);
    orchestrator.stop();
  });

  it("device resume: catches up answer LED and clears hold guard", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    let current = snapshot({
      focusSessionId: "held-1",
      focusedIsOnHold: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
    });
    const onToggleHold = vi.fn(() => {
      current = snapshot({
        activeSessionId: "held-1",
        focusSessionId: "held-1",
        focusedIsOnHold: false,
        focusReason: "active",
        establishedCount: 1,
        establishedSessionIds: ["held-1"],
      });
      orchestrator.onSnapshotChanged(current);
    });
    const onHangup = vi.fn();

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup,
        onToggleHold,
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.clearSentCommands();

    gateway.emitHardwareEvent({ type: "hookOff" });
    expect(onToggleHold).toHaveBeenCalledWith("held-1");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(gateway.getSentCommands().some((command) => command.type === "answer")).toBe(
      true,
    );
    expect(orchestrator.getSyncQueue().isHoldSyncGuardActive()).toBe(false);
    expect(orchestrator.getSyncQueue().getHoldIntent()).toBeNull();

    vi.useFakeTimers();
    try {
      // hookOff resume arms HOOK_ON_SUPPRESS_MS (600).
      vi.setSystemTime(Date.now() + 650);
      gateway.emitHardwareEvent({ type: "hookOn" });
      expect(onHangup).toHaveBeenCalledWith("held-1");
    } finally {
      vi.useRealTimers();
    }
    orchestrator.stop();
  });

  it("forces unmute LED and does not toggle app mute during outgoing dial", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    const onSetMute = vi.fn();
    const current = snapshot({
      focusSessionId: "out-1",
      focusReason: "outgoing",
      outgoingInProgressIds: ["out-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute,
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.clearSentCommands();

    gateway.emitHardwareEvent({ type: "muteChanged", muted: true });
    expect(onSetMute).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      gateway.getSentCommands().some((command) => command.type === "signalOutgoing"),
    ).toBe(true);
    expect(onSetMute).not.toHaveBeenCalled();
    orchestrator.stop();
  });

  it("UI mute snapshot still sends setMute LED once", async () => {
    const gateway = new MockHeadsetGateway();
    await gateway.connect();
    let current = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    const orchestrator = new HeadsetSessionOrchestrator({
      gateway,
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger({ featureId: "F-012", boundedContext: "Headset" }),
      getSnapshot: () => current,
      callbacks: {
        onAnswer: vi.fn(),
        onReject: vi.fn(),
        onHangup: vi.fn(),
        onToggleHold: vi.fn(),
        onSetMute: vi.fn(),
      },
    });

    orchestrator.start();
    orchestrator.onDeviceConnected();
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.clearSentCommands();

    current = { ...current, focusedIsMuted: true, activeIsMuted: true };
    orchestrator.onSnapshotChanged(current);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      gateway.getSentCommands().filter(
        (command) => command.type === "setMute" && command.muted === true,
      ),
    ).toHaveLength(1);
    orchestrator.stop();
  });
});
