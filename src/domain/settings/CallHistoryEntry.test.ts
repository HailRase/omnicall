import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { describe, expect, it } from "vitest";

describe("createCallHistoryEntryFromSession", () => {
  it("maps completed outgoing call with ring and talk durations", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-1"),
      direction: "outgoing",
      remoteNumber: "+12025550100",
      displayLabel: "+12025550100",
      startedAt: "2026-07-07T10:00:00.000Z",
      answeredAt: "2026-07-07T10:00:20.000Z",
      endedAt: "2026-07-07T10:01:30.000Z",
      wasAnswered: true,
      failed: false,
      localHangup: true,
      remoteCancelBeforeAnswer: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("completed");
      expect(result.value.endReason).toBe("local_hangup");
      expect(result.value.durationSec).toBe(90);
      expect(result.value.ringDurationSec).toBe(20);
      expect(result.value.talkDurationSec).toBe(70);
    }
  });

  it("maps missed incoming remote cancel with ring duration", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-2"),
      direction: "incoming",
      remoteNumber: "+12025550101",
      displayLabel: null,
      startedAt: "2026-07-07T10:00:00.000Z",
      answeredAt: null,
      endedAt: "2026-07-07T10:00:20.000Z",
      wasAnswered: false,
      failed: false,
      localHangup: false,
      remoteCancelBeforeAnswer: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("missed");
      expect(result.value.endReason).toBe("remote_cancel");
      expect(result.value.durationSec).toBe(20);
      expect(result.value.ringDurationSec).toBe(20);
      expect(result.value.talkDurationSec).toBe(0);
    }
  });

  it("maps outgoing unanswered remote cancel as canceled, not missed", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-3"),
      direction: "outgoing",
      remoteNumber: "+12025550102",
      displayLabel: null,
      startedAt: "2026-07-07T10:00:00.000Z",
      answeredAt: null,
      endedAt: "2026-07-07T10:00:15.000Z",
      wasAnswered: false,
      failed: false,
      localHangup: false,
      remoteCancelBeforeAnswer: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("canceled");
      expect(result.value.endReason).toBe("remote_cancel");
      expect(result.value.durationSec).toBe(15);
      expect(result.value.ringDurationSec).toBe(15);
      expect(result.value.talkDurationSec).toBe(0);
    }
  });

  it("maps outgoing local cancel before answer as canceled by operator", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-4"),
      direction: "outgoing",
      remoteNumber: "+12025550103",
      displayLabel: null,
      startedAt: "2026-07-07T10:00:00.000Z",
      answeredAt: null,
      endedAt: "2026-07-07T10:00:08.000Z",
      wasAnswered: false,
      failed: false,
      localHangup: true,
      remoteCancelBeforeAnswer: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("canceled");
      expect(result.value.endReason).toBe("local_hangup");
    }
  });

  it("maps incoming local reject as canceled by operator, not missed", () => {
    const result = createCallHistoryEntryFromSession({
      callId: createCallId("call-5"),
      direction: "incoming",
      remoteNumber: "+12025550104",
      displayLabel: null,
      startedAt: "2026-07-07T10:00:00.000Z",
      answeredAt: null,
      endedAt: "2026-07-07T10:00:05.000Z",
      wasAnswered: false,
      failed: false,
      localHangup: true,
      remoteCancelBeforeAnswer: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("canceled");
      expect(result.value.endReason).toBe("local_hangup");
    }
  });
});
