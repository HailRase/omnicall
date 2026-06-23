import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { ChangePhoneStatusUseCase } from "./ChangePhoneStatusUseCase.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("ChangePhoneStatusUseCase", () => {
  it("publishes PhoneStatusChanged when status updates", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ChangePhoneStatusUseCase(
      new InMemorySettingsRepository({ phoneStatus: "offline" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ nextStatus: "online" });
    expect(result.ok).toBe(true);
    expect(published).toContain("PhoneStatusChanged");
  });

  it("skips event when status is unchanged", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ChangePhoneStatusUseCase(
      new InMemorySettingsRepository({ phoneStatus: "dnd" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ nextStatus: "dnd" });
    expect(result.ok).toBe(true);
    expect(published).toHaveLength(0);
  });
});
