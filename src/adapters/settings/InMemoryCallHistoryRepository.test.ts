import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { MAX_CALL_HISTORY_ENTRIES } from "@domain/settings/CallHistoryRetention.js";
import { InMemoryCallHistoryRepository } from "@adapters/settings/InMemoryCallHistoryRepository.js";
import { describe, expect, it } from "vitest";

describe("InMemoryCallHistoryRepository", () => {
  it("enforces retention limit", async () => {
    const repository = new InMemoryCallHistoryRepository();

    for (let index = 0; index < MAX_CALL_HISTORY_ENTRIES + 5; index += 1) {
      const created = createCallHistoryEntryFromSession({
        callId: createCallId(`call-${index}`),
        direction: "outgoing",
        remoteNumber: `+1202555${String(index).padStart(4, "0")}`,
        displayLabel: null,
        startedAt: "2026-07-07T10:00:00.000Z",
        endedAt: "2026-07-07T10:01:00.000Z",
        wasAnswered: true,
        failed: false,
        missedBeforeAnswer: false,
      });
      if (!created.ok) {
        throw new Error("expected valid entry");
      }
      await repository.appendEntry(created.value);
    }

    const entries = await repository.listEntries();
    expect(entries).toHaveLength(MAX_CALL_HISTORY_ENTRIES);
    expect(entries[0]?.callId).toBe(createCallId(`call-${MAX_CALL_HISTORY_ENTRIES + 4}`));
  });
});
