import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
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

  it("sets active profile key from authorized SIP identity when promotion is enabled", async () => {
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

  it("does not change active profile key when promotion is deferred", async () => {
    const settings = new InMemorySettingsRepository();
    const previousKey = deriveSettingsAccountKeyFromIdentity({
      username: "active",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await settings.setActiveProfileKey(previousKey);

    const useCase = new AuthorizeSipAccountUseCase(
      settings,
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const result = await useCase.execute({
      account: {
        username: "candidate",
        password: "secret",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
      source: "manual",
      promoteActiveSession: false,
    });

    expect(result.ok).toBe(true);
    expect(await settings.getActiveProfileKey()).toBe(previousKey);
    expect(await settings.getSipAccount()).toBeNull();
  });

  it("ocp source skips ManualSipAuthorizationRequested and omits password from events", async () => {
    const events = new InMemoryDomainEventBus();
    const published: Array<{ type: string; password?: string }> = [];
    events.subscribe((event) => {
      const credentials = event["credentials"];
      const password =
        typeof credentials === "object" &&
        credentials !== null &&
        "password" in credentials &&
        typeof credentials.password === "string"
          ? credentials.password
          : undefined;
      published.push({ type: event.type, ...(password !== undefined ? { password } : {}) });
    });

    const useCase = new AuthorizeSipAccountUseCase(
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      account: {
        username: "ocp-user",
        password: "ocp-secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      source: "ocp",
    });

    expect(result.ok).toBe(true);
    expect(published.map((entry) => entry.type)).not.toContain(
      "ManualSipAuthorizationRequested",
    );
    expect(published.map((entry) => entry.type)).toContain("SipCredentialsReceived");
    const credsEvent = published.find((entry) => entry.type === "SipCredentialsReceived");
    expect(credsEvent?.password).toBeUndefined();
  });

  it("manual source omits password from all events", async () => {
    const events = new InMemoryDomainEventBus();
    const serializedEvents: string[] = [];
    events.subscribe((event) => {
      serializedEvents.push(JSON.stringify(event));
    });
    const useCase = new AuthorizeSipAccountUseCase(
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      account: {
        username: "manual-user",
        password: "never-publish-this-secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      source: "manual",
    });

    expect(result.ok).toBe(true);
    expect(serializedEvents.join("\n")).not.toContain("never-publish-this-secret");
    expect(serializedEvents.join("\n")).not.toContain('"password"');
  });
});
