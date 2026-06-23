import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
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
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    await facade.authorizeManualAccount({
      uri: "sip:agent@pbx",
      username: "agent",
      password: "secret",
      displayName: "Agent",
      registrar: "sip:pbx",
    });

    expect(telephony.isRegistered()).toBe(true);
  });

  it("runs OCP bootstrap through mock gateways", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: telephony,
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
