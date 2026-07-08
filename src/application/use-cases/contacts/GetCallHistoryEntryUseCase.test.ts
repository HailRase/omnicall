import { describe, expect, it } from "vitest";
import { InMemoryCallHistoryRepository } from "@adapters/settings/InMemoryCallHistoryRepository.js";
import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { GetCallHistoryEntryUseCase } from "./GetCallHistoryEntryUseCase.js";

async function seedHistoryEntry(repository: InMemoryCallHistoryRepository) {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId("call-detail"),
    direction: "incoming",
    remoteNumber: "+12025550147",
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
  await repository.appendEntry(created.value);
  return created.value;
}

describe("GetCallHistoryEntryUseCase", () => {
  it("returns one persisted entry by id", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const entry = await seedHistoryEntry(repository);
    const useCase = new GetCallHistoryEntryUseCase(repository, createTestLogger());

    const result = await useCase.execute({ entryId: entry.id });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.id).toBe(entry.id);
    expect(result.value.remoteNumber).toBe("+12025550147");
  });

  it("returns not_found for missing entry", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const useCase = new GetCallHistoryEntryUseCase(repository, createTestLogger());

    const result = await useCase.execute({ entryId: "history-missing" });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("not_found");
  });

  it("returns validation_failed for blank entry id", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const useCase = new GetCallHistoryEntryUseCase(repository, createTestLogger());

    const result = await useCase.execute({ entryId: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("validation_failed");
  });
});
