import { describe, expect, it } from "vitest";
import { resolveHistorySecondaryTimeLabel } from "./resolveHistorySecondaryTimeLabel.js";

describe("resolveHistorySecondaryTimeLabel", () => {
  const baseEntry = {
    id: "entry-1",
    remoteNumber: "+1",
    displayLabel: null,
    primaryLabel: "+1",
    secondaryLabel: null,
    contactId: null,
    presentationSource: "number" as const,
    directionKey: "history.direction.incoming" as const,
    outcomeKey: "history.outcome.missed" as const,
    endReasonKey: "history.endReason.remote_cancel" as const,
    startedAtIso: "2026-07-07T13:05:00.000Z",
    durationSec: 0,
    ringDurationSec: 0,
    talkDurationSec: 0,
    redialDisabledReasonKey: null,
  };

  it("shows clock time for missed calls", () => {
    const label = resolveHistorySecondaryTimeLabel({
      entry: baseEntry,
      language: "en",
      formatClockTime: () => "13:05",
    });

    expect(label).toBe("13:05");
  });

  it("shows clock time for completed answered calls", () => {
    const label = resolveHistorySecondaryTimeLabel({
      entry: {
        ...baseEntry,
        outcomeKey: "history.outcome.completed",
        endReasonKey: "history.endReason.local_hangup",
        durationSec: 90,
        ringDurationSec: 20,
        talkDurationSec: 70,
      },
      language: "en",
      formatClockTime: () => "13:05",
    });

    expect(label).toBe("13:05");
  });
});
