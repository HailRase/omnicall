import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
  InMemorySettingsRepository,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";

export type CreateAccountBootstrapOptions = Readonly<{
  bootstrapConfig?: AppBootstrapConfig;
  ocpScenario?:
    | "success"
    | "session_exists"
    | "invalid_token"
    | "access_denied"
    | "network_error";
  telephonyScenario?: "success" | "failure";
  makeCallScenario?:
    | "connecting"
    | "progress_180"
    | "progress_183"
    | "answered"
    | "failed_busy"
    | "failed_rejected"
    | "failed_unavailable";
  dtmfScenario?: "success" | "failure";
  mediaScenario?: "success" | "failure";
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

  const telephonyGateway = new MockTelephonyGateway({
    registrationScenario: options.telephonyScenario ?? "success",
    makeCallScenario: options.makeCallScenario ?? "answered",
    dtmfScenario: options.dtmfScenario ?? "success",
    delayMs: 200,
  });
  const mediaGateway = new MockMediaGateway(options.mediaScenario ?? "success");

  return new AccountBootstrapFacade({
    operatorGateway,
    telephonyGateway,
    mediaGateway,
    settingsRepository,
    logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });
}
