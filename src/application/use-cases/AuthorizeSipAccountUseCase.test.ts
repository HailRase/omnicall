import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { AuthorizeSipAccountUseCase } from "./AuthorizeSipAccountUseCase.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  deriveSettingsAccountKeyFromIdentity,
  resolveSettingsAccountKeyFromSipAccount,
} from "@domain/index.js";
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
        username: "",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
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
        username: "agent",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      source: "manual",
    });

    expect(result.ok).toBe(true);
    expect(published).toContain("SipCredentialsReceived");
  });

  it("sets active profile key from authorized SIP identity", async () => {
    const settings = new InMemorySettingsRepository();
    const useCase = new AuthorizeSipAccountUseCase(
      settings,
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const accountInput = {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    const result = await useCase.execute({
      account: accountInput,
      source: "manual",
    });

    expect(result.ok).toBe(true);
    const expectedKey = deriveSettingsAccountKeyFromIdentity({
      username: accountInput.username,
      domain: accountInput.domain,
      server: accountInput.server,
    });
    expect(await settings.getActiveProfileKey()).toBe(expectedKey);
    if (result.ok) {
      expect(resolveSettingsAccountKeyFromSipAccount(result.value)).toBe(expectedKey);
    }
  });
});
