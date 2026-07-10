import { createContact } from "@domain/settings/Contact.js";
import { createContactId } from "@domain/settings/ContactId.js";
import { describe, expect, it } from "vitest";
import {
  createActiveCallControlsProjection,
  initialActiveCallControlsProjection,
} from "./activeCallControlsProjection.js";
import { deriveCallLinesShell } from "./deriveCallLinesShell.js";
import { initialMultiCallProjection } from "./multiCallProjection.js";
import type { MultiLineCallProjection } from "./multiLineCallProjection.js";
import { initialTransferProjection } from "./transferProjection.js";

const emptyContacts: never[] = [];

function buildContact(id: string, displayName: string, primaryPhone: string) {
  const contactId = createContactId(id);
  if (contactId === null) {
    throw new Error("invalid contact id");
  }
  const created = createContact({ displayName, primaryPhone }, { id: contactId });
  if (!created.ok) {
    throw new Error("invalid contact");
  }
  return created.value;
}

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
    remoteNumber: overrides.remoteNumber ?? overrides.displayLabel ?? "+12025550100",
    activeSinceMs: overrides.activeSinceMs ?? null,
    isRemoteHold: overrides.isRemoteHold ?? false,
    dtmfHistory: overrides.dtmfHistory ?? "",
    lastDtmfTone: overrides.lastDtmfTone ?? null,
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
      activeCallControlsProjection: createActiveCallControlsProjection({
        callId: "call-1",
        callState: "Active",
        muted: false,
      }),
      transferProjection: initialTransferProjection(),
      contacts: emptyContacts,
    });

    expect(shell.visible).toBe(true);
    expect(shell.lines).toHaveLength(1);
    expect(shell.lines[0]?.displayName).toBe("+12025550100");
    expect(shell.lines[0]?.statusLabel).toBe("call.line.status.active");
    expect(shell.lines[0]?.primaryAction).toBe("hangup");
    expect(shell.lines[0]?.showIconRow).toBe(true);
    expect(shell.lines[0]?.showRemoteHoldBadge).toBe(false);
  });

  it("exposes remote hold badge without changing status label", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [
          createLine({ callId: "call-1", state: "Active", isRemoteHold: true, activeSinceMs: 1_000 }),
        ],
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
      activeCallControlsProjection: createActiveCallControlsProjection({
        callId: "call-1",
        callState: "Active",
        muted: false,
      }),
      transferProjection: initialTransferProjection(),
      contacts: emptyContacts,
    });

    expect(shell.lines[0]?.statusLabel).toBe("call.line.status.active");
    expect(shell.lines[0]?.showRemoteHoldBadge).toBe(true);
    expect(shell.lines[0]?.showLocalHoldBadge).toBe(false);
  });

  it("exposes both hold badges when local and remote hold are active", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [createLine({ callId: "call-1", state: "Held", isRemoteHold: true })],
        primaryCallId: "call-1",
        consultationCallId: null,
        sourceCallId: null,
        attendedPhase: "idle",
        lastFailureReason: null,
      },
      multiCallProjection: initialMultiCallProjection(),
      activeCallControlsProjection: initialActiveCallControlsProjection(),
      transferProjection: initialTransferProjection(),
      contacts: emptyContacts,
    });

    expect(shell.lines[0]?.statusLabel).toBe("call.line.status.held");
    expect(shell.lines[0]?.showLocalHoldBadge).toBe(true);
    expect(shell.lines[0]?.showRemoteHoldBadge).toBe(true);
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
      activeCallControlsProjection: initialActiveCallControlsProjection(),
      transferProjection: initialTransferProjection(),
      contacts: emptyContacts,
    });

    expect(shell.visible).toBe(true);
    expect(shell.lines).toHaveLength(2);
    expect(shell.lines[1]?.primaryAction).toBe("resume");
    expect(shell.lines[1]?.showIconRow).toBe(false);
  });

  it("prefers contact display name over SIP label for active lines", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [
          createLine({
            callId: "call-1",
            state: "Active",
            displayLabel: "SIP Alice",
            remoteNumber: "+12025550100",
            activeSinceMs: 1_000,
          }),
        ],
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
      activeCallControlsProjection: createActiveCallControlsProjection({
        callId: "call-1",
        callState: "Active",
        muted: false,
      }),
      transferProjection: initialTransferProjection(),
      contacts: [buildContact("agent-a", "Alice Agent", "+12025550100")],
    });

    expect(shell.lines[0]?.displayName).toBe("Alice Agent");
  });

  it("falls back to SIP label when contacts are loading", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [
          createLine({
            callId: "call-1",
            state: "Active",
            displayLabel: "Support Queue",
            remoteNumber: "+12025550122",
          }),
        ],
        primaryCallId: "call-1",
        consultationCallId: null,
        sourceCallId: null,
        attendedPhase: "idle",
        lastFailureReason: null,
      },
      multiCallProjection: initialMultiCallProjection(),
      activeCallControlsProjection: initialActiveCallControlsProjection(),
      transferProjection: initialTransferProjection(),
      contacts: emptyContacts,
    });

    expect(shell.lines[0]?.displayName).toBe("Support Queue");
  });

  it("uses hangup for outbound Connecting and Ringing, answer only for waiting incoming", () => {
    const shell = deriveCallLinesShell({
      multiLineCallProjection: {
        lines: [
          createLine({ callId: "held-1", state: "Held" }),
          createLine({ callId: "out-1", state: "Connecting" }),
          createLine({ callId: "out-ring", state: "Ringing" }),
          createLine({ callId: "in-1", state: "Ringing" }),
        ],
        primaryCallId: "held-1",
        consultationCallId: null,
        sourceCallId: null,
        attendedPhase: "idle",
        lastFailureReason: null,
      },
      multiCallProjection: {
        ...initialMultiCallProjection(),
        hasEstablishedCall: true,
        establishedCallCount: 1,
        hasConnectingCall: true,
      },
      activeCallControlsProjection: initialActiveCallControlsProjection(),
      transferProjection: initialTransferProjection(),
      contacts: emptyContacts,
      incomingCallId: "in-1",
    });

    expect(shell.lines.find((line) => line.callId === "out-1")?.primaryAction).toBe("hangup");
    expect(shell.lines.find((line) => line.callId === "out-ring")?.primaryAction).toBe("hangup");
    expect(shell.lines.find((line) => line.callId === "in-1")?.primaryAction).toBe("answer");
  });
});
