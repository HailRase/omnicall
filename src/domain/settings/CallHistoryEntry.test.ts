import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { describe, expect, it } from "vitest";

describe("createCallHistoryEntryFromSession", () => {
  it("maps completed outgoing call snapshot", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-1"),
      direction: "outgoing",
      remoteNumber: "+12025550100",
      displayLabel: "+12025550100",
      startedAt: "2026-07-07T10:00:00.000Z",
      endedAt: "2026-07-07T10:01:30.000Z",
      wasAnswered: true,
      failed: false,
      missedBeforeAnswer: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("completed");
      expect(result.value.durationSec).toBe(90);
    }
  });

  it("maps missed incoming call snapshot", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-2"),
      direction: "incoming",
      remoteNumber: "+12025550101",
      displayLabel: null,
      startedAt: "2026-07-07T10:00:00.000Z",
      endedAt: "2026-07-07T10:00:20.000Z",
      wasAnswered: false,
      failed: false,
      missedBeforeAnswer: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("missed");
      expect(result.value.durationSec).toBe(0);
    }
  });
});
