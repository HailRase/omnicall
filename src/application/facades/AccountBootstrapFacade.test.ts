import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("AccountBootstrapFacade integration", () => {
  it("runs SIP-only manual authorize and register flow", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    await facade.authorizeManualAccount({
      username: "agent",
      password: "secret",
      domain: "pbx",
      server: "sip:pbx",
    });

    expect(telephony.isRegistered()).toBe(true);
  });

  it("runs OCP bootstrap through mock gateways", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {
          mode: "ocp",
          ocpToken: "token",
          ocpDomain: "ocp.example",
        },
      }),
      logger: createTestLogger(),
    });

    const result = await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
    });

    expect(isErr(result)).toBe(false);
    await waitFor(() => telephony.isRegistered());
    expect(telephony.isRegistered()).toBe(true);
  });

  it("initializes sip-only startup through ResolveStartupModeUseCase", async () => {
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    await facade.initialize({ mode: "sip-only" });
  });

  it("initializes ocp startup and registers via mock gateways", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {
          mode: "ocp",
          ocpToken: "token",
          ocpDomain: "ocp.example",
        },
      }),
      logger: createTestLogger(),
    });

    await facade.initialize({
      mode: "ocp",
      ocpToken: "token",
      ocpDomain: "ocp.example",
    });

    await waitFor(() => telephony.isRegistered());
    expect(telephony.isRegistered()).toBe(true);
  });

  it("changes phone status through event-driven use case", async () => {
    const settings = new InMemorySettingsRepository({ phoneStatus: "offline" });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.setPhoneStatus("dnd");
    expect((await settings.getPhoneStatus())).toBe("dnd");
  });

  it("updates multi-call settings through facade without Use Case", async () => {
    const settings = new InMemorySettingsRepository({
      multiCallSettings: {
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: true,
      },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const updated = await facade.updateMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });

    expect(updated).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect(await settings.getMultiCallSettings()).toEqual(updated);
  });

  it("reads and saves user settings aggregate through facade", async () => {
    const settings = new InMemorySettingsRepository();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const loaded = await facade.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const saved = await facade.saveUserSettings({
      ...loaded.value,
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 4,
    });
    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.value.multiSessionsEnabled).toBe(false);
      expect(saved.value.autoAnswerTimeoutSec).toBe(4);
    }
  });

  it("refreshes multi-call projection from persisted user settings", async () => {
    const settings = new InMemorySettingsRepository();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.updateMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });

    let projection: { multiSessionsEnabled: boolean } | null = null;
    await facade.refreshUserSettingsProjections({
      applyMultiCallSettings: (value) => {
        projection = value;
      },
    });

    expect(projection).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
  });
});

function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = (): void => {
      if (predicate()) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Condition was not met in time"));
        return;
      }

      setTimeout(tick, 10);
    };

    tick();
  });
}
