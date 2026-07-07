import { describe, expect, it } from "vitest";
import { InMemoryCallHistoryRepository } from "@adapters/settings/InMemoryCallHistoryRepository.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId } from "@domain/index.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";
import { ListCallHistoryUseCase } from "./ListCallHistoryUseCase.js";
import { MakeCallUseCase } from "./MakeCallUseCase.js";
import { RedialFromHistoryUseCase } from "./RedialFromHistoryUseCase.js";

async function seedHistoryEntry(repository: InMemoryCallHistoryRepository) {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId("call-redial"),
    direction: "outgoing",
    remoteNumber: "+12025550147",
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
  return created.value;
}

describe("Call History Use Cases", () => {
  it("lists persisted entries newest-first from repository order", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const entry = await seedHistoryEntry(repository);
    const useCase = new ListCallHistoryUseCase(repository, createTestLogger());

    const result = await useCase.execute();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.id).toBe(entry.id);
  });

  it("redials through MakeCallUseCase on stored remote number", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const entry = await seedHistoryEntry(repository);
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const makeCallUseCase = new MakeCallUseCase(
      new CallEngine(
        telephony,
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );
    const useCase = new RedialFromHistoryUseCase(repository, makeCallUseCase, createTestLogger());

    const result = await useCase.execute({ entryId: entry.id });
    expect(result.ok).toBe(true);
    expect(telephony.getDialedNumbers()).toEqual(["+12025550147"]);
  });

  it("returns not_found for missing history entry", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const makeCallUseCase = new MakeCallUseCase(
      new CallEngine(
        new MockTelephonyGateway(),
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );
    const useCase = new RedialFromHistoryUseCase(repository, makeCallUseCase, createTestLogger());

    const result = await useCase.execute({ entryId: "missing-entry" });
    expect(isErr(result)).toBe(true);
  });

  it("rejects invalid history entry id", async () => {
    const repository = new InMemoryCallHistoryRepository();
    const makeCallUseCase = new MakeCallUseCase(
      new CallEngine(
        new MockTelephonyGateway(),
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );
    const useCase = new RedialFromHistoryUseCase(repository, makeCallUseCase, createTestLogger());

    const result = await useCase.execute({ entryId: "   " });
    expect(isErr(result)).toBe(true);
  });
});
