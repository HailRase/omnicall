import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
  InMemorySettingsRepository,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";

export type CreateAccountBootstrapOptions = Readonly<{
  bootstrapConfig?: AppBootstrapConfig;
  ocpScenario?: "success" | "session_exists" | "invalid_token" | "access_denied";
  telephonyScenario?: "success" | "failure";
}>;

export function createAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = new InMemorySettingsRepository({
    bootstrapConfig: options.bootstrapConfig ?? { mode: "sip-only" },
  });

  const operatorGateway = new MockOperatorPlatformGateway({
    scenario: options.ocpScenario ?? "success",
    delayMs: 300,
  });

  const telephonyGateway = new MockTelephonyGateway(
    options.telephonyScenario ?? "success",
    200,
  );

  return new AccountBootstrapFacade({
    operatorGateway,
    telephonyGateway,
    settingsRepository,
    logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });
}
