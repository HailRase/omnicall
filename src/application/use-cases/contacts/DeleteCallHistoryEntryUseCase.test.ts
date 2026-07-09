import { describe, expect, it, vi } from "vitest";
import { InMemoryCallHistoryRepository } from "@adapters/settings/InMemoryCallHistoryRepository.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { DeleteCallHistoryEntryUseCase } from "./DeleteCallHistoryEntryUseCase.js";

async function seedHistoryEntry(repository: InMemoryCallHistoryRepository) {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId("call-delete"),
    direction: "incoming",
    remoteNumber: "+12025550147",
    displayLabel: "Alice",
    startedAt: "2026-07-07T10:00:00.000Z",
    endedAt: "2026-07-07T10:01:00.000Z",
    wasAnswered: true,
    answeredAt: "2026-07-07T10:00:20.000Z",
    failed: false,
    localHangup: true,
    remoteCancelBeforeAnswer: false,
  });
  if (!created.ok) {
    throw new Error("expected valid entry");
  }
  await repository.appendEntry(created.value);
  return created.value;
}

describe("DeleteCallHistoryEntryUseCase", () => {
  it("deletes one persisted entry and publishes CallHistoryDeleted", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const entry = await seedHistoryEntry(repository);
    const eventPublisher = new InMemoryDomainEventBus();
    const published = vi.fn();
    eventPublisher.subscribe((event) => {
      published(event);
    });
    const useCase = new DeleteCallHistoryEntryUseCase(
      repository,
      eventPublisher,
      createTestLogger(),
    );

    const result = await useCase.execute({ entryId: entry.id });
    expect(result.ok).toBe(true);
    expect(await repository.listEntries()).toEqual([]);
    expect(published).toHaveBeenCalledOnce();
    expect(published.mock.calls[0]?.[0]?.type).toBe("CallHistoryDeleted");
  });

  it("returns not_found for missing entry", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const useCase = new DeleteCallHistoryEntryUseCase(
      repository,
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const result = await useCase.execute({ entryId: "history-missing" });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("not_found");
  });

  it("returns validation_failed for blank entry id", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const useCase = new DeleteCallHistoryEntryUseCase(
      repository,
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const result = await useCase.execute({ entryId: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("validation_failed");
  });
});
