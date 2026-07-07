import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { describe, expect, it } from "vitest";
import { initialCallHistoryProjection } from "./callHistoryProjection.js";
import { deriveCallHistoryShell } from "./deriveCallHistoryShell.js";
import { initialMultiCallProjection } from "./multiCallProjection.js";

function sampleEntry() {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId("call-1"),
    direction: "outgoing",
    remoteNumber: "+12025550100",
    displayLabel: "Alice",
    startedAt: "2026-07-07T10:00:00.000Z",
    endedAt: "2026-07-07T10:01:00.000Z",
    wasAnswered: true,
    failed: false,
    missedBeforeAnswer: false,
  });
  if (!created.ok) {
    throw new Error("expected valid entry");
  }
  return created.value;
}

describe("deriveCallHistoryShell", () => {
  it("marks redial disabled when SIP is not registered", () => {
    const shell = deriveCallHistoryShell({
      projection: {
        ...initialCallHistoryProjection(),
        status: "populated",
        entries: [sampleEntry()],
      },
      isSipRegistered: false,
      multiCallProjection: initialMultiCallProjection(),
    });

    expect(shell.entries[0]?.redialDisabledReasonKey).toBe(
      "history.redial.disabled.notRegistered",
    );
  });

  it("marks redial disabled during active call when multi-sessions are off", () => {
    const shell = deriveCallHistoryShell({
      projection: {
        ...initialCallHistoryProjection(),
        status: "populated",
        entries: [sampleEntry()],
      },
      isSipRegistered: true,
      multiCallProjection: {
        ...initialMultiCallProjection(),
        hasEstablishedCall: true,
        establishedCallCount: 1,
        multiSessionsEnabled: false,
      },
    });

    expect(shell.entries[0]?.redialDisabledReasonKey).toBe(
      "history.redial.disabled.activeCallPolicy",
    );
  });

  it("maps entry direction and outcome keys for renderer i18n", () => {
    const shell = deriveCallHistoryShell({
      projection: {
        ...initialCallHistoryProjection(),
        status: "populated",
        entries: [sampleEntry()],
      },
      isSipRegistered: true,
      multiCallProjection: initialMultiCallProjection(),
    });

    expect(shell.entries[0]).toMatchObject({
      directionKey: "history.direction.outgoing",
      outcomeKey: "history.outcome.completed",
      redialDisabledReasonKey: null,
    });
    expect(shell.isEmpty).toBe(false);
  });

  it("surfaces load error key from projection", () => {
    const shell = deriveCallHistoryShell({
      projection: {
        ...initialCallHistoryProjection(),
        status: "error",
        errorKey: "history.error.loadFailed",
      },
      isSipRegistered: true,
      multiCallProjection: initialMultiCallProjection(),
    });

    expect(shell.errorKey).toBe("history.error.loadFailed");
    expect(shell.isEmpty).toBe(true);
  });
});
