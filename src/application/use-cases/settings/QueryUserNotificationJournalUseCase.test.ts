import { describe, expect, it } from "vitest";
import { InMemoryUserNotificationJournalRepository } from "@adapters/settings/InMemoryUserNotificationJournalRepository.js";
import {
  createSettingsAccountKey,
  createUserNotificationJournalEntryId,
} from "@domain/index.js";
import { QueryUserNotificationJournalUseCase } from "./QueryUserNotificationJournalUseCase.js";

const NOW_MS = Date.parse("2026-07-17T12:00:00.000Z");

describe("QueryUserNotificationJournalUseCase", () => {
  it("returns local-part account labels for table rows and identity filters", async () => {
    const repository = new InMemoryUserNotificationJournalRepository();
    const id = createUserNotificationJournalEntryId("entry-query-1");
    if (id === null) {
      throw new Error("test notification id is invalid");
    }
    await repository.appendEntry(
      {
        id,
        emittedAt: new Date(NOW_MS).toISOString(),
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        accountDisplayLabel: "agent@pbx.example",
        level: "info",
        module: "system",
        functionId: "system.boot",
        titleKey: null,
        titleParams: {},
        titleSnapshot: "Boot complete",
        suppressedAtEmission: false,
        correlationId: null,
      },
      NOW_MS,
    );

    const outcome = await new QueryUserNotificationJournalUseCase(repository).execute({
      nowMs: NOW_MS,
    });

    expect(outcome.entries).toHaveLength(1);
    expect(outcome.entries[0]?.accountDisplayLabel).toBe("agent");
    expect(outcome.identities).toEqual([
      {
        accountKey: createSettingsAccountKey("agent@pbx.example"),
        displayLabel: "agent",
      },
    ]);
  });
});
