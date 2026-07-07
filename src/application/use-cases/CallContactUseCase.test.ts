import { describe, expect, it } from "vitest";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";
import { CallContactUseCase } from "./CallContactUseCase.js";
import { MakeCallUseCase } from "./MakeCallUseCase.js";

describe("CallContactUseCase", () => {
  it("calls contact primary phone through MakeCallUseCase", async () => {
    const repository = new InMemoryContactRepository();
    const created = await repository.createContact({
      displayName: "Alex Agent",
      primaryPhone: "+12025550100",
    });
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
    const useCase = new CallContactUseCase(repository, makeCallUseCase, createTestLogger());

    const result = await useCase.execute({ contactId: created.id });
    expect(result.ok).toBe(true);
    expect(telephony.getDialedNumbers()).toEqual(["+12025550100"]);
  });

  it("returns not_found for missing contact", async () => {
    const repository = new InMemoryContactRepository();
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
    const useCase = new CallContactUseCase(repository, makeCallUseCase, createTestLogger());

    const result = await useCase.execute({ contactId: "missing-id" });
    expect(isErr(result)).toBe(true);
  });

  it("rejects invalid contact id", async () => {
    const repository = new InMemoryContactRepository();
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
    const useCase = new CallContactUseCase(repository, makeCallUseCase, createTestLogger());

    const result = await useCase.execute({ contactId: "bad id" });
    expect(isErr(result)).toBe(true);
  });
});
