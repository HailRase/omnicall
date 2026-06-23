import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { AuthorizeSipAccountUseCase } from "./AuthorizeSipAccountUseCase.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("AuthorizeSipAccountUseCase", () => {
  it("rejects missing username with access denied message", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new AuthorizeSipAccountUseCase(
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      account: {
        uri: "",
        username: "",
        password: "secret",
        displayName: "",
        registrar: "sip:pbx",
      },
      source: "manual",
    });

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) {
      return;
    }

    expect(result.error.message).toContain("username is required");
    expect(published).toContain("ManualSipAuthorizationRequested");
    expect(published).toContain("AccessDeniedDetected");
  });

  it("publishes SipCredentialsReceived on success", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new AuthorizeSipAccountUseCase(
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      account: {
        uri: "sip:agent@pbx",
        username: "agent",
        password: "secret",
        displayName: "Agent",
        registrar: "sip:pbx",
      },
      source: "manual",
    });

    expect(result.ok).toBe(true);
    expect(published).toContain("SipCredentialsReceived");
  });
});
