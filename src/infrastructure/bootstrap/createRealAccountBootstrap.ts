import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  MockHostIntegrationGateway,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  JsSipTelephonyAdapter,
  InMemorySettingsRepository,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";

/**
 * - Purpose: compose real-adapter AccountBootstrapFacade with JsSIP telephony gateway.
 * - Inputs: bootstrap config and optional mock scenario overrides for non-SIP gateways.
 * - Outputs: wired AccountBootstrapFacade ready for initialize().
 */
export function createRealAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = new InMemorySettingsRepository({
    bootstrapConfig: options.bootstrapConfig ?? { mode: "sip-only" },
  });

  const operatorGateway = new MockOperatorPlatformGateway({
    scenario: options.ocpScenario ?? "success",
    delayMs: 300,
  });

  const telephonyGateway = new JsSipTelephonyAdapter({
    logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });
  const mediaGateway = new MockMediaGateway(options.mediaScenario ?? "success");
  const hostIntegrationGateway = new MockHostIntegrationGateway();

  return new AccountBootstrapFacade({
    operatorGateway,
    telephonyGateway,
    mediaGateway,
    settingsRepository,
    hostIntegrationGateway,
    logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });
}
