import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { createCallHistoryRecordedEvent, createCallHistoryDeletedEvent } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { describe, expect, it } from "vitest";
import {
  applyCallHistoryLoaded,
  applyCallHistoryLoadError,
  applyCallHistoryLoading,
  initialCallHistoryProjection,
  reduceCallHistoryProjection,
} from "./callHistoryProjection.js";

function sampleEntry() {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId("call-1"),
    direction: "incoming",
    remoteNumber: "+12025550101",
    displayLabel: null,
    startedAt: "2026-07-07T10:00:00.000Z",
    endedAt: "2026-07-07T10:00:30.000Z",
    wasAnswered: true,
    answeredAt: "2026-07-07T10:00:20.000Z",
    failed: false,
    localHangup: true,
    remoteCancelBeforeAnswer: false,
  });
  if (!created.ok) {
    throw new Error("expected valid entry");
  }
  return created.value;
}

describe("callHistoryProjection", () => {
  it("tracks loading, populated, and error states", () => {
    const loading = applyCallHistoryLoading(initialCallHistoryProjection());
    expect(loading.status).toBe("loading");

    const populated = applyCallHistoryLoaded(loading, [sampleEntry()]);
    expect(populated.status).toBe("populated");
    expect(populated.entries).toHaveLength(1);

    const errored = applyCallHistoryLoadError(populated, "history.error.loadFailed");
    expect(errored.status).toBe("error");
    expect(errored.errorKey).toBe("history.error.loadFailed");
  });

  it("prepends CallHistoryRecorded events without duplicates", () => {
    const entry = sampleEntry();
    const loaded = applyCallHistoryLoaded(initialCallHistoryProjection(), [entry]);

    const updated = reduceCallHistoryProjection(
      loaded,
      createCallHistoryRecordedEvent(createCorrelationId(), {
        ...entry,
        id: "entry-2" as typeof entry.id,
        callId: createCallId("call-2"),
        remoteNumber: "+12025550102",
      }),
    );

    expect(updated.entries).toHaveLength(2);
    expect(updated.entries[0]?.id).toBe("entry-2");
    expect(updated.status).toBe("populated");
  });

  it("removes entries on CallHistoryDeleted events", () => {
    const entry = sampleEntry();
    const loaded = applyCallHistoryLoaded(initialCallHistoryProjection(), [entry]);

    const updated = reduceCallHistoryProjection(
      loaded,
      createCallHistoryDeletedEvent(createCorrelationId(), entry.id),
    );

    expect(updated.entries).toHaveLength(0);
    expect(updated.status).toBe("idle");
  });
});
