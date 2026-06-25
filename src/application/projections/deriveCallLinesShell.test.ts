import { describe, expect, it } from "vitest";
import {
  createActiveCallControlsProjection,
  initialActiveCallControlsProjection,
} from "./activeCallControlsProjection.js";
import { deriveCallLinesShell } from "./deriveCallLinesShell.js";
import { initialMultiCallProjection } from "./multiCallProjection.js";
import type { MultiLineCallProjection } from "./multiLineCallProjection.js";
import { initialQueueInfoProjection } from "./queueInfoProjection.js";
import { initialTransferProjection } from "./transferProjection.js";

function createLine(
  overrides: Partial<MultiLineCallProjection["lines"][number]> &
    Pick<MultiLineCallProjection["lines"][number], "callId" | "state">,
): MultiLineCallProjection["lines"][number] {
  return {
    callId: overrides.callId,
    role: overrides.role ?? "primary",
    state: overrides.state,
    muted: overrides.muted ?? false,
    displayLabel: overrides.displayLabel ?? "+12025550100",
    activeSinceMs: overrides.activeSinceMs ?? null,
    isRemoteHold: overrides.isRemoteHold ?? false,
  };
}

describe("deriveCallLinesShell", () => {
  it("is visible for a single established line", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [createLine({ callId: "call-1", state: "Active", activeSinceMs: 1_000 })],
        primaryCallId: "call-1",
        consultationCallId: null,
        sourceCallId: null,
        attendedPhase: "idle",
        lastFailureReason: null,
      },
      multiCallProjection: {
        ...initialMultiCallProjection(),
        hasEstablishedCall: true,
        establishedCallCount: 1,
        activeUnheldCallId: "call-1",
      },
      queueInfoProjection: initialQueueInfoProjection(),
      activeCallControlsProjection: createActiveCallControlsProjection({
        callId: "call-1",
        callState: "Active",
        muted: false,
      }),
      transferProjection: initialTransferProjection(),
      isOcpMode: false,
    });

    expect(shell.visible).toBe(true);
    expect(shell.lines).toHaveLength(1);
    expect(shell.lines[0]?.displayName).toBe("+12025550100");
    expect(shell.lines[0]?.statusLabel).toBe("На линии");
    expect(shell.lines[0]?.primaryAction).toBe("hangup");
    expect(shell.lines[0]?.showIconRow).toBe(true);
  });

  it("requires two lines only for multi-line policy banner, not visibility", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [
          createLine({ callId: "call-1", state: "Active" }),
          createLine({ callId: "call-2", state: "Held", role: "source" }),
        ],
        primaryCallId: "call-1",
        consultationCallId: null,
        sourceCallId: "call-2",
        attendedPhase: "idle",
        lastFailureReason: null,
      },
      multiCallProjection: initialMultiCallProjection(),
      queueInfoProjection: initialQueueInfoProjection(),
      activeCallControlsProjection: initialActiveCallControlsProjection(),
      transferProjection: initialTransferProjection(),
      isOcpMode: false,
    });

    expect(shell.visible).toBe(true);
    expect(shell.lines).toHaveLength(2);
    expect(shell.lines[1]?.primaryAction).toBe("resume");
    expect(shell.lines[1]?.showIconRow).toBe(false);
  });

  it("hides queue label state in SIP-only mode", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [createLine({ callId: "call-1", state: "Ringing" })],
        primaryCallId: "call-1",
        consultationCallId: null,
        sourceCallId: null,
        attendedPhase: "idle",
        lastFailureReason: null,
      },
      multiCallProjection: initialMultiCallProjection(),
      queueInfoProjection: initialQueueInfoProjection(),
      activeCallControlsProjection: initialActiveCallControlsProjection(),
      transferProjection: initialTransferProjection(),
      isOcpMode: false,
    });

    expect(shell.lines[0]?.queueLabelState).toBe("hidden");
  });
});
